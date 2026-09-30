import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'development-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

app.use(express.static('public'));
app.use('/auth', authRouter);
app.use('/api', dashboardRouter);

app.get('/health', (_req, res) => res.json({ ok: true, service: 'twisted-isle-panel' }));

app.listen(port, () => console.log(`Twisted Isle Panel listening on ${process.env.BASE_URL ?? `http://localhost:${port}`}`));
