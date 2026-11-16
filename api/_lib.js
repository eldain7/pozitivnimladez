// Shared helpers for the CMS API (files starting with "_" are not exposed as routes on Vercel).
import crypto from 'node:crypto';

export const COOKIE = 'pm_s';
const DAY = 864e5;

/** ADMIN_USERS="janek:heslo1,pavel:heslo2,martin:heslo3,tomas:heslo4" */
function users() {
  const out = {};
  (process.env.ADMIN_USERS || '').split(',').forEach((pair) => {
    const i = pair.indexOf(':');
    if (i > 0) out[pair.slice(0, i).trim().toLowerCase()] = pair.slice(i + 1).trim();
  });
  return out;
}

export function configProblems() {
  const p = [];
  if (!process.env.ADMIN_USERS) p.push('ADMIN_USERS');
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) p.push('SESSION_SECRET');
  if (!process.env.BLOB_READ_WRITE_TOKEN) p.push('BLOB_READ_WRITE_TOKEN');
  return p;
}

function eq(a, b) {
  const A = crypto.createHash('sha256').update(String(a)).digest();
  const B = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(A, B);
}

export function checkLogin(user, pass) {
  const key = String(user || '').trim().toLowerCase();
  const expected = users()[key];
  if (!expected) { eq('x', 'y'); return null; }
  return eq(String(pass || ''), expected) ? key : null;
}

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET is missing or too short');
  return s;
}

function sign(user) {
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + 30 * DAY })).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return payload + '.' + mac;
}

function verify(token) {
  if (!token) return null;
  const [p, m] = token.split('.');
  if (!p || !m) return null;
  const mac = crypto.createHmac('sha256', secret()).update(p).digest('base64url');
  if (mac.length !== m.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(m))) return null;
  try {
    const o = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (!o || o.exp < Date.now() || !users()[o.u]) return null;
    return o.u;
  } catch { return null; }
}

function getCookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function currentUser(req) {
  try { return verify(getCookie(req, COOKIE)); } catch { return null; }
}

export function setSession(res, user) {
  res.setHeader('Set-Cookie', `${COOKIE}=${sign(user)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${30 * 86400}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

export function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

export function json(res, code, obj, headers = {}) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const k of Object.keys(headers)) res.setHeader(k, headers[k]);
  res.end(JSON.stringify(obj));
}

/* ---------- content validation ---------- */
const BLOB_RE = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>]+$/i;
const LOCAL_RE = /^(img|audio)\/[a-z0-9._-]+$/i;
const str = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const media = (u) => { u = str(u, 600); return BLOB_RE.test(u) || LOCAL_RE.test(u) ? u : ''; };
const link = (u) => { u = str(u, 600); return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; };
const id = (v) => str(v, 40).replace(/[^a-z0-9_-]/gi, '') || crypto.randomBytes(5).toString('hex');
const pct = (v) => (/^\d{1,3}% \d{1,3}%$/.test(String(v || '')) ? String(v) : '50% 50%');

export function sanitize(c = {}) {
  return {
    concerts: arr(c.concerts, 200).map((x) => ({
      id: id(x.id),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.date || '')) ? String(x.date) : '',
      time: /^\d{1,2}:\d{2}$/.test(String(x.time || '')) ? String(x.time) : '',
      venue: str(x.venue, 140),
      note: str(x.note, 220),
      city: str(x.city, 80),
      tickets: link(x.tickets),
      soldOut: !!x.soldOut,
    })).filter((x) => x.date && x.venue),
    tracks: arr(c.tracks, 60).map((x) => ({
      id: id(x.id), title: str(x.title, 100) || 'Bez názvu', src: media(x.src),
      duration: Math.max(0, Math.min(7200, Math.round(+x.duration || 0))),
    })).filter((x) => x.src),
    hero: arr(c.hero, 40).map((x) => ({ id: id(x.id), src: media(x.src), mpos: pct(x.mpos), mobileOnly: !!x.mobileOnly })).filter((x) => x.src),
    gallery: arr(c.gallery, 120).map((x) => ({ id: id(x.id), src: media(x.src), alt: str(x.alt, 160) })).filter((x) => x.src),
  };
}

export function isOwnBlob(u) { return typeof u === 'string' && BLOB_RE.test(u) && !u.includes('/cms/'); }
