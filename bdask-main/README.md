<p align="center">
  <img src="docs/assets/bdask-logo.png" alt="BdAsk Logo" width="120" />
</p>

<h1 align="center">বিডিআস্ক | BdAsk</h1>

<p align="center">
  <strong>বাংলাদেশের প্রথম AI সার্চ ইঞ্জিন ও অল-ইন-ওয়ান প্ল্যাটফর্ম</strong><br/>
  Bangladesh's First Bengali AI Search Engine & All-in-One Platform
</p>

<p align="center">
  <a href="https://bdask.com">🌐 Live Demo</a> •
  <a href="#features">✨ Features</a> •
  <a href="#quick-start">🚀 Quick Start</a> •
  <a href="#api-keys">🔑 API Setup</a> •
  <a href="#deployment">📦 Deploy</a> •
  <a href="#contributing">🤝 Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/language-Bengali%20%7C%20English-green" alt="Languages" />
  <img src="https://img.shields.io/badge/AI-Gemini%20Flash-blue" alt="AI Model" />
  <img src="https://img.shields.io/badge/license-MIT-orange" alt="License" />
  <img src="https://img.shields.io/badge/status-Beta-yellow" alt="Status" />
</p>

---

## 🇧🇩 বাংলায় পড়ুন

বিডিআস্ক হলো বাংলাদেশের জন্য তৈরি একটি AI-চালিত সার্চ ইঞ্জিন এবং অল-ইন-ওয়ান প্ল্যাটফর্ম। এখানে আপনি বাংলায় প্রশ্ন করতে পারবেন, লাইভ ক্রিকেট স্কোর দেখতে পারবেন, সর্বশেষ খবর পড়তে পারবেন, নামাজের সময় জানতে পারবেন, আবহাওয়ার পূর্বাভাস দেখতে পারবেন এবং আরও অনেক কিছু — সব একটি জায়গায়!

### প্রধান বৈশিষ্ট্যসমূহ
- 🤖 **AI চ্যাট** — বাংলায় যেকোনো প্রশ্ন করুন, তাৎক্ষণিক উত্তর পান
- 🎤 **ভয়েস ইনপুট** — কথা বলে প্রশ্ন করুন
- 🏏 **লাইভ ক্রিকেট** — বাংলাদেশের ম্যাচের লাইভ স্কোর
- 📰 **সর্বশেষ খবর** — প্রথম আলো, কালের কণ্ঠ থেকে লাইভ নিউজ
- 🕌 **নামাজের সময়** — বাংলাদেশের ৮টি শহরের নামাজের ওয়াক্ত
- 🌤️ **আবহাওয়া** — বাংলাদেশের প্রধান শহরগুলোর আবহাওয়া
- 🌐 **অনুবাদ** — বাংলা থেকে ১১টি ভাষায় অনুবাদ
- 🌙 **রমজান স্পেশাল** — ইফতার/সেহরির সময়, যাকাত ক্যালকুলেটর
- 🌓 **ডার্ক মোড** — চোখের জন্য আরামদায়ক

---

## ✨ Features <a name="features"></a>

| Feature | Status | Data Source |
|---------|--------|-------------|
| AI Chat (Bengali + English + Banglish) | ✅ Live | Google Gemini Flash |
| Voice Input (Bengali Speech Recognition) | ✅ Live | Web Speech API |
| Live Cricket Scores | ✅ Live | CricketData.org API |
| Bangladesh News Feed | ✅ Live | NewsData.io API |
| Prayer Times (8 BD Cities) | ✅ Live | Aladhan API |
| Weather Forecast | ✅ Live | OpenMeteo API |
| Multi-Language Translation | ✅ Live | Google Gemini AI |
| Chat History | ✅ Live | MongoDB |
| Dark Mode (Bioluminescent Theme) | ✅ Live | Built-in |
| Mobile Responsive + Floating Nav | ✅ Live | Built-in |
| Ramadan: Iftar/Sehri Countdown | ✅ Live | Aladhan API |
| Ramadan: Zakat Calculator | ✅ Live | Built-in |
| Football Scores | 🔜 Coming | — |
| Currency Exchange Rates | 🔜 Coming | — |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML, CSS, JavaScript (Vanilla) |
| **Backend** | Node.js, Express.js |
| **AI Model** | Google Gemini 2.0 Flash |
| **Database** | MongoDB |
| **Fonts** | Hind Siliguri, Kalpurush (Bengali) |
| **APIs** | CricketData, NewsData, Aladhan, OpenMeteo |

