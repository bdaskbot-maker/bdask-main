// ============================================
// BdAsk - App Initialization
// Add this script at the end of your index.html
// ============================================

// ---- SERVICE WORKER REGISTRATION (PWA) ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[BdAsk] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('[BdAsk] Service Worker registration failed:', error);
      });
  });
}

// ---- PWA INSTALL PROMPT ----
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show install button after 30 seconds of usage
  setTimeout(() => {
    showInstallBanner();
  }, 30000);
});

function showInstallBanner() {
  if (!deferredPrompt) return;

  const banner = document.createElement('div');
  banner.id = 'bdask-install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 16px;
    right: 16px;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 9999;
    font-family: 'Hind Siliguri', sans-serif;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideUp 0.4s ease-out;
  `;
  banner.innerHTML = `
    <div style="flex:1">
      <div style="color:#fff;font-size:15px;font-weight:600">📱 বিডিআস্ক ইনস্টল করুন</div>
      <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:2px">হোম স্ক্রিনে যোগ করুন — দ্রুত অ্যাক্সেস!</div>
    </div>
    <button id="bdask-install-btn" style="
      background: linear-gradient(135deg, #00b894, #00cec9);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 8px 20px;
      font-family: 'Hind Siliguri', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 12px;
      white-space: nowrap;
    ">ইনস্টল</button>
    <button id="bdask-install-close" style="
      background: none;
      border: none;
      color: rgba(255,255,255,0.5);
      font-size: 18px;
      cursor: pointer;
      margin-left: 8px;
      padding: 4px;
    ">✕</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('bdask-install-btn').addEventListener('click', async () => {
    banner.remove();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[BdAsk] Install prompt outcome:', outcome);
    deferredPrompt = null;
    // Track install
    trackEvent('pwa_install', { outcome });
  });

  document.getElementById('bdask-install-close').addEventListener('click', () => {
    banner.remove();
    trackEvent('pwa_install_dismissed');
  });
}

// ---- SIMPLE ANALYTICS ----
// Lightweight event tracking (replace with GA4 or Plausible later)
function trackEvent(eventName, data = {}) {
  try {
    // Log locally
    console.log(`[BdAsk Analytics] ${eventName}:`, data);

    // Send to backend (non-blocking)
    const payload = {
      event: eventName,
      data: data,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      online: navigator.onLine,
      lang: navigator.language
    };

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {}); // Silent fail
    }
  } catch (e) {
    // Analytics should never break the app
  }
}

// ---- TRACK KEY EVENTS ----
// Page view
trackEvent('page_view');

// Track feature usage
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    trackEvent('tab_click', { tab: tab.dataset.tab });
  }
});

// Track voice usage
window.addEventListener('voice_input_start', () => trackEvent('voice_input'));

// Track chat
window.addEventListener('chat_message_sent', () => trackEvent('chat_message'));

// ---- PERFORMANCE MONITORING ----
window.addEventListener('load', () => {
  setTimeout(() => {
    const perf = performance.getEntriesByType('navigation')[0];
    if (perf) {
      trackEvent('page_performance', {
        loadTime: Math.round(perf.loadEventEnd - perf.startTime),
        domReady: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
        firstByte: Math.round(perf.responseStart - perf.startTime),
        connection: navigator.connection?.effectiveType || 'unknown'
      });
    }
  }, 3000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { trackEvent };
}
