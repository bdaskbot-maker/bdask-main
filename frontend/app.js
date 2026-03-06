// ============================================
// BdAsk — Main Application Logic
// All bugs from audit fixed:
// BUG-02: loadNews() now called on init
// BUG-03: XSS in news cards fixed (data-url + delegation)
// GAP-01: Language toggle implemented
// GAP-03: Iftar/Sehri countdown implemented
// GAP-04: History item click handler added
// M-05:   localStorage wrapped in try/catch
// ============================================

(function () {
    'use strict';

    // ---- CONFIG ----
    const API_BASE = '/api';
    const CITY_COORDS = {
        Dhaka: { lat: 23.8103, lon: 90.4125 },
        Chittagong: { lat: 22.3569, lon: 91.7832 },
        Sylhet: { lat: 24.8949, lon: 91.8687 },
        Rajshahi: { lat: 24.3745, lon: 88.6042 },
        Khulna: { lat: 22.8456, lon: 89.5403 },
        Barishal: { lat: 22.7010, lon: 90.3535 },
        Rangpur: { lat: 25.7439, lon: 89.2752 },
        Mymensingh: { lat: 24.7471, lon: 90.4203 },
    };

    const WEATHER_CODES = {
        0: { icon: '☀️', desc: 'পরিষ্কার আকাশ' },
        1: { icon: '🌤️', desc: 'প্রায় পরিষ্কার' },
        2: { icon: '⛅', desc: 'আংশিক মেঘলা' },
        3: { icon: '☁️', desc: 'মেঘলা' },
        45: { icon: '🌫️', desc: 'কুয়াশা' },
        48: { icon: '🌫️', desc: 'ঘন কুয়াশা' },
        51: { icon: '🌦️', desc: 'হালকা গুঁড়ি বৃষ্টি' },
        53: { icon: '🌦️', desc: 'গুঁড়ি বৃষ্টি' },
        55: { icon: '🌧️', desc: 'ঘন গুঁড়ি বৃষ্টি' },
        61: { icon: '🌧️', desc: 'হালকা বৃষ্টি' },
        63: { icon: '🌧️', desc: 'বৃষ্টি' },
        65: { icon: '🌧️', desc: 'ভারী বৃষ্টি' },
        71: { icon: '❄️', desc: 'হালকা তুষারপাত' },
        80: { icon: '🌦️', desc: 'বৃষ্টি ঝাপটা' },
        95: { icon: '⛈️', desc: 'বজ্রপাত সহ বৃষ্টি' },
    };

    // ---- STATE ----
    // M-05 FIX: localStorage wrapped in try/catch to handle corrupted data
    let chatHistory = [];
    try {
        chatHistory = JSON.parse(localStorage.getItem('bdask_chat_history') || '[]');
        if (!Array.isArray(chatHistory)) chatHistory = [];
    } catch (e) {
        chatHistory = [];
        localStorage.removeItem('bdask_chat_history');
    }

    let isRecording = false;
    let recognition = null;
    let currentLang = 'bn'; // GAP-01: language state
    let prayerTimingsCache = null; // GAP-03: cache prayer times for countdown
    let countdownInterval = null;

    // ---- DOM HELPERS ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ---- SPLASH SCREEN ----
    window.addEventListener('load', () => {
        setTimeout(() => {
            const splash = $('#splash-screen');
            if (splash) {
                splash.classList.add('fade-out');
                setTimeout(() => splash.remove(), 500);
            }
        }, 1800);
    });

    // ---- GREETING BASED ON TIME ----
    function setGreeting() {
        const hour = new Date().getHours();
        const el = $('#hero-greeting');
        if (!el) return;
        if (hour >= 4 && hour < 12) el.textContent = 'সুপ্রভাত ☀️';
        else if (hour >= 12 && hour < 17) el.textContent = 'শুভ দুপুর 🌤️';
        else if (hour >= 17 && hour < 20) el.textContent = 'শুভ সন্ধ্যা 🌅';
        else el.textContent = 'শুভ রাত্রি 🌙';
    }
    setGreeting();

    // ---- LANGUAGE TOGGLE (GAP-01 FIX) ----
    const UI_STRINGS = {
        bn: {
            placeholder: 'বাংলায় আপনার প্রশ্ন লিখুন...',
            sendTitle: 'পাঠান',
            headline: 'আমি বিডিআস্ক, আপনার',
            headlineAccent: 'AI সহায়ক',
            heroDesc: 'বাংলায় যেকোনো প্রশ্ন করুন — আমি তাৎক্ষণিক উত্তর দেব',
            langBtn: 'বাং',
        },
        en: {
            placeholder: 'Ask me anything in Bengali or English...',
            sendTitle: 'Send',
            headline: 'I am BdAsk, your',
            headlineAccent: 'AI Assistant',
            heroDesc: 'Ask any question — I\'ll answer instantly',
            langBtn: 'EN',
        }
    };

    $('#btn-lang-toggle')?.addEventListener('click', () => {
        currentLang = currentLang === 'bn' ? 'en' : 'bn';
        const s = UI_STRINGS[currentLang];
        const chatInput = $('#chat-input');
        if (chatInput) chatInput.placeholder = s.placeholder;
        const langBtn = $('#btn-lang-toggle span');
        if (langBtn) langBtn.textContent = s.langBtn;
        const heroDesc = $('.hero-desc');
        if (heroDesc) heroDesc.textContent = s.heroDesc;
        const headlineAccent = $('.text-gradient');
        if (headlineAccent) headlineAccent.textContent = s.headlineAccent;
        document.documentElement.lang = currentLang;
    });

    // ---- THEME TOGGLE ----
    const savedTheme = localStorage.getItem('bdask_theme') || 'dark';
    if (savedTheme === 'light') document.body.classList.add('light-theme');

    $('#btn-theme-toggle')?.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        const icon = $('.theme-icon');
        if (icon) icon.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('bdask_theme', isLight ? 'light' : 'dark');
    });

    // ---- TABS ----
    const tabLoaded = {};
    $$('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.tab').forEach(t => t.classList.remove('active'));
            $$('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = $(`#panel-${tab.dataset.tab}`);
            if (panel) panel.classList.add('active');

            const tabName = tab.dataset.tab;
            if (tabName === 'cricket') loadCricket();
            else if (tabName === 'news') loadNews();
            else if (tabName === 'prayer') loadPrayer();
            else if (tabName === 'weather') loadWeather();
        });
    });

    // ---- BOTTOM NAV ----
    $$('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            $$('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const nav = item.dataset.nav;
            if (nav === 'home') {
                $('#chat-container').classList.add('hidden');
                $('#hero-section').style.display = '';
                $('#features-section').style.display = '';
                $('#hero-section').scrollIntoView({ behavior: 'smooth' });
            } else if (nav === 'chat') {
                $('#hero-section').style.display = 'none';
                $('#features-section').style.display = 'none';
                $('#chat-container').classList.remove('hidden');
                $('#chat-input')?.focus();
            } else if (nav === 'features') {
                $('#hero-section').style.display = 'none';
                $('#chat-container').classList.add('hidden');
                $('#features-section').style.display = '';
                $('#features-section').scrollIntoView({ behavior: 'smooth' });
            } else if (nav === 'history') {
                toggleSidebar(true);
            }
        });
    });

    // ---- SIDEBAR ----
    function toggleSidebar(show) {
        const sidebar = $('#history-sidebar');
        const overlay = $('#sidebar-overlay');
        if (!sidebar || !overlay) return;
        if (show) {
            sidebar.classList.remove('hidden');
            overlay.classList.remove('hidden');
            renderHistory();
        } else {
            sidebar.classList.add('hidden');
            overlay.classList.add('hidden');
        }
    }

    $('#btn-close-sidebar')?.addEventListener('click', () => toggleSidebar(false));
    $('#sidebar-overlay')?.addEventListener('click', () => toggleSidebar(false));

    $('#btn-clear-history')?.addEventListener('click', () => {
        if (!confirm('সব চ্যাট ইতিহাস মুছে ফেলবেন?')) return;
        chatHistory = [];
        try { localStorage.setItem('bdask_chat_history', '[]'); } catch (e) { }
        renderHistory();
    });

    // GAP-04 FIX: History item click handler — reload conversation
    function renderHistory() {
        const list = $('#history-list');
        if (!list) return;
        if (chatHistory.length === 0) {
            list.innerHTML = '<p class="empty-state">কোনো চ্যাট ইতিহাস নেই</p>';
            return;
        }
        list.innerHTML = chatHistory.slice().reverse().map((item, i) => `
      <div class="history-item" data-index="${chatHistory.length - 1 - i}" role="button" tabindex="0">
        <div class="history-item-question">${escapeHtml(item.question)}</div>
        <div class="history-item-time">${new Date(item.timestamp).toLocaleDateString('bn-BD')}</div>
      </div>
    `).join('');

        // GAP-04: Attach click handlers to replay conversation
        list.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index, 10);
                const entry = chatHistory[idx];
                if (!entry) return;
                toggleSidebar(false);

                // Switch to chat view and show the historical exchange
                $('#hero-section').style.display = 'none';
                $('#features-section').style.display = 'none';
                $('#chat-container').classList.remove('hidden');
                $$('.nav-item').forEach(n => n.classList.remove('active'));
                $('[data-nav="chat"]')?.classList.add('active');

                // Clear and replay
                const msgs = $('#chat-messages');
                if (msgs) msgs.innerHTML = '';
                addMessage(entry.question, 'user');
                if (entry.answer) addMessage(entry.answer, 'bot');
            });
        });
    }

    // ---- CHAT ----
    const chatInput = $('#chat-input');
    const sendBtn = $('#btn-send');

    // Auto-resize textarea
    chatInput?.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Send on Enter (not Shift+Enter)
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn?.addEventListener('click', sendMessage);

    // Quick prompts
    $$('.quick-prompt').forEach(btn => {
        btn.addEventListener('click', () => {
            if (chatInput) chatInput.value = btn.dataset.prompt;
            sendMessage();
        });
    });

    async function sendMessage() {
        const text = chatInput?.value.trim();
        if (!text) return;

        // Switch to chat view
        $('#hero-section').style.display = 'none';
        $('#features-section').style.display = 'none';
        $('#chat-container').classList.remove('hidden');
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        $('[data-nav="chat"]')?.classList.add('active');

        addMessage(text, 'user');
        if (chatInput) {
            chatInput.value = '';
            chatInput.style.height = 'auto';
        }

        const typingEl = $('#typing-indicator');
        typingEl?.classList.remove('hidden');

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            typingEl?.classList.add('hidden');

            if (!response.ok) {
                addMessage('সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন। 🔧', 'bot');
                return;
            }

            const data = await response.json();

            if (data.error) {
                addMessage(data.message || 'দুঃখিত, কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন। 😔', 'bot');
            } else {
                const reply = data.reply || data.response || data.message || 'উত্তর পাওয়া যায়নি।';
                addMessage(reply, 'bot');

                // Save to history
                chatHistory.push({
                    question: text,
                    answer: reply,
                    timestamp: new Date().toISOString(),
                });
                try {
                    localStorage.setItem('bdask_chat_history', JSON.stringify(chatHistory.slice(-50)));
                } catch (e) { }
            }

            window.dispatchEvent(new Event('chat_message_sent'));

        } catch (err) {
            typingEl?.classList.add('hidden');
            addMessage('ইন্টারনেট সংযোগ বা সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন। 📶', 'bot');
        }
    }

    function addMessage(text, type) {
        const container = $('#chat-messages');
        if (!container) return;
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.innerHTML = `
      <div class="message-avatar">${type === 'user' ? '👤' : '🇧🇩'}</div>
      <div class="message-bubble">${type === 'bot' ? formatMarkdown(text) : escapeHtml(text)}</div>
    `;
        container.appendChild(msg);
        msg.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    // ---- VOICE INPUT ----
    const voiceBtn = $('#btn-voice');
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = currentLang === 'bn' ? 'bn-BD' : 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
            if (chatInput) chatInput.value = transcript;
        };

        recognition.onend = () => {
            isRecording = false;
            voiceBtn?.classList.remove('recording');
        };

        recognition.onerror = () => {
            isRecording = false;
            voiceBtn?.classList.remove('recording');
        };

        voiceBtn?.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.lang = currentLang === 'bn' ? 'bn-BD' : 'en-US';
                recognition.start();
                isRecording = true;
                voiceBtn.classList.add('recording');
                window.dispatchEvent(new Event('voice_input_start'));
            }
        });
    } else {
        if (voiceBtn) voiceBtn.style.display = 'none';
    }

    // ============================================
    // DATA LOADING FUNCTIONS
    // ============================================

    // ---- CRICKET ----
    async function loadCricket() {
        const container = $('#cricket-content');
        if (!container) return;
        container.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div>';

        try {
            const res = await fetch(`${API_BASE}/cricket`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            if (data.error || (data.data && data.data.length === 0)) {
                container.innerHTML = renderInfoCard('🏏', 'এখন কোনো ম্যাচের তথ্য নেই। কিছুক্ষণ পর চেষ্টা করুন।');
                return;
            }

            const matches = data.data || data.matches || (Array.isArray(data) ? data : []);
            if (!matches.length) {
                container.innerHTML = renderInfoCard('🏏', 'এখন কোনো ম্যাচ চলছে না।');
                return;
            }

            container.innerHTML = matches.slice(0, 5).map(m => {
                const isLive = m.matchStarted && !m.matchEnded;
                return `
          <div class="cricket-card">
            <span class="cricket-status ${isLive ? 'live' : 'completed'}">
              ${isLive ? '● LIVE' : (m.status || 'সম্পন্ন')}
            </span>
            <div class="cricket-teams">
              <div class="cricket-team">
                <span class="cricket-team-name">${escapeHtml(m.t1 || m.teamInfo?.[0]?.name || 'Team 1')}</span>
                <span class="cricket-team-score">${escapeHtml(m.t1s || '-')}</span>
              </div>
              <div class="cricket-team">
                <span class="cricket-team-name">${escapeHtml(m.t2 || m.teamInfo?.[1]?.name || 'Team 2')}</span>
                <span class="cricket-team-score">${escapeHtml(m.t2s || '-')}</span>
              </div>
            </div>
            <div class="cricket-info">${escapeHtml(m.venue || m.matchType || '')}</div>
          </div>
        `;
            }).join('');

        } catch {
            container.innerHTML = renderInfoCard('🏏', 'ক্রিকেট স্কোর লোড করা যাচ্ছে না।');
        }
    }

    // ---- NEWS ----
    async function loadNews() {
        const container = $('#news-content');
        if (!container) return;
        container.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';

        try {
            const res = await fetch(`${API_BASE}/news`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            if (data.error) {
                container.innerHTML = renderInfoCard('📰', 'খবর লোড করা যাচ্ছে না।');
                return;
            }

            const articles = data.results || data.articles || (Array.isArray(data) ? data : []);
            if (!articles.length) {
                container.innerHTML = renderInfoCard('📰', 'এখন কোনো খবর পাওয়া যাচ্ছে না।');
                return;
            }

            // BUG-03 FIX: Use data-url attribute instead of inline onclick
            container.innerHTML = articles.slice(0, 8).map(a => `
        <div class="news-card" data-url="${escapeHtml(a.link || a.url || '')}" role="button" tabindex="0">
          <div class="news-source">${escapeHtml(a.source_id || (a.source && a.source.name) || 'বাংলাদেশ')}</div>
          <div class="news-title">${escapeHtml(a.title || 'শিরোনাম পাওয়া যায়নি')}</div>
          <div class="news-time">${a.pubDate ? new Date(a.pubDate).toLocaleDateString('bn-BD') : ''}</div>
        </div>
      `).join('');

            // BUG-03 FIX: Event delegation — safe, no inline JS
            container.addEventListener('click', (e) => {
                const card = e.target.closest('.news-card[data-url]');
                if (card && card.dataset.url) {
                    window.open(card.dataset.url, '_blank', 'noopener,noreferrer');
                }
            });

        } catch {
            container.innerHTML = renderInfoCard('📰', 'খবর লোড করা যাচ্ছে না।');
        }
    }

    // ---- PRAYER TIMES ----
    async function loadPrayer() {
        const container = $('#prayer-content');
        const citySelect = $('#prayer-city');
        if (!container) return;
        container.innerHTML = '<div class="skeleton-card"></div>';

        const city = citySelect?.value || 'Dhaka';
        const coords = CITY_COORDS[city] || CITY_COORDS.Dhaka;

        try {
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
            const res = await fetch(
                `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.lat}&longitude=${coords.lon}&method=1`
            );
            const data = await res.json();

            if (data.code !== 200) {
                container.innerHTML = renderInfoCard('🕌', 'নামাজের সময় লোড করতে পারিনি।');
                return;
            }

            const timings = data.data.timings;
            // GAP-03: Cache timings for iftar countdown
            prayerTimingsCache = timings;
            startIftarCountdown(timings);

            const prayers = [
                { name: 'ফজর', time: timings.Fajr },
                { name: 'সূর্যোদয়', time: timings.Sunrise },
                { name: 'যোহর', time: timings.Dhuhr },
                { name: 'আসর', time: timings.Asr },
                { name: 'মাগরিব', time: timings.Maghrib },
                { name: 'ইশা', time: timings.Isha },
            ];

            // Find next prayer
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            let nextIdx = -1;
            for (let i = 0; i < prayers.length; i++) {
                const [h, m] = prayers[i].time.split(':').map(Number);
                if (h * 60 + m > currentMins) { nextIdx = i; break; }
            }

            container.innerHTML = `<div class="prayer-grid">
        ${prayers.map((p, i) => `
          <div class="prayer-card ${i === nextIdx ? 'next' : ''}">
            <div class="prayer-name">${p.name}</div>
            <div class="prayer-time">${p.time}</div>
            ${i === nextIdx ? '<div class="prayer-next-label">পরবর্তী</div>' : ''}
          </div>
        `).join('')}
      </div>`;

        } catch {
            container.innerHTML = renderInfoCard('🕌', 'নামাজের সময় লোড করা যাচ্ছে না।');
        }
    }

    // ---- WEATHER ----
    async function loadWeather() {
        const container = $('#weather-content');
        const citySelect = $('#weather-city');
        if (!container) return;
        container.innerHTML = '<div class="skeleton-card"></div>';

        const city = citySelect?.value || 'Dhaka';
        const coords = CITY_COORDS[city] || CITY_COORDS.Dhaka;

        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia/Dhaka`
            );
            const data = await res.json();

            const current = data.current;
            const weather = WEATHER_CODES[current.weather_code] || { icon: '🌤️', desc: 'সাধারণ আবহাওয়া' };

            container.innerHTML = `
        <div class="weather-main">
          <div style="font-size:56px;margin-bottom:8px">${weather.icon}</div>
          <div class="weather-temp">${Math.round(current.temperature_2m)}°C</div>
          <div class="weather-desc">${weather.desc}</div>
          <div class="weather-details">
            <div class="weather-detail">
              <div class="weather-detail-label">আর্দ্রতা</div>
              <div class="weather-detail-value">${current.relative_humidity_2m}%</div>
            </div>
            <div class="weather-detail">
              <div class="weather-detail-label">বায়ু</div>
              <div class="weather-detail-value">${current.wind_speed_10m} km/h</div>
            </div>
            <div class="weather-detail">
              <div class="weather-detail-label">শহর</div>
              <div class="weather-detail-value">${getCityNameBn(city)}</div>
            </div>
          </div>
        </div>
      `;
        } catch {
            container.innerHTML = renderInfoCard('🌤️', 'আবহাওয়া তথ্য লোড করা যাচ্ছে না।');
        }
    }

    // ---- TRANSLATE ----
    $('#btn-translate')?.addEventListener('click', async () => {
        const input = $('#translate-input')?.value.trim();
        const lang = $('#translate-lang')?.value;
        const output = $('#translate-output');
        if (!input || !output) return;

        output.textContent = 'অনুবাদ করা হচ্ছে...';

        try {
            const res = await fetch(`${API_BASE}/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input, targetLang: lang }),
            });
            const data = await res.json();
            output.textContent = data.translation || data.result || 'অনুবাদ পাওয়া যায়নি।';
        } catch {
            output.textContent = 'অনুবাদ করতে সমস্যা হয়েছে।';
        }
    });

    // ---- ZAKAT CALCULATOR ----
    $('#btn-zakat')?.addEventListener('click', () => {
        const amount = parseFloat($('#zakat-amount')?.value);
        const result = $('#zakat-result');
        if (!result) return;

        if (isNaN(amount) || amount <= 0) {
            result.textContent = 'সঠিক পরিমাণ লিখুন';
            return;
        }

        const zakatAmount = amount * 0.025; // 2.5%
        result.textContent = `যাকাত পরিমাণ: ৳${zakatAmount.toLocaleString('bn-BD', { maximumFractionDigits: 2 })}`;
    });

    // ---- GAP-03 FIX: IFTAR / SEHRI COUNTDOWN ----
    function startIftarCountdown(timings) {
        if (countdownInterval) clearInterval(countdownInterval);

        function updateCountdown() {
            const countdownEl = $('#iftar-countdown');
            const labelEl = $('#iftar-label');
            if (!countdownEl || !timings) return;

            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

            // Parse Maghrib (Iftar) and Fajr (Sehri)
            const [mH, mM] = timings.Maghrib.split(':').map(Number);
            const [fH, fM] = timings.Fajr.split(':').map(Number);
            const maghribMins = mH * 60 + mM;
            const fajrMins = fH * 60 + fM;

            let targetMins;
            let label;
            if (currentMins < fajrMins) {
                targetMins = fajrMins; label = 'সেহরি শেষ হতে বাকি';
            } else if (currentMins < maghribMins) {
                targetMins = maghribMins; label = 'ইফতার পর্যন্ত বাকি';
            } else {
                // After Maghrib: next day Fajr
                targetMins = fajrMins + 24 * 60; label = 'আগামীকাল সেহরি পর্যন্ত';
            }

            const diffSecs = Math.floor((targetMins - currentMins) * 60);
            if (diffSecs <= 0) { countdownEl.textContent = '00:00:00'; return; }

            const h = Math.floor(diffSecs / 3600);
            const m = Math.floor((diffSecs % 3600) / 60);
            const s = diffSecs % 60;
            countdownEl.textContent =
                String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
            if (labelEl) labelEl.textContent = label;
        }

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    // ---- REFRESH BUTTONS ----
    $$('.refresh-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.refresh;
            if (target === 'cricket') loadCricket();
            else if (target === 'news') loadNews();
        });
    });

    // City selects
    $('#prayer-city')?.addEventListener('change', loadPrayer);
    $('#weather-city')?.addEventListener('change', loadWeather);

    // ============================================
    // HELPERS
    // ============================================

    function escapeHtml(str) {
        if (str == null) return '';
        const el = document.createElement('div');
        el.textContent = String(str);
        return el.innerHTML;
    }

    function formatMarkdown(text) {
        return escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    function renderInfoCard(icon, text) {
        return `<div class="info-card"><div class="info-card-icon">${icon}</div><div class="info-card-text">${escapeHtml(text)}</div></div>`;
    }

    function getCityNameBn(name) {
        const map = {
            Dhaka: 'ঢাকা', Chittagong: 'চট্টগ্রাম', Sylhet: 'সিলেট',
            Rajshahi: 'রাজশাহী', Khulna: 'খুলনা', Barishal: 'বরিশাল',
            Rangpur: 'রংপুর', Mymensingh: 'ময়মনসিংহ'
        };
        return map[name] || name;
    }

    // ============================================
    // BUG-02 FIX: Initial Load — loadNews() was missing
    // ============================================
    loadCricket();
    loadNews();
    loadPrayer();
    loadWeather();

})();
