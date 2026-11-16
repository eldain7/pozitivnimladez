import { checkLogin, setSession, json, sameOrigin, configProblems } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!sameOrigin(req)) return json(res, 403, { error: 'Forbidden' });
  const missing = configProblems().filter((k) => k !== 'BLOB_READ_WRITE_TOKEN');
  if (missing.length) return json(res, 500, { error: 'Admin není nastavený', missing });
  const { user, pass } = req.body || {};
  await new Promise((r) => setTimeout(r, 400)); // slow down guessing
  const u = checkLogin(user, pass);
  if (!u) return json(res, 401, { error: 'Špatné jméno nebo heslo' });
  setSession(res, u);
  return json(res, 200, { user: u });
}
