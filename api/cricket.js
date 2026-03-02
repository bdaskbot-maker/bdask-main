// Vercel Serverless Function: /api/cricket
// GET /api/cricket
// ============================================

module.exports = async function handler(req, res) {
    const origin = process.env.FRONTEND_URL || 'https://bdask.com';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') return res.status(405).json({ error: true, message: 'Method not allowed' });

    if (!process.env.CRICKET_DATA_API_KEY) {
        return res.json({ data: [], message: 'Cricket API key not configured.' });
    }

    try {
        const response = await fetch(
            `https://api.cricapi.com/v1/currentMatches?apikey=${process.env.CRICKET_DATA_API_KEY}&offset=0`,
            { signal: AbortSignal.timeout(10000) }
        );
        if (!response.ok) {
            return res.json({ data: [], message: 'Cricket API returned an error.' });
        }
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('[Cricket Error]:', err.message);
        res.status(500).json({ error: true, message: 'ক্রিকেট স্কোর লোড করতে সমস্যা হয়েছে।' });
    }
}
