import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public');

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'development-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 86400000 }
}));

app.use(express.static(publicDirectory));
app.use('/auth', authRouter);
app.use('/api', dashboardRouter);
app.get(['/health', '/healthz'], (_req, res) => res.json({ ok: true, service: 'twisted-isle-panel' }));

// Client-side navigation uses these paths. The same app shell is returned for every panel view.
app.get(['/dashboard', '/server', '/players', '/logs', '/commands', '/rcon', '/config', '/discord'], (_req, res) => {
  res.sendFile(path.join(publicDirectory, 'index.html'));
});

app.listen(port, '0.0.0.0', () => console.log(`Twisted Isle Panel listening on port ${port}`));
