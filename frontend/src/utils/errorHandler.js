// ============================================
// BdAsk Error Handler
// Bengali-first error handling for BD users
// ============================================

const ERROR_MESSAGES = {
  NETWORK: {
    bn: 'ইন্টারনেট সংযোগ নেই। আপনার নেটওয়ার্ক চেক করুন। 📶',
    en: 'No internet connection. Please check your network.'
  },
  SERVER: {
    bn: 'সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন। 🔧',
    en: 'Server error. Please try again later.'
  },
  TIMEOUT: {
    bn: 'সময় শেষ হয়ে গেছে। আপনার ইন্টারনেট ধীর হতে পারে। ⏱️',
    en: 'Request timed out. Your internet may be slow.'
  },
  API_LIMIT: {
    bn: 'অনুরোধ সীমা অতিক্রম হয়েছে। ১ মিনিট পর আবার চেষ্টা করুন। ⏳',
    en: 'Rate limit exceeded. Please wait 1 minute.'
  },
  NOT_FOUND: {
    bn: 'দুঃখিত, তথ্য পাওয়া যায়নি। 🔍',
    en: 'Sorry, information not found.'
  },
  GENERIC: {
    bn: 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন। 😔',
    en: 'Something went wrong. Please try again.'
  },
  OFFLINE: {
    bn: '📴 অফলাইন মোড — সর্বশেষ সংরক্ষিত ডেটা দেখাচ্ছি',
    en: 'Offline mode — showing last saved data'
  },
  CRICKET_UNAVAILABLE: {
    bn: 'ক্রিকেট স্কোর এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পর চেষ্টা করুন। 🏏',
    en: 'Cricket scores unavailable. Try again shortly.'
  },
  NEWS_UNAVAILABLE: {
    bn: 'খবর লোড করা যাচ্ছে না। কিছুক্ষণ পর চেষ্টা করুন। 📰',
    en: 'News feed unavailable. Try again shortly.'
  },
  PRAYER_UNAVAILABLE: {
    bn: 'নামাজের সময় লোড করা যাচ্ছে না। 🕌',
    en: 'Prayer times unavailable.'
  },
  WEATHER_UNAVAILABLE: {
    bn: 'আবহাওয়া তথ্য পাওয়া যাচ্ছে না। 🌤️',
    en: 'Weather data unavailable.'
  },
  AI_UNAVAILABLE: {
    bn: 'AI সহায়ক এই মুহূর্তে ব্যস্ত আছে। কিছুক্ষণ পর আবার চেষ্টা করুন। 🤖',
    en: 'AI assistant is busy. Please try again shortly.'
  }
};

/**
 * Get error message in Bengali (primary) with English fallback
 */
function getErrorMessage(errorType, lang = 'bn') {
  const msg = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.GENERIC;
  return msg[lang] || msg.bn;
}

/**
 * Classify HTTP errors into user-friendly types
 */
function classifyError(error, statusCode) {
  if (!navigator.onLine) return 'NETWORK';
  if (error?.name === 'AbortError') return 'TIMEOUT';
  if (statusCode === 429) return 'API_LIMIT';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode >= 500) return 'SERVER';
  if (error?.message?.includes('fetch')) return 'NETWORK';
  return 'GENERIC';
}

/**
 * Fetch with retry + timeout — designed for BD's 3G/4G networks
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {number} retries - Number of retries (default: 2)
 * @param {number} timeout - Timeout in ms (default: 15000 for BD networks)
 */
async function fetchWithRetry(url, options = {}, retries = 2, timeout = 15000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorType = classifyError(null, response.status);
        if (attempt === retries) {
          return {
            error: true,
            type: errorType,
            message: getErrorMessage(errorType),
            status: response.status
          };
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }

      return await response.json();

    } catch (error) {
      if (attempt === retries) {
        const errorType = classifyError(error);
        return {
          error: true,
          type: errorType,
          message: getErrorMessage(errorType),
          offline: !navigator.onLine
        };
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
}

/**
 * Show error toast/banner in Bengali
 */
function showErrorToast(message, duration = 4000) {
  // Remove existing toast
  const existing = document.getElementById('bdask-error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'bdask-error-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-family: 'Hind Siliguri', sans-serif;
    font-size: 14px;
    z-index: 10000;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease-out;
    max-width: 90vw;
    text-align: center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show offline banner
 */
function showOfflineBanner() {
  const banner = document.createElement('div');
  banner.id = 'bdask-offline-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 8px 16px;
    font-family: 'Hind Siliguri', sans-serif;
    font-size: 13px;
    text-align: center;
    z-index: 10001;
    animation: slideDown 0.3s ease-out;
  `;
  banner.textContent = '📴 অফলাইন মোড — ইন্টারনেট সংযোগ নেই';
  document.body.appendChild(banner);
}

function hideOfflineBanner() {
  const banner = document.getElementById('bdask-offline-banner');
  if (banner) banner.remove();
}

// ---- NETWORK STATUS LISTENERS ----
window.addEventListener('online', () => {
  hideOfflineBanner();
  showErrorToast('✅ ইন্টারনেট সংযোগ ফিরে এসেছে!', 3000);
});

window.addEventListener('offline', () => {
  showOfflineBanner();
});

// ---- CSS ANIMATIONS ----
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  @keyframes slideDown {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(20px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ---- EXPORTS ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchWithRetry, getErrorMessage, classifyError, showErrorToast, ERROR_MESSAGES };
}
