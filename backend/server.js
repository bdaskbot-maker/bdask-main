// ============================================
// BdAsk Backend - Express Server
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { healthRoutes, errorMiddleware } = require('./middleware/healthAndErrors');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- MIDDLEWARE ----
const allowedOrigin = process.env.FRONTEND_URL || 'https://bdask.com';
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// ---- ROUTES ----

// Health check: GET /api/health
app.use('/api', healthRoutes);

// Analytics: POST /api/analytics
app.use('/api', analyticsRoutes);

// Chat endpoint (placeholder — connect your Gemini API key)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: true, message: 'বার্তা প্রদান করুন।' });
    }

    try {
        // If GEMINI_API_KEY is set, use Gemini
        if (process.env.GEMINI_API_KEY) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `You are BdAsk, a helpful AI assistant for Bangladesh. Answer in Bengali (Bangla) by default. Be friendly and informative. User's question: ${message}` }] }],
                    }),
                }
            );
            const data = await response.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'উত্তর পাওয়া যায়নি।';
            return res.json({ reply });
        }

        // Fallback: No API key
        return res.json({
            reply: `আপনি জিজ্ঞেস করেছেন: "${message}"\n\nদুঃখিত, AI সহায়ক এখনো কনফিগার করা হয়নি। অনুগ্রহ করে GEMINI_API_KEY সেট করুন।`
        });

    } catch (err) {
        console.error('[Chat Error]:', err.message);
        return res.status(500).json({ error: true, message: 'AI সহায়ক এই মুহূর্তে ব্যস্ত আছে।' });
    }
});

// Cricket endpoint (proxy to CricketData API)
app.get('/api/cricket', async (req, res) => {
    try {
        if (!process.env.CRICKET_DATA_API_KEY) {
            return res.json({ data: [], message: 'Cricket API key not configured.' });
        }
        const response = await fetch(
            `https://api.cricapi.com/v1/currentMatches?apikey=${process.env.CRICKET_DATA_API_KEY}&offset=0`
        );
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: true, message: 'ক্রিকেট স্কোর লোড করতে সমস্যা হয়েছে।' });
    }
});

// News endpoint (proxy to NewsData API)
app.get('/api/news', async (req, res) => {
    try {
        if (!process.env.NEWS_DATA_API_KEY) {
            return res.json({ results: [], message: 'News API key not configured.' });
        }
        const response = await fetch(
            `https://newsdata.io/api/1/news?apikey=${process.env.NEWS_DATA_API_KEY}&country=bd&language=bn`
        );
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: true, message: 'খবর লোড করতে সমস্যা হয়েছে।' });
    }
});

// Translate endpoint (via Gemini)
app.post('/api/translate', async (req, res) => {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
        return res.status(400).json({ error: true, message: 'অনুবাদের জন্য টেক্সট ও ভাষা প্রদান করুন।' });
    }

    try {
        if (process.env.GEMINI_API_KEY) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Translate the following Bengali text to ${targetLang}. Only return the translation, nothing else.\n\nText: ${text}` }] }],
                    }),
                }
            );
            const data = await response.json();
            const translation = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'অনুবাদ করা যায়নি।';
            return res.json({ translation });
        }

        return res.json({ translation: 'GEMINI_API_KEY সেট করুন।' });

    } catch (err) {
        res.status(500).json({ error: true, message: 'অনুবাদে সমস্যা হয়েছে।' });
    }
});

// ---- ERROR MIDDLEWARE (must be LAST) ----
app.use(errorMiddleware);

// ---- START SERVER ----
app.listen(PORT, () => {
    console.log(`🇧🇩 BdAsk API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
