export default async function handler(req, res) {
  try {
    const key = String(process.env['TMDB-KEY'] || process.env.TMDB_KEY || '').trim();
    if (!key) {
      return res.status(500).json({ error: 'TMDB_KEY is not configured in Vercel.' });
    }

    const path = String(req.query?.path || '');
    if (!/^\/(trending|discover|movie|tv|person|search|genre|configuration|collection|keyword|company|network|credit|find)(\/|$)/.test(path)) {
      return res.status(400).json({ error: 'Invalid TMDB path.' });
    }

    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(req.query || {})) {
      if (name === 'path' || value == null) continue;
      if (Array.isArray(value)) value.forEach(v => params.append(name, String(v)));
      else params.set(name, String(value));
    }

    params.set('api_key', key);

    const upstream = await fetch('https://api.themoviedb.org/3' + path + '?' + params.toString(), {
      headers: { Accept: 'application/json' }
    });

    const text = await upstream.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { error: 'Invalid response from TMDB.' }; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: upstream.status === 401
          ? 'TMDB rejected the configured API key.'
          : 'TMDB request failed.',
        details: body?.status_message || undefined
      });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(body);
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach TMDB.', details: error?.message || 'Unknown error' });
  }
}
