import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createStore } from './db/store.mjs';
import { bootstrap, getSession, HttpError, removeExpiredWorkspaces, routeApi } from './api.mjs';

const publicDir = fileURLToPath(new URL('./public', import.meta.url));
const defaultDB = fileURLToPath(new URL('./data/mindbridge.sqlite', import.meta.url));
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
};
const maximumBody = 3 * 1024 * 1024;
const writeMethods = new Set(['POST', 'PATCH', 'DELETE']);

function getCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim().split('=')).filter(([name, value]) => ['mb_session', 'mb_demo'].includes(name) && /^[\w-]{32,80}$/.test(value || '')));
}
function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' });
  response.end(JSON.stringify(data));
}
async function readBody(request) {
  if (!writeMethods.has(request.method)) return {};
  if (!Number(request.headers['content-length'] || 0) && !request.headers['transfer-encoding']) return {};
  if (!(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'โปรดส่งข้อมูลในรูปแบบ JSON');
  if (Number(request.headers['content-length']) > maximumBody) throw new HttpError(413, 'ข้อมูลมีขนาดใหญ่เกินไป');
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximumBody) throw new HttpError(413, 'ข้อมูลมีขนาดใหญ่เกินไป');
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid object');
    return data;
  } catch {
    throw new HttpError(400, 'อ่านข้อมูลที่ส่งมาไม่ได้');
  }
}

function rateLimiter() {
  const buckets = new Map();
  return (key, maximum, duration = 60000) => {
    const current = Date.now();
    if (buckets.size > 1000) for (const [id, entry] of buckets) if (entry.end <= current) buckets.delete(id);
    const existing = buckets.get(key);
    if (existing && existing.end > current) {
      if (++existing.requests > maximum) throw new HttpError(429, 'ลองใหม่อีกครั้งในอีกสักครู่');
      return;
    }
    buckets.set(key, { end: current + duration, requests: 1 });
  };
}

const envConfig = () => ({
  dbPath: process.env.APP_DB || defaultDB,
  port: Number(process.env.APP_PORT ?? process.env.PORT ?? 4173),
  host: process.env.APP_HOST || '127.0.0.1',
  origin: process.env.APP_ORIGIN || '',
  secureCookie: process.env.APP_SECURE_COOKIE === '1',
  inviteCode: process.env.APP_INVITE_CODE || '',
  adminEmail: process.env.APP_ADMIN_EMAIL || '',
  adminPassword: process.env.APP_ADMIN_PASSWORD || '',
  schoolName: process.env.APP_SCHOOL_NAME || '',
  allowDemo: process.env.APP_ALLOW_DEMO !== '0',
});

async function servePage(request, response, url, user) {
  if (!['GET', 'HEAD'].includes(request.method)) throw new HttpError(405, 'หน้านี้ไม่รองรับการทำรายการนี้');
  const role = /^\/(student|teacher|admin)(?:\/|$)/.exec(url.pathname)?.[1];
  if (role && user?.role !== role) {
    const page = user ? `/${user.role}/dashboard` : `/login/${role}`;
    response.writeHead(302, { Location: page, 'Cache-Control': 'no-store' });
    response.end();
    return;
  }
  const pathname = decodeURIComponent(url.pathname);
  const extension = extname(pathname);
  const target = extension ? resolve(publicDir, `.${pathname}`) : resolve(publicDir, 'index.html');
  if (!target.startsWith(publicDir + sep) || !contentTypes[extname(target)]) throw new HttpError(404, 'ไม่พบหน้านี้');
  let file;
  try {
    if (!(await stat(target)).isFile()) throw new Error('Not a file');
    file = await readFile(target);
  } catch (error) {
    if (url.pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    if (error.code && error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    throw new HttpError(404, 'ไม่พบหน้านี้');
  }
  response.writeHead(200, { 'Content-Type': contentTypes[extname(target)], 'Content-Length': file.length, 'Cache-Control': extension ? 'public, max-age=300' : 'no-store' });
  response.end(request.method === 'HEAD' ? undefined : file);
}

export function createApp(options = {}) {
  const config = { ...envConfig(), ...options };
  if (config.origin) config.origin = new URL(config.origin).origin;
  const store = createStore(config.dbPath);
  let school;
  try { school = bootstrap(store, config); } catch (error) { store.close(); throw error; }
  const limit = rateLimiter();
  const server = createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=()');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'");
    try {
      const url = new URL(request.url, 'http://localhost');
      const cookies = getCookies(request.headers.cookie);
      const user = getSession(store, cookies.mb_session);
      if (!url.pathname.startsWith('/api/')) {
        await servePage(request, response, url, user);
        return;
      }
      const [, , action, id, suffix, ...extra] = url.pathname.split('/');
      if (extra.length || !action) throw new HttpError(404, 'ไม่พบหน้านี้');
      const method = request.method;
      if (writeMethods.has(method)) {
        const origin = request.headers.origin;
        const browserOrigin = config.origin || `${config.secureCookie ? 'https' : 'http'}://${request.headers.host}`;
        if (origin && origin !== browserOrigin || request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'คำขอนี้ไม่ได้ส่งจากหน้าของ MindBridge');
      }
      const key = request.socket.remoteAddress || 'local';
      if (['login', 'recover', 'register'].includes(action) && method === 'POST') limit(`auth:${key}`, 24, 5 * 60000);
      if (action === 'demo' && method === 'POST') limit(`demo:${key}`, 60);
      if (writeMethods.has(method) && user) limit(`user:${user.id}`, 120);
      const body = await readBody(request);
      const headers = [];
      const cookie = (name, value, maxAge) => headers.push(`${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${config.secureCookie ? '; Secure' : ''}`);
      const session = writeMethods.has(method) ? getSession(store, cookies.mb_session) : user;
      const answer = routeApi({ s: store, school, config, user: session, body, cookie, cookies, action, id, suffix, method, query: url.searchParams });
      if (headers.length) response.setHeader('Set-Cookie', headers);
      if (answer.binary) {
        response.writeHead(200, { 'Content-Type': answer.contentType, 'Cache-Control': 'private, no-store', 'Content-Length': answer.binary.length });
        response.end(answer.binary);
        return;
      }
      json(response, 200, answer);
    } catch (error) {
      const status = Number(error.status) || (error instanceof URIError ? 400 : 500);
      if (status >= 500) console.error('MindBridge:', error.code || error.name, error.message);
      if (!response.headersSent) json(response, status, { message: status === 500 ? 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่' : error.message });
      else response.destroy();
    }
  });
  const cleanup = setInterval(() => {
    try { removeExpiredWorkspaces(store); } catch (error) { console.error('MindBridge cleanup:', error.code || error.name); }
  }, 3600000);
  cleanup.unref();
  server.on('close', () => { clearInterval(cleanup); store.close(); });
  return { server, store, config };
}

export async function startServer(options = {}) {
  const app = createApp(options);
  await new Promise((resolveListen, reject) => {
    app.server.once('error', reject);
    app.server.listen(app.config.port, app.config.host, () => {
      app.server.off('error', reject);
      resolveListen();
    });
  });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { server, config } = await startServer();
    console.log(`MindBridge เปิดใช้งานที่ http://${config.host}:${server.address().port}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
