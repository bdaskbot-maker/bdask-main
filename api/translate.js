// ============================================
// Vercel Serverless Function: /api/translate
// POST /api/translate { text, targetLang }
// ============================================

export default async function handler(req, res) {
    const origin = process.env.FRONTEND_URL || 'https://bdask.com';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: true, message: 'Method not allowed' });

    const { text, targetLang } = req.body;

    if (!text || !targetLang || typeof text !== 'string' || typeof targetLang !== 'string') {
        return res.status(400).json({ error: true, message: 'অনুবাদের জন্য টেক্সট ও ভাষা প্রদান করুন।' });
    }

    const safeText = text.trim().slice(0, 1000);
    const safeLang = targetLang.slice(0, 10).replace(/[^a-zA-Z]/g, '');

    if (!process.env.GEMINI_API_KEY) {
        return res.json({ translation: 'GEMINI_API_KEY সেট করুন।' });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Translate the following text to ${safeLang}. Only return the translation, nothing else.\n\nText: ${safeText}`
                        }]
                    }],
                    generationConfig: { maxOutputTokens: 512 }
                }),
                signal: AbortSignal.timeout(15000),
            }
        );

        if (!response.ok) {
            return res.status(502).json({ error: true, message: 'অনুবাদ সার্ভিস এখন ব্যস্ত।' });
        }

        const data = await response.json();
        const translation = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'অনুবাদ করা যায়নি।';
        return res.json({ translation });

    } catch (err) {
        console.error('[Translate Error]:', err.message);
        res.status(500).json({ error: true, message: 'অনুবাদে সমস্যা হয়েছে।' });
    }
}
