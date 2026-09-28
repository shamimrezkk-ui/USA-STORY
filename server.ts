import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/apiRouter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Mount Gemini API endpoints
  app.use('/api/gemini', apiRouter);

  // Health check endpoint for container liveness / readiness probes
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  const distPath = path.join(__dirname, 'dist');
  const distHtmlPath = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(distHtmlPath);

  if (isProduction && fs.existsSync(distHtmlPath)) {
    console.log('[Server] Serving production static build from dist/');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distHtmlPath);
    });
  } else {
    console.log('[Server] Starting Vite in dev middleware mode...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`USA Story Cinematic AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
