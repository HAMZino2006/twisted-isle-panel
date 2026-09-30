import { Router } from 'express';

export type PanelRole = 'admin' | 'upper staff' | 'owner';

export const authRouter = Router();

const scopes = encodeURIComponent('identify guilds.members.read');

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

authRouter.get('/discord', (_req, res) => {
  const params = new URLSearchParams({
    client_id: required('DISCORD_CLIENT_ID'),
    redirect_uri: required('DISCORD_REDIRECT_URI'),
    response_type: 'code',
    scope: decodeURIComponent(scopes)
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

authRouter.get('/discord/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : undefined;
  if (!code) return res.status(400).send('Codice OAuth Discord mancante.');

  const body = new URLSearchParams({
    client_id: required('DISCORD_CLIENT_ID'),
    client_secret: required('DISCORD_CLIENT_SECRET'),
    grant_type: 'authorization_code',
    code,
    redirect_uri: required('DISCORD_REDIRECT_URI')
  });

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!tokenResponse.ok) return res.status(401).send('Autenticazione Discord non riuscita.');
  const token = await tokenResponse.json() as { access_token: string; token_type: string };

  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `${token.token_type} ${token.access_token}` }
  });
  const user = await userResponse.json() as { id: string; username: string; avatar?: string };

  const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${required('DISCORD_GUILD_ID')}/member`, {
    headers: { Authorization: `${token.token_type} ${token.access_token}` }
  });
  if (!memberResponse.ok) return res.status(403).send('Non appartieni al server Discord Twisted Isle.');
  const member = await memberResponse.json() as { roles?: string[] };
  
  const roleMap: Array<[string, PanelRole]> = [
    ['DISCORD_OWNER_ROLE_ID', 'owner'],
    ['DISCORD_UPPER_STAFF_ROLE_ID', 'upper staff'],
    ['DISCORD_ADMIN_ROLE_ID', 'admin']
  ];
  const foundRole = roleMap.find(([env]) => member.roles?.includes(process.env[env] ?? ''));
  const role: PanelRole | undefined = foundRole?.[1];
  
  if (!role) return res.status(403).send('Non hai un ruolo autorizzato.');

  req.session.user = { id: user.id, username: user.username, avatar: user.avatar, role };
  res.redirect('/');
});

authRouter.post('/logout', (req, res) => req.session.destroy(() => res.status(204).end()));
