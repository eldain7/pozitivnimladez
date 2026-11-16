import { currentUser, json, configProblems } from './_lib.js';

export default async function handler(req, res) {
  const missing = configProblems();
  if (missing.includes('ADMIN_USERS') || missing.includes('SESSION_SECRET')) return json(res, 500, { error: 'Admin není nastavený', missing });
  const user = currentUser(req);
  if (!user) return json(res, 401, { error: 'Nepřihlášen' });
  return json(res, 200, { user, missing });
}
