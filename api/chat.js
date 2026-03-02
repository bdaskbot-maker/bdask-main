// Vercel Serverless Function: /api/chat
// POST /api/chat { message }
// ============================================

module.exports = async function handler(req, res) {
    // CORS headers
    const origin = process.env.FRONTEND_URL || 'https://bdask.com';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: true, message: 'Method not allowed' });

    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: true, message: 'বার্তা প্রদান করুন।' });
    }

    // Truncate message to avoid excessively long prompts
    const safeMessage = message.trim().slice(0, 2000);

    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.json({
                reply: `আপনি জিজ্ঞেস করেছেন: "${safeMessage}"\n\nদুঃখিত, AI সহায়ক এখনো কনফিগার করা হয়নি। অনুগ্রহ করে GEMINI_API_KEY সেট করুন।`
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are BdAsk, a helpful AI assistant for Bangladesh. Answer in Bengali (Bangla) by default unless the user writes in English. Be friendly, informative and concise. User's question: ${safeMessage}`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 1024,
                        temperature: 0.7,
                    }
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error('[Chat] Gemini error:', response.status, errText);
            return res.status(502).json({ error: true, message: 'AI সহায়ক এই মুহূর্তে ব্যস্ত আছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' });
        }

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'উত্তর পাওয়া যায়নি।';
        return res.json({ reply });

    } catch (err) {
        console.error('[Chat Error]:', err.message);
        return res.status(500).json({ error: true, message: 'AI সহায়ক এই মুহূর্তে ব্যস্ত আছে।' });
    }
}
