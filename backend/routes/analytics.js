// ============================================
// BdAsk - Analytics Endpoint
// Usage: app.use('/api', analyticsRoutes);
// ============================================

const express = require('express');
const router = express.Router();

// In-memory buffer (flush to MongoDB periodically)
let analyticsBuffer = [];
const BUFFER_FLUSH_SIZE = 50;
const BUFFER_FLUSH_INTERVAL = 60000; // 1 minute

// Accept analytics events
router.post('/analytics', express.json(), (req, res) => {
  try {
    const event = {
      ...req.body,
      ip: req.ip,
      receivedAt: new Date().toISOString()
    };

    analyticsBuffer.push(event);

    // Flush buffer if full
    if (analyticsBuffer.length >= BUFFER_FLUSH_SIZE) {
      flushAnalytics();
    }

    // Hard cap to prevent memory leak
    if (analyticsBuffer.length > 500) {
      analyticsBuffer = analyticsBuffer.slice(-500);
    }

    res.status(204).end();
  } catch (e) {
    res.status(204).end(); // Never fail analytics
  }
});

// Flush analytics to MongoDB
async function flushAnalytics() {
  if (analyticsBuffer.length === 0) return;

  const events = [...analyticsBuffer];
  analyticsBuffer = [];

  try {
    // If you have mongoose connected:
    // const Analytics = require('../models/Analytics');
    // await Analytics.insertMany(events);
    console.log(`[Analytics] Flushed ${events.length} events`);
  } catch (e) {
    console.error('[Analytics] Flush failed:', e.message);
    // Put events back (safe array prepend — avoids stack overflow on large batches)
    // Only put back if we haven't already hit the cap
    if (analyticsBuffer.length + events.length < 1000) {
      analyticsBuffer = [...events, ...analyticsBuffer];
    } else {
      console.warn('[Analytics] Dropping events due to buffer saturation');
    }
  }
}

// Periodic flush
setInterval(flushAnalytics, BUFFER_FLUSH_INTERVAL);

// Flush on shutdown
process.on('SIGTERM', flushAnalytics);
process.on('SIGINT', flushAnalytics);

module.exports = router;
