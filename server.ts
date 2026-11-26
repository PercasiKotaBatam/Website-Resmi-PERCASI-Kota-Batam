import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAdminAuthService } from './serverAuth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();
const authService = createAdminAuthService();

app.use(express.json({ limit: '64kb' }));

// Simple in-memory rate limit for auth attempts per IP
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 15;
const WINDOW_MS = 5 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = authAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    authAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

app.get('/api/admin/status', (_req, res) => {
  res.json(authService.getStatus());
});

app.post('/api/admin/setup', (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      error: 'Terlalu banyak percobaan. Silakan coba lagi beberapa menit lagi.',
    });
    return;
  }

  const body = req.body as Record<string, unknown> | undefined;
  const username = typeof body?.username === 'string' ? body.username : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const result = authService.setupFirstAdmin(username, password);
  if (result.ok === false) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.status(201).json({
    token: result.token,
    username: result.username,
    source: authService.getStatus().source,
  });
});

app.post('/api/admin/login', (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      error: 'Terlalu banyak percobaan masuk. Silakan coba lagi beberapa menit lagi.',
    });
    return;
  }

  const body = req.body as Record<string, unknown> | undefined;
  const username = typeof body?.username === 'string' ? body.username : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const result = authService.login(username, password);
  if (result.ok === false) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  authAttempts.delete(clientIp);
  res.json({
    token: result.token,
    username: result.username,
    source: authService.getStatus().source,
  });
});

app.get('/api/admin/session', (req, res) => {
  const check = authService.verifyBearerToken(req.headers.authorization);
  if (!check.valid) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, username: check.username });
});

app.post('/api/admin/logout', (req, res) => {
  authService.revokeBearerToken(req.headers.authorization);
  res.json({ ok: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PERCASI Kota Batam portal listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
