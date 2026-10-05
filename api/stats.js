// /api/stats
// Returns how many plans have been generated and the average saving identified.
// Reads SUPABASE_URL and SUPABASE_SERVICE_KEY from Vercel environment variables.

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method', message: 'Use GET.' });
  }

  const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  if (!base || !key) {
    return res.status(500).json({ error: 'config', message: 'Stats are not set up yet.' });
  }

  const headers = { apikey: key, 'Content-Type': 'application/json' };
  // Older Supabase service keys are JWTs and also need the Authorization header.
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;

  try {
    const r = await fetch(base + '/rest/v1/rpc/plan_stats', {
      method: 'POST',
      headers,
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error('Supabase ' + r.status);
    const data = await r.json();
    return res.status(200).json({
      plans: Number(data.plans) || 0,
      avg_saving: Number(data.avg_saving) || 0,
    });
  } catch (err) {
    console.error('stats failed:', err && err.message);
    return res.status(502).json({ error: 'stats', message: 'Could not load the numbers right now.' });
  }
};
