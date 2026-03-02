// ============================================
// Vercel Serverless Function: /api/analytics
// POST /api/analytics { event, data, ... }
// ============================================

export default async function handler(req, res) {
    const origin = process.env.FRONTEND_URL || 'https://bdask.com';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(204).end();

    try {
        // Log event (in production, send to a proper analytics service)
        const event = {
            ...req.body,
            receivedAt: new Date().toISOString(),
        };
        // Remove sensitive fields
        delete event.userAgent;
        console.log('[Analytics]', JSON.stringify(event));
    } catch (_) {
        // Silent fail — analytics must never break the app
    }

    // Always return 204 No Content
    res.status(204).end();
}
