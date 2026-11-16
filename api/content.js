import { put, head, del } from '@vercel/blob';
import { currentUser, json, sameOrigin, sanitize, isOwnBlob } from './_lib.js';

const PATH = 'cms/content.json';

/** Public URL of the content file, derived from the store id in the token (avoids an API call per page view). */
function directUrl() {
  if (process.env.CONTENT_URL) return process.env.CONTENT_URL;
  const m = /^vercel_blob_rw_([a-z0-9]+)_/i.exec(process.env.BLOB_READ_WRITE_TOKEN || '');
  return m ? `https://${m[1].toLowerCase()}.public.blob.vercel-storage.com/${PATH}` : null;
}

/** Exact current version (used when saving, so conflict checks never see a cached copy). */
async function readExact() {
  try {
    const h = await head(PATH);
    const r = await fetch(`${h.url}?v=${new Date(h.uploadedAt).getTime()}`, { cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch (e) {
    if (e && (e.name === 'BlobNotFoundError' || /not.?found/i.test(String(e.message)))) return null;
    throw e;
  }
}

async function readPublic(fresh) {
  if (fresh) return readExact();
  const u = directUrl();
  if (!u) return readExact();
  const r = await fetch(u);
  if (r.status === 404) return null;
  if (!r.ok) return readExact();
  return r.json();
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const fresh = req.query && 'fresh' in req.query;
      const c = await readPublic(fresh);
      const cache = fresh ? 'no-store' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400';
      if (!c) { res.statusCode = 204; res.setHeader('Cache-Control', cache); return res.end(); }
      return json(res, 200, c, { 'Cache-Control': cache });
    }

    if (req.method === 'PUT') {
      if (!sameOrigin(req)) return json(res, 403, { error: 'Forbidden' });
      const user = currentUser(req);
      if (!user) return json(res, 401, { error: 'Nepřihlášen' });
      const body = req.body || {};
      const current = await readExact();
      const curVersion = current ? current.version || 0 : 0;
      if ((body.baseVersion | 0) !== curVersion) {
        return json(res, 409, { error: 'Někdo mezitím uložil jinou verzi', current });
      }
      const clean = sanitize(body.content || {});
      clean.version = curVersion + 1;
      clean.updatedAt = new Date().toISOString();
      clean.updatedBy = user;
      await put(PATH, JSON.stringify(clean), {
        access: 'public', addRandomSuffix: false, allowOverwrite: true,
        contentType: 'application/json; charset=utf-8', cacheControlMaxAge: 60,
      });
      // delete uploaded files that were removed in the admin and are no longer used anywhere
      const used = new Set([...clean.tracks, ...clean.hero, ...clean.gallery].map((x) => x.src));
      const remove = (Array.isArray(body.remove) ? body.remove : []).filter((u) => isOwnBlob(u) && !used.has(u));
      if (remove.length) await del(remove).catch(() => {});
      return json(res, 200, clean);
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: 'Chyba serveru: ' + (e && e.message ? e.message : e) });
  }
}
