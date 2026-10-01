import { Router, Request, Response, NextFunction } from 'express';
import { gameServer } from '../providers/game-server.js';

export type PanelRole = 'admin' | 'upper staff' | 'owner';
declare module 'express-session' {
  interface SessionData { user?: { id: string; username: string; avatar?: string; role: PanelRole } }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export const dashboardRouter = Router();
dashboardRouter.get('/me', requireAuth, (req, res) => res.json(req.session.user));
dashboardRouter.get('/server', requireAuth, async (_req, res) => {
  try { res.json(await gameServer.status()); }
  catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'Server status unavailable' }); }
});

dashboardRouter.post('/server/command', requireAuth, async (req, res) => {
  const command = typeof req.body?.command === 'string' ? req.body.command.trim() : '';
  if (!command || command.length > 200) return res.status(400).json({ error: 'Invalid command' });
  if (req.session.user?.role === 'admin' && /restart|shutdown|ban|kick/i.test(command)) {
    return res.status(403).json({ error: 'Admins cannot execute this command' });
  }
  res.json(await gameServer.command(command));
});