---

## 🚀 Quick Start <a name="quick-start"></a>

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- API keys (see [API Setup](#api-keys))

### 1. Clone the Repository

```bash
git clone https://github.com/bdaichat/bdaskai.git
cd bdaskai
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Install & Run Backend

```bash
cd backend
npm install
npm start
# Backend runs on http://localhost:5000
```

### 4. Install & Run Frontend

```bash
cd frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

### 5. Open in Browser

```
http://localhost:3000
```

---

## 🔑 API Keys Setup <a name="api-keys"></a>

You'll need the following API keys (all have free tiers):

| API | Purpose | Get Key |
|-----|---------|---------|
| **Google Gemini** | AI Chat + Translation | [ai.google.dev](https://ai.google.dev/) |
| **CricketData.org** | Live Cricket Scores | [cricketdata.org](https://cricketdata.org/) |
| **NewsData.io** | Bangladesh News | [newsdata.io](https://newsdata.io/) |
| **MongoDB** | Database | [mongodb.com/atlas](https://www.mongodb.com/atlas) |

Optional:
| API | Purpose | Get Key |
|-----|---------|---------|
| Football-Data.org | Football Scores | [football-data.org](https://www.football-data.org/) |
| ExchangeRate-API | Currency Rates | [exchangerate-api.com](https://www.exchangerate-api.com/) |

> **Note:** Prayer Times (Aladhan) and Weather (OpenMeteo) are free and don't require API keys.

---

## 📁 Project Structure

```
bdaskai/
├── frontend/               # Client-side application
│   ├── public/             # Static assets
│   │   ├── index.html      # Main HTML with SEO meta tags
│   │   ├── manifest.json   # PWA manifest
│   │   └── icons/          # App icons
│   └── src/
│       ├── components/     # UI components
│       ├── utils/          # Helper functions
│       └── styles/         # CSS files
├── backend/                # Server-side application
│   ├── routes/             # API routes
│   ├── models/             # MongoDB models
│   ├── middleware/         # Express middleware
│   └── server.js           # Entry point
├── memory/                 # AI conversation memory
├── tests/                  # Test files
├── locales/                # Translation files (bn, en)
├── docs/                   # Documentation & assets
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── docker-compose.yml      # Docker setup
├── Dockerfile              # Backend Docker image
├── vercel.json             # Frontend deployment config
├── LICENSE                 # MIT License
└── README.md               # This file
```

---

## 📦 Deployment <a name="deployment"></a>

### Option 1: Vercel + Railway (Recommended)

**Frontend (Vercel):**
```bash
cd frontend
npx vercel --prod
```

**Backend (Railway):**
```bash
cd backend
railway up
```

### Option 2: Docker

```bash
docker-compose up -d
# App available at http://localhost:3000
# API available at http://localhost:5000
```

### Option 3: VPS (Manual)

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Use PM2 for process management
npm install -g pm2
cd backend && pm2 start server.js --name bdask-api
cd ../frontend && pm2 start npm --name bdask-web -- start
```

---

## 🧪 Testing

```bash
# Run all tests
cd tests
npm test

# Run specific test suite
npm test -- --grep "zakat"
npm test -- --grep "prayer"
```

---

## 🤝 Contributing <a name="contributing"></a>

We welcome contributions from the Bangladeshi developer community!

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick steps:**
1. Fork this repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Submit a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

Built with ❤️ for Bangladesh 🇧🇩

- AI powered by [Google Gemini](https://ai.google.dev/)
- Cricket data from [CricketData.org](https://cricketdata.org/)
- News from [NewsData.io](https://newsdata.io/)
- Prayer times from [Aladhan](https://aladhan.com/)
- Weather from [Open-Meteo](https://open-meteo.com/)

---

<p align="center">
  <strong>বিডিআস্ক — বাংলাদেশের নিজস্ব AI</strong><br/>
  <a href="https://bdask.com">bdask.com</a>
</p>
