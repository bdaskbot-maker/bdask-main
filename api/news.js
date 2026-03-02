// ============================================
// Vercel Serverless Function: /api/news
// GET /api/news
// ============================================

export default async function handler(req, res) {
    const origin = process.env.FRONTEND_URL || 'https://bdask.com';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') return res.status(405).json({ error: true, message: 'Method not allowed' });

    if (!process.env.NEWS_DATA_API_KEY) {
        return res.json({ results: [], message: 'News API key not configured.' });
    }

    try {
        const response = await fetch(
            `https://newsdata.io/api/1/news?apikey=${process.env.NEWS_DATA_API_KEY}&country=bd&language=bn`,
            { signal: AbortSignal.timeout(10000) }
        );
        if (!response.ok) {
            return res.json({ results: [], message: 'News API returned an error.' });
        }
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('[News Error]:', err.message);
        res.status(500).json({ error: true, message: 'খবর লোড করতে সমস্যা হয়েছে।' });
    }
}
