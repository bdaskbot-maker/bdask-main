// ============================================
// Vercel Serverless Function: /api/health
// GET /api/health
// ============================================

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(204).end();

    res.status(200).json({
        status: 'ok',
        service: 'bdask-api',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
        region: process.env.VERCEL_REGION || 'unknown',
    });
}
