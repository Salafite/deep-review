#!/usr/bin/env node
/**
 * deep-review · serve-viewer.mjs
 *
 * Zero-dependency local dashboard server for deep-review transcripts and audit runs.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';

const PORT = 3333;
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const HTML_FILE = path.join(SCRIPT_DIR, 'viewer.html');

function findLatestRun() {
  const cacheBase = path.join(os.homedir(), '.cache', 'debate-review');
  if (!fs.existsSync(cacheBase)) return null;

  let latestFile = null;
  let latestMtime = 0;

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scan(full);
      } else if (ent.isFile() && ent.name === 'run.json') {
        const stat = fs.statSync(full);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestFile = full;
        }
      }
    }
  }

  try {
    scan(cacheBase);
  } catch {}
  return latestFile;
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(HTML_FILE).pipe(res);
    return;
  }

  if (req.url === '/api/latest') {
    const latestRunPath = findLatestRun();
    if (latestRunPath && fs.existsSync(latestRunPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      fs.createReadStream(latestRunPath).pipe(res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No audit runs found in cache' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`🌐 [deep-review] Dashboard server running at: ${url}`);
  console.log(`   Press Ctrl+C to stop.`);

  // Attempt to open browser automatically
  const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  exec(`${startCmd} ${url}`);
});
