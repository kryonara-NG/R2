export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  const email = String(req.query?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const base = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const secret = String(
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();

  if (!base || !secret) {
    return res.status(500).json({ error: 'Supabase server authentication is not configured.' });
  }

  try {
    // Supabase Admin API does not provide a direct email lookup endpoint,
    // so scan paginated users until the requested address is found.
    // This endpoint never returns user details; it only returns exists: true/false.
    const perPage = 1000;
    for (let page = 1; page <= 20; page++) {
      const r = await fetch(base + '/auth/v1/admin/users?page=' + page + '&per_page=' + perPage, {
        headers: {
          apikey: secret,
          Authorization: 'Bearer ' + secret,
          Accept: 'application/json'
        }
      });
      if (!r.ok) {
        return res.status(502).json({ error: 'Could not check the account.' });
      }
      const data = await r.json();
      const users = Array.isArray(data.users) ? data.users : [];
      if (users.some(u => String(u.email || '').toLowerCase() === email)) {
        return res.status(200).json({ exists: true });
      }
      if (users.length < perPage) break;
    }

    return res.status(200).json({ exists: false });
  } catch {
    return res.status(502).json({ error: 'Could not check the account.' });
  }
}
