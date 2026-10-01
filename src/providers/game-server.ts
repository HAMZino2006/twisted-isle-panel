import { Rcon } from 'rcon-client';

export interface ServerStatus {
  online: boolean;
  players: number;
  maxPlayers: number;
  version: string;
  provider: string;
  raw?: string;
  error?: string;
}

export interface GameServerProvider {
  status(): Promise<ServerStatus>;
  command(command: string): Promise<{ accepted: boolean; message: string }>;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function parsePlayers(response: string): { players: number; maxPlayers: number } {
  const text = response.replace(/\r/g, ' ');
  const match = text.match(/(?:players?|online)\s*[:=]?\s*(\d+)\s*(?:\/|of)\s*(\d+)/i)
    ?? text.match(/(\d+)\s*\/\s*(\d+)\s*(?:players?|online)/i);
  if (match) return { players: Number(match[1]), maxPlayers: Number(match[2]) };

  const listedPlayers = text.split('\n').filter((line) => /^\s*\d+\s*[|:,-]/.test(line)).length;
  return { players: listedPlayers, maxPlayers: Number(process.env.RCON_MAX_PLAYERS ?? 0) };
}

class RconGameServerProvider implements GameServerProvider {
  private async send(command: string): Promise<string> {
    const rcon = await Rcon.connect({
      host: required('RCON_HOST'),
      port: Number(process.env.RCON_PORT ?? 13312),
      password: required('RCON_PASSWORD')
    });
    try {
      return await rcon.send(command);
    } finally {
      await rcon.end();
    }
  }

  async status(): Promise<ServerStatus> {
    try {
      const raw = await this.send(process.env.RCON_STATUS_COMMAND ?? 'listplayers');
      const parsed = parsePlayers(raw);
      return {
        online: true,
        players: parsed.players,
        maxPlayers: parsed.maxPlayers,
        version: 'Evrima',
        provider: 'RCON',
        raw
      };
    } catch (error) {
      return {
        online: false,
        players: 0,
        maxPlayers: Number(process.env.RCON_MAX_PLAYERS ?? 0),
        version: 'Evrima',
        provider: 'RCON',
        error: error instanceof Error ? error.message : 'RCON connection failed'
      };
    }
  }

  async command(command: string) {
    try {
      const message = await this.send(command);
      return { accepted: true, message };
    } catch (error) {
      return { accepted: false, message: error instanceof Error ? error.message : 'RCON command failed' };
    }
  }
}

export const gameServer: GameServerProvider = new RconGameServerProvider();
