import { handleUpload } from '@vercel/blob/client';
import { currentUser, json } from './_lib.js';

const AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/wave'];
const IMAGE = ['image/jpeg', 'image/png', 'image/webp'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  const request = new Request(`${proto}://${req.headers.host}${req.url}`, { method: 'POST', headers });
  try {
    const out = await handleUpload({
      body: req.body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = currentUser(req);
        if (!user) throw new Error('Nepřihlášen');
        const m = /^uploads\/(audio|hero|gallery)\/[a-z0-9._-]+$/i.exec(pathname);
        if (!m) throw new Error('Neplatná cesta souboru');
        const audio = m[1] === 'audio';
        return {
          allowedContentTypes: audio ? AUDIO : IMAGE,
          maximumSizeInBytes: (audio ? 60 : 15) * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 31536000,
          tokenPayload: JSON.stringify({ user }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return json(res, 200, out);
  } catch (e) {
    return json(res, 400, { error: String((e && e.message) || e) });
  }
}
