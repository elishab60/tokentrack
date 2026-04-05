import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { api } from './api/routes.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createServer(port: number) {
  const app = new Hono();

  // API routes
  app.route('/', api);

  // Static files — serve built web assets
  // When running via tsx: __dirname = src/, built assets in dist/web/
  // When running via node dist/: __dirname = dist/, built assets in dist/web/
  const candidates = [
    join(__dirname, '..', 'dist', 'web'),            // from src/ -> dist/web/ (dev via tsx)
    join(__dirname, 'web'),                          // dist/web/ (production)
  ];
  const webDir = candidates.find(d => existsSync(join(d, 'index.html'))) || candidates[0];

  app.get('/*', async (c) => {
    const urlPath = new URL(c.req.url).pathname;

    // Try to serve the file from webDir
    const filePath = join(webDir, urlPath === '/' ? 'index.html' : urlPath);

    if (existsSync(filePath)) {
      const content = readFileSync(filePath);
      const ext = filePath.split('.').pop() || '';
      const mimeTypes: Record<string, string> = {
        html: 'text/html',
        js: 'application/javascript',
        css: 'text/css',
        json: 'application/json',
        png: 'image/png',
        svg: 'image/svg+xml',
        ico: 'image/x-icon',
      };
      return new Response(content, {
        headers: { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' },
      });
    }

    // SPA fallback
    const indexPath = join(webDir, 'index.html');
    if (existsSync(indexPath)) {
      return new Response(readFileSync(indexPath), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return c.text('Not found', 404);
  });

  return new Promise<{ port: number }>((resolve) => {
    const tryPort = (p: number) => {
      const server = serve({ fetch: app.fetch, port: p });
      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`  Port ${p} in use, trying ${p + 1}...`);
          tryPort(p + 1);
        } else {
          throw err;
        }
      });
      server.on('listening', () => {
        resolve({ port: p });
      });
    };
    tryPort(port);
  });
}
