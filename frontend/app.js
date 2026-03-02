// ============================================
// BdAsk — Main Application Logic
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
    let chatHistory = JSON.parse(localStorage.getItem('bdask_chat_history') || '[]');
    let isRecording = false;
    let recognition = null;
    let currentLang = 'bn'; // 'bn' or 'en'
    // Tab data cache: { tabName: { ts: Date, loaded: true } }
    const tabCache = {};

    // ---- DOM ELEMENTS ----
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
        if (hour >= 5 && hour < 12) el.textContent = 'সুপ্রভাত ☀️';
        else if (hour >= 12 && hour < 17) el.textContent = 'শুভ দুপুর 🌤️';
        else if (hour >= 17 && hour < 20) el.textContent = 'শুভ সন্ধ্যা 🌅';
        else el.textContent = 'শুভ রাত্রি 🌙';
    }
    setGreeting();

    // ---- TABS ----
    $$('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.tab').forEach(t => t.classList.remove('active'));
            $$('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = $(`#panel-${tab.dataset.tab}`);
            if (panel) panel.classList.add('active');

            // Load data on first tab click (with 60s cache)
            const tabName = tab.dataset.tab;
            const cacheAge = tabCache[tabName] ? (Date.now() - tabCache[tabName]) : Infinity;
            if (cacheAge > 60000) {
                tabCache[tabName] = Date.now();
                if (tabName === 'cricket') loadCricket();
                else if (tabName === 'news') loadNews();
                else if (tabName === 'prayer') loadPrayer();
                else if (tabName === 'weather') loadWeather();
                else if (tabName === 'ramadan') initRamadan();
            }
        });
    });

    // ---- BOTTOM NAV ----
    $$('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            $$('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const nav = item.dataset.nav;
            if (nav === 'home') {
                $('#hero-section').scrollIntoView({ behavior: 'smooth' });
                $('#chat-container').classList.add('hidden');
                $('#hero-section').style.display = '';
                $('#features-section').style.display = '';
            } else if (nav === 'chat') {
                $('#hero-section').style.display = 'none';
                $('#features-section').style.display = 'none';
                $('#chat-container').classList.remove('hidden');
                $('#chat-input').focus();
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
        chatHistory = [];
        localStorage.setItem('bdask_chat_history', '[]');
        renderHistory();
    });

    function renderHistory() {
        const list = $('#history-list');
        if (!list) return;
        if (chatHistory.length === 0) {
            list.innerHTML = '<p class="empty-state">কোনো চ্যাট ইতিহাস নেই</p>';
            return;
        }
        list.innerHTML = chatHistory.slice().reverse().map((item, i) => `
      <div class="history-item" data-index="${chatHistory.length - 1 - i}">
        <div class="history-item-question">${escapeHtml(item.question)}</div>
        <div class="history-item-time">${new Date(item.timestamp).toLocaleDateString('bn-BD')}</div>
      </div>
    `).join('');
    }

    // ---- CHAT ----
    const chatInput = $('#chat-input');
    const sendBtn = $('#btn-send');

    // Auto-resize textarea
    chatInput?.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Send on Enter (no Shift)
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
            chatInput.value = btn.dataset.prompt;
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

        // Add user message
        addMessage(text, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Show typing
        $('#typing-indicator')?.classList.remove('hidden');

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            const data = await response.json();
            $('#typing-indicator')?.classList.add('hidden');

            if (data.error) {
                addMessage(data.message || 'দুঃখিত, কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন। 😔', 'bot');
            } else {
                const reply = data.reply || data.response || data.message || 'উত্তর পাওয়া যায়নি।';
                addMessage(reply, 'bot');
            }

            // Save to history (cap at 50 in memory too)
            chatHistory.push({
                question: text,
                answer: data.reply || data.response || data.message || '',
                timestamp: new Date().toISOString(),
            });
            if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);
            localStorage.setItem('bdask_chat_history', JSON.stringify(chatHistory));

        } catch (err) {
            $('#typing-indicator')?.classList.add('hidden');
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
        recognition.lang = 'bn-BD';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            chatInput.value = transcript;
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
                recognition.start();
                isRecording = true;
                voiceBtn.classList.add('recording');
                window.dispatchEvent(new Event('voice_input_start'));
            }
        });
    } else {
        if (voiceBtn) voiceBtn.style.display = 'none';
    }

    // ---- THEME TOGGLE ----
    $('#btn-theme-toggle')?.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const icon = $('.theme-icon');
        if (icon) {
            icon.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
        }
    });

    // ---- LANGUAGE TOGGLE (BN/EN) ----
    $('#btn-lang-toggle')?.addEventListener('click', () => {
        currentLang = currentLang === 'bn' ? 'en' : 'bn';
        const btn = $('#btn-lang-toggle span');
        if (btn) btn.textContent = currentLang === 'bn' ? 'বাং' : 'EN';
        // Update hero text
        const heroDesc = $('#app-main .hero-desc');
        if (heroDesc) {
            heroDesc.textContent = currentLang === 'bn'
                ? 'বাংলায় যেকোনো প্রশ্ন করুন — আমি তাৎক্ষণিক উত্তর দেব'
                : 'Ask any question — I will answer instantly';
        }
        const chatInputEl = $('#chat-input');
        if (chatInputEl) {
            chatInputEl.placeholder = currentLang === 'bn'
                ? 'বাংলায় আপনার প্রশ্ন লিখুন...'
                : 'Type your question in English...';
            chatInputEl.lang = currentLang === 'bn' ? 'bn' : 'en';
        }
        if (recognition) recognition.lang = currentLang === 'bn' ? 'bn-BD' : 'en-US';
    });

    // ---- DATA LOADING FUNCTIONS ----

    // Cricket
    async function loadCricket() {
        const container = $('#cricket-content');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE}/cricket`);
            const data = await res.json();

            if (data.error) {
                container.innerHTML = renderInfoCard('🏏', 'ক্রিকেট স্কোর এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পর চেষ্টা করুন।');
                return;
            }

            const matches = data.data || data.matches || data;
            if (!Array.isArray(matches) || matches.length === 0) {
                container.innerHTML = renderInfoCard('🏏', 'এখন কোনো ম্যাচ চলছে না।');
                return;
            }

            container.innerHTML = matches.slice(0, 5).map(m => `
        <div class="cricket-card">
          <span class="cricket-status ${m.status?.toLowerCase().includes('live') ? 'live' : 'completed'}">
            ${m.status || 'সম্পন্ন'}
          </span>
          <div class="cricket-teams">
            <div class="cricket-team">
              <span class="cricket-team-name">${m.t1 || m.team1 || m.teamInfo?.[0]?.name || 'Team 1'}</span>
              <span class="cricket-team-score">${m.t1s || m.score1 || m.teamInfo?.[0]?.score || '-'}</span>
            </div>
            <div class="cricket-team">
              <span class="cricket-team-name">${m.t2 || m.team2 || m.teamInfo?.[1]?.name || 'Team 2'}</span>
              <span class="cricket-team-score">${m.t2s || m.score2 || m.teamInfo?.[1]?.score || '-'}</span>
            </div>
          </div>
          <div class="cricket-info">${m.venue || m.matchType || ''}</div>
        </div>
      `).join('');

        } catch {
            container.innerHTML = renderInfoCard('🏏', 'ক্রিকেট স্কোর লোড করা যাচ্ছে না।');
        }
    }

    // News
    async function loadNews() {
        const container = $('#news-content');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE}/news`);
            const data = await res.json();

            if (data.error) {
                container.innerHTML = renderInfoCard('📰', 'খবর লোড করা যাচ্ছে না।');
                return;
            }

            const articles = data.results || data.articles || data.data || data;
            if (!Array.isArray(articles) || articles.length === 0) {
                container.innerHTML = renderInfoCard('📰', 'এখন কোনো খবর পাওয়া যাচ্ছে না।');
                return;
            }

            container.innerHTML = articles.slice(0, 8).map(a => {
                const safeUrl = (a.link || a.url || '').replace(/"/g, '%22');
                return `
        <div class="news-card" tabindex="0" data-url="${safeUrl}" role="button">
          <div class="news-source">${escapeHtml(a.source_id || a.source?.name || 'বাংলাদেশ')}</div>
          <div class="news-title">${escapeHtml(a.title || 'শিরোনাম পাওয়া যায়নি')}</div>
          <div class="news-time">${a.pubDate ? new Date(a.pubDate).toLocaleDateString('bn-BD') : ''}</div>
        </div>`;
            }).join('');

            // Safe delegated event listener (prevents XSS)
            container.addEventListener('click', (e) => {
                const card = e.target.closest('.news-card[data-url]');
                if (card && card.dataset.url) window.open(card.dataset.url, '_blank', 'noopener,noreferrer');
            }, { once: true });
            // Keyboard accessibility
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const card = e.target.closest('.news-card[data-url]');
                    if (card && card.dataset.url) window.open(card.dataset.url, '_blank', 'noopener,noreferrer');
                }
            }, { once: true });

        } catch {
            container.innerHTML = renderInfoCard('📰', 'খবর লোড করা যাচ্ছে না।');
        }
    }

    // Prayer Times
    async function loadPrayer() {
        const container = $('#prayer-content');
        const citySelect = $('#prayer-city');
        if (!container) return;

        const city = citySelect?.value || 'Dhaka';
        const coords = CITY_COORDS[city] || CITY_COORDS.Dhaka;

        try {
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
            const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.lat}&longitude=${coords.lon}&method=1`);
            const data = await res.json();

            if (data.code !== 200) {
                container.innerHTML = renderInfoCard('🕌', 'নামাজের সময় লোড করতে পারিনি।');
                return;
            }

            const timings = data.data.timings;
            const prayers = [
                { name: 'ফজর', time: timings.Fajr },
                { name: 'সূর্যোদয়', time: timings.Sunrise },
                { name: 'যোহর', time: timings.Dhuhr },
                { name: 'আসর', time: timings.Asr },
                { name: 'মাগরিব', time: timings.Maghrib },
                { name: 'ইশা', time: timings.Isha },
            ];

            // Determine next prayer
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            let nextPrayerIndex = -1;

            for (let i = 0; i < prayers.length; i++) {
                const [h, m] = prayers[i].time.split(':').map(Number);
                if (h * 60 + m > currentMinutes) {
                    nextPrayerIndex = i;
                    break;
                }
            }

            container.innerHTML = `<div class="prayer-grid">
        ${prayers.map((p, i) => `
          <div class="prayer-card ${i === nextPrayerIndex ? 'next' : ''}">
            <div class="prayer-name">${p.name}</div>
            <div class="prayer-time">${p.time}</div>
          </div>
        `).join('')}
      </div>`;

        } catch {
            container.innerHTML = renderInfoCard('🕌', 'নামাজের সময় লোড করা যাচ্ছে না।');
        }
    }

    // Weather (OpenMeteo — free, no API key!)
    async function loadWeather() {
        const container = $('#weather-content');
        const citySelect = $('#weather-city');
        if (!container) return;

        const city = citySelect?.value || 'Dhaka';
        const coords = CITY_COORDS[city] || CITY_COORDS.Dhaka;

        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia/Dhaka`);
            const data = await res.json();

            const current = data.current;
            const weather = WEATHER_CODES[current.weather_code] || { icon: '🌤️', desc: 'সাধারণ আবহাওয়া' };

            container.innerHTML = `
        <div class="weather-main">
          <div style="font-size:48px;margin-bottom:8px">${weather.icon}</div>
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
            output.textContent = data.translation || data.result || data.translatedText || 'অনুবাদ পাওয়া যায়নি।';
        } catch {
            output.textContent = 'অনুবাদ করতে সমস্যা হয়েছে।';
        }
    });

    // ---- RAMADAN IFTAR/SEHRI COUNTDOWN ----
    function initRamadan() {
        // Use stored prayer times for Dhaka or fetch them
        async function updateRamadanCountdown() {
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
            try {
                const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=23.8103&longitude=90.4125&method=1`);
                const data = await res.json();
                if (data.code !== 200) return;
                const timings = data.data.timings;
                startCountdown(timings.Maghrib, timings.Fajr); // Iftar = Maghrib, Sehri = Fajr
            } catch (e) { /* ignore */ }
        }

        function startCountdown(iftarTime, sehriTime) {
            function tick() {
                const now = new Date();
                const [ih, im] = iftarTime.split(':').map(Number);
                const [sh, sm] = sehriTime.split(':').map(Number);
                const iftarMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ih, im, 0) - now;
                const sehriMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0) - now;

                const display = $('#iftar-countdown');
                const label = $('#iftar-label');
                if (!display) return;

                // Choose the nearest future event
                let ms = iftarMs > 0 ? iftarMs : sehriMs > 0 ? sehriMs : (24 * 3600000 + iftarMs);
                const targetLabel = iftarMs > 0 ? 'পরবর্তী ইফতার পর্যন্ত' : 'পরবর্তী সেহরি পর্যন্ত';

                if (ms < 0) ms = 0;
                const h = Math.floor(ms / 3600000);
                const m = Math.floor((ms % 3600000) / 60000);
                const s = Math.floor((ms % 60000) / 1000);
                display.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                if (label) label.textContent = targetLabel;
            }
            tick();
            setInterval(tick, 1000);
        }
        updateRamadanCountdown();
    }

    // ---- ZAKAT CALCULATOR ----
    $('#btn-zakat')?.addEventListener('click', () => {
        const amount = parseFloat($('#zakat-amount')?.value);
        const result = $('#zakat-result');
        if (!result) return;

        if (isNaN(amount) || amount <= 0) {
            result.textContent = 'সঠিক পরিমাণ লিখুন';
            return;
        }

        // Zakat Nisab (approximately 595g silver or 87.48g gold value)
        const zakatAmount = amount * 0.025; // 2.5%
        result.textContent = `যাকাত: ৳${zakatAmount.toLocaleString('bn-BD', { maximumFractionDigits: 0 })}`;
    });

    // ---- REFRESH BUTTONS ----
    $$('.refresh-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.refresh;
            if (target === 'cricket') loadCricket();
            else if (target === 'news') loadNews();
        });
    });

    // City select changes
    $('#prayer-city')?.addEventListener('change', loadPrayer);
    $('#weather-city')?.addEventListener('change', loadWeather);

    // ---- HELPERS ----
    function escapeHtml(str) {
        const el = document.createElement('div');
        el.textContent = str;
        return el.innerHTML;
    }

    function formatMarkdown(text) {
        return escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    function renderInfoCard(icon, text) {
        return `<div class="info-card"><div class="info-card-icon">${icon}</div><div class="info-card-text">${text}</div></div>`;
    }

    function getCityNameBn(name) {
        const map = { Dhaka: 'ঢাকা', Chittagong: 'চট্টগ্রাম', Sylhet: 'সিলেট', Rajshahi: 'রাজশাহী', Khulna: 'খুলনা', Barishal: 'বরিশাল', Rangpur: 'রংপুর', Mymensingh: 'ময়মনসিংহ' };
        return map[name] || name;
    }

    // ---- INITIAL LOAD ----
    // Mark initial tab loads in cache
    tabCache['cricket'] = Date.now();
    tabCache['prayer'] = Date.now();
    tabCache['weather'] = Date.now();
    loadCricket();
    loadPrayer();
    loadWeather();

})();
