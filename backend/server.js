// ============================================
// BdAsk Backend - Express Server
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { healthRoutes, errorMiddleware } = require('./middleware/healthAndErrors');
const rateLimiter = require('./middleware/rateLimiter');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// BUG-05 FIX: Never use wildcard '*' with credentials:true — browsers reject it.
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'https://bdask.com', 'https://www.bdask.com']
  : ['https://bdask.com', 'https://www.bdask.com', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Trust proxy headers (needed for Railway, Vercel, etc.)
app.set('trust proxy', 1);

// ============================================
// RATE LIMITING (using existing middleware)
// ============================================

// General API limiter - 200 requests/min
app.use('/api/', rateLimiter({ windowMs: 60 * 1000, max: 200 }));

// Strict limiter for AI endpoints - 30 requests/min
const chatLimit = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'অনুরোধ সীমা অতিক্রম হয়েছে। এক মিনিট পর আবার চেষ্টা করুন। ⏳',
});

// ============================================
// ROUTES
// ============================================

// Health check: GET /api/health
app.use('/api', healthRoutes);

// Analytics: POST /api/analytics
app.use('/api', analyticsRoutes);

// ---- CHAT ENDPOINT ----
app.post('/api/chat', chatLimit, async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: true, message: 'বার্তা প্রদান করুন।' });
  }

  const safeMessage = message.trim().slice(0, 2000);

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: `আপনি জিজ্ঞেস করেছেন: "${safeMessage}"\n\nদুঃখিত, AI সহায়ক এখনো কনফিগার করা হয়নি। সার্ভারে GEMINI_API_KEY সেট করুন।`
      });
    }

    // BUG-04 FIX: globalThis.fetch guaranteed in Node 18+
    const response = await globalThis.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are BdAsk (বিডিআস্ক), a helpful AI assistant for Bangladesh.
Answer primarily in Bengali (Bangla) unless the user writes in English.
Be friendly, informative, and accurate.
Focus on topics relevant to Bangladesh: cricket, news, culture, prayer times, weather.
User's question: ${safeMessage}`
            }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        }),
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: true, message: 'AI সহায়ক এই মুহূর্তে ব্যস্ত আছে। কিছুক্ষণ পর চেষ্টা করুন।' });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'উত্তর পাওয়া যায়নি।';
    return res.json({ reply });

  } catch (err) {
    console.error('[Chat Error]:', err.message);
    return res.status(500).json({ error: true, message: 'AI সহায়ক এই মুহূর্তে ব্যস্ত আছে।' });
  }
});

// ---- CRICKET ENDPOINT ----
app.get('/api/cricket', async (req, res) => {
  try {
    if (!process.env.CRICKET_DATA_API_KEY) {
      return res.json({ data: [], message: 'Cricket API key not configured.' });
    }
    const response = await globalThis.fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${process.env.CRICKET_DATA_API_KEY}&offset=0`
    );
    if (!response.ok) {
      return res.status(502).json({ error: true, message: 'ক্রিকেট API থেকে ডেটা পাওয়া যাচ্ছে না।' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[Cricket Error]:', err.message);
    res.status(500).json({ error: true, message: 'ক্রিকেট স্কোর লোড করতে সমস্যা হয়েছে।' });
  }
});

// ---- NEWS ENDPOINT ----
app.get('/api/news', async (req, res) => {
  try {
    if (!process.env.NEWS_DATA_API_KEY) {
      return res.json({ results: [], message: 'News API key not configured.' });
    }
    const response = await globalThis.fetch(
      `https://newsdata.io/api/1/news?apikey=${process.env.NEWS_DATA_API_KEY}&country=bd&language=bn`
    );
    if (!response.ok) {
      return res.status(502).json({ error: true, message: 'খবর API থেকে ডেটা পাওয়া যাচ্ছে না।' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[News Error]:', err.message);
    res.status(500).json({ error: true, message: 'খবর লোড করতে সমস্যা হয়েছে।' });
  }
});

// ---- TRANSLATE ENDPOINT ----
app.post('/api/translate', chatLimit, async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: true, message: 'অনুবাদের জন্য টেক্সট ও ভাষা প্রদান করুন।' });
  }

  const safeText = String(text).slice(0, 1000);

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ translation: 'সার্ভারে GEMINI_API_KEY সেট করুন।' });
    }

    const response = await globalThis.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Translate the following Bengali text to ${targetLang}. Return ONLY the translation.\n\nText: ${safeText}` }] }],
        }),
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: true, message: 'অনুবাদ সার্ভারে সমস্যা হয়েছে।' });
    }

    const data = await response.json();
    const translation = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'অনুবাদ করা যায়নি।';
    return res.json({ translation });

  } catch (err) {
    console.error('[Translate Error]:', err.message);
    res.status(500).json({ error: true, message: 'অনুবাদে সমস্যা হয়েছে।' });
  }
});

// ============================================
// ERROR MIDDLEWARE (must be LAST)
// ============================================
app.use(errorMiddleware);

// ============================================
// START SERVER (with port fallback)
// ============================================
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🇧🇩 BdAsk API running on http://localhost:${port}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   GEMINI_API  : ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   CRICKET_API : ${process.env.CRICKET_DATA_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NEWS_API    : ${process.env.NEWS_DATA_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   MONGODB_URI : ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
