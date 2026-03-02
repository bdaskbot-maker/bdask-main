// ============================================
// BdAsk Backend - Health Check & Error Middleware
// Add this to your Express app
// ============================================

// ---- HEALTH CHECK ENDPOINT ----
// Usage: app.use('/api', healthRoutes);

const express = require('express');
const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'bdask-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check (for monitoring)
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'bdask-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {}
  };

  // Check MongoDB
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      health.checks.mongodb = { status: 'ok' };
    } else {
      health.checks.mongodb = { status: 'degraded', message: 'Not connected' };
      health.status = 'degraded';
    }
  } catch (e) {
    health.checks.mongodb = { status: 'error', message: e.message };
    health.status = 'degraded';
  }

  // Check external APIs (lightweight ping)
  const apiChecks = [
    { name: 'gemini', url: 'https://generativelanguage.googleapis.com' },
    { name: 'cricket', url: 'https://api.cricapi.com' },
    { name: 'news', url: 'https://newsdata.io' },
  ];

  for (const api of apiChecks) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(api.url, { method: 'HEAD', signal: controller.signal });
      health.checks[api.name] = { status: resp.ok ? 'ok' : 'degraded' };
    } catch {
      health.checks[api.name] = { status: 'unreachable' };
    }
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// Usage: app.use(errorMiddleware); (add AFTER all routes)
// ============================================

function errorMiddleware(err, req, res, next) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}:`, err.message);

  // Default error
  let statusCode = err.statusCode || 500;
  let message_bn = 'কিছু একটা সমস্যা হয়েছে।';
  let message_en = 'Something went wrong.';

  // Classify error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message_bn = 'ভুল তথ্য প্রদান করা হয়েছে।';
    message_en = 'Invalid input provided.';
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    statusCode = 503;
    message_bn = 'ডাটাবেসে সমস্যা হয়েছে।';
    message_en = 'Database error.';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 502;
    message_bn = 'বাইরের সার্ভিসে সংযোগ করা যাচ্ছে না।';
    message_en = 'Cannot connect to external service.';
  } else if (statusCode === 429) {
    message_bn = 'অনুরোধ সীমা অতিক্রম হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।';
    message_en = 'Rate limit exceeded. Try again later.';
  }

  res.status(statusCode).json({
    error: true,
    message: message_bn,
    message_en: message_en,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports.errorMiddleware = errorMiddleware;
module.exports.healthRoutes = router;
