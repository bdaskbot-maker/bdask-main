/**
 * BdAsk - Simple In-Memory Rate Limiter
 * Specifically designed for BD users on flaky IP addresses (CG-NAT)
 */

const rates = new Map();

module.exports = function rateLimiter(options = {}) {
    const {
        windowMs = 60 * 1000, // 1 minute
        max = 30, // 30 requests per minute
        message = 'বেশি অনুরোধ করা হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন। (Rate limit exceeded)',
    } = options;

    return (req, res, next) => {
        // Simple IP identification (handles proxy headers)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const now = Date.now();

        if (!rates.has(ip)) {
            rates.set(ip, { count: 1, resetAt: now + windowMs });
            return next();
        }

        const rate = rates.get(ip);

        // Reset if window expired
        if (now > rate.resetAt) {
            rate.count = 1;
            rate.resetAt = now + windowMs;
            return next();
        }

        rate.count++;

        if (rate.count > max) {
            return res.status(429).json({
                error: true,
                message: message,
                retryAfter: Math.ceil((rate.resetAt - now) / 1000)
            });
        }

        next();
    };
};
