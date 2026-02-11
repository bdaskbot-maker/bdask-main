# 🔧 BdAsk — Integration Guide
## How to Apply All Fixes to Your Repository

Follow these steps in order. Total time: ~2-3 hours.

---

## Pre-Step: Clean Up Repo

```bash
cd bdaskai

# 1. Remove .gitconfig from repo (SECURITY)
git rm --cached .gitconfig
echo ".gitconfig" >> .gitignore

# 2. Remove .emergent/ from repo
git rm -r --cached .emergent/
echo ".emergent/" >> .gitignore

# 3. Commit cleanup
git add .gitignore
git commit -m "fix: remove sensitive files from tracking"
```

---

## Step 1: Replace Root Files

Copy these files to your repo ROOT (`bdaskai/`):

| File | Action | Notes |
|------|--------|-------|
| `README.md` | **REPLACE** existing | New professional README |
| `.gitignore` | **REPLACE** existing | Updated with security rules |
| `.env.example` | **ADD** new file | API key template |
| `LICENSE` | **ADD** new file | MIT License |
| `CONTRIBUTING.md` | **ADD** new file | Bengali + English guide |
| `Dockerfile` | **ADD** new file | Backend containerization |
| `docker-compose.yml` | **ADD** new file | Full stack Docker setup |
| `nginx.conf` | **ADD** new file | Frontend server config |
| `vercel.json` | **ADD** new file | Vercel deployment config |

```bash
# Copy all root files
cp README.md .gitignore .env.example LICENSE CONTRIBUTING.md \
   Dockerfile docker-compose.yml nginx.conf vercel.json \
   /path/to/your/bdaskai/
```

---

## Step 2: Add CI/CD Pipeline

```bash
mkdir -p .github/workflows/
cp .github/workflows/ci-cd.yml /path/to/your/bdaskai/.github/workflows/
```

Add these GitHub Secrets in your repo Settings → Secrets:
- `VERCEL_TOKEN` — Get from vercel.com/account/tokens
- `VERCEL_ORG_ID` — From Vercel project settings
- `VERCEL_PROJECT_ID` — From Vercel project settings

---

## Step 3: Add Frontend Files

### 3a. SEO Meta Tags
Open your `frontend/index.html` (or `frontend/public/index.html`) and **ADD** inside `<head>`:
- Copy contents from `frontend/seo-meta-tags.html`
- Replace any existing `<title>` and `<meta>` tags

### 3b. PWA Files
```bash
# Copy PWA manifest
cp frontend/public/manifest.json /path/to/your/bdaskai/frontend/public/

# Copy service worker
cp frontend/public/sw.js /path/to/your/bdaskai/frontend/public/

# Copy SEO files
cp frontend/public/sitemap.xml /path/to/your/bdaskai/frontend/public/
cp frontend/public/robots.txt /path/to/your/bdaskai/frontend/public/

# Copy OG image (convert SVG to PNG first)
cp frontend/public/og-image.svg /path/to/your/bdaskai/frontend/public/
# Then convert: use Canva or any SVG→PNG tool to make og-image.png (1200x630)
```

### 3c. PWA Icons
You need to create these icon files in `frontend/public/icons/`:
- `icon-72.png` (72x72)
- `icon-96.png` (96x96)
- `icon-128.png` (128x128)
- `icon-144.png` (144x144)
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `favicon-32.png` (32x32)
- `favicon-16.png` (16x16)

**Quick way:** Use https://realfavicongenerator.net — upload your logo, download all sizes.

### 3d. Utility Scripts
```bash
# Copy error handler
mkdir -p frontend/src/utils/
cp frontend/src/utils/errorHandler.js /path/to/your/bdaskai/frontend/src/utils/
cp frontend/src/utils/appInit.js /path/to/your/bdaskai/frontend/src/utils/
```

### 3e. Add to your main HTML file

Add these before `</body>`:
```html
<!-- Error handler -->
<script src="/src/utils/errorHandler.js"></script>

<!-- App init (SW registration + analytics + PWA prompt) -->
<script src="/src/utils/appInit.js"></script>
```

---

## Step 4: Add Backend Files

```bash
# Copy middleware
mkdir -p backend/middleware/
cp backend/middleware/healthAndErrors.js /path/to/your/bdaskai/backend/middleware/

# Copy analytics route
mkdir -p backend/routes/
cp backend/routes/analytics.js /path/to/your/bdaskai/backend/routes/
```

### 4b. Integrate into your Express app (server.js)

Add these lines to your `backend/server.js`:

```javascript
// At the top, with other requires:
const { healthRoutes, errorMiddleware } = require('./middleware/healthAndErrors');
const analyticsRoutes = require('./routes/analytics');

// After your existing routes:
app.use('/api', healthRoutes);      // Health check: GET /api/health
app.use('/api', analyticsRoutes);   // Analytics: POST /api/analytics

// LAST middleware (after all routes):
app.use(errorMiddleware);
```

---

## Step 5: Add Localization

```bash
mkdir -p locales/
cp locales/bn.json /path/to/your/bdaskai/locales/
```

### How to use in your frontend code:

```javascript
// Load Bengali strings
const bn = await fetch('/locales/bn.json').then(r => r.json());

// Use like:
document.getElementById('chat-placeholder').textContent = bn.chat.placeholder;
// Instead of hardcoded: "বাংলায় আপনার প্রশ্ন লিখুন..."
```

---

## Step 6: Update vercel.json Backend URL

Open `vercel.json` and replace:
```
"dest": "https://your-backend-url.railway.app/api/$1"
```
With your actual backend URL.

---

## Step 7: Handle Mocked Features

**Option A: Remove fake features (RECOMMENDED for now)**
Comment out or hide the Football and Currency tabs until real APIs are connected.

**Option B: Connect real APIs**
- Football: Sign up at football-data.org (free), add key to `.env`
- Currency: Sign up at exchangerate-api.com (free), add key to `.env`

---

## Step 8: Convert OG Image

The `og-image.svg` needs to be converted to `og-image.png` (1200×630):
- Upload SVG to Canva or CloudConvert
- Export as PNG at 1200×630
- Save as `frontend/public/og-image.png`

---

## Step 9: Final Commit & Deploy

```bash
cd bdaskai

# Stage all new files
git add -A

# Commit
git commit -m "feat: add production-ready configs, SEO, PWA, error handling, CI/CD

- Professional README.md (Bengali + English)
- SEO meta tags + Open Graph for WhatsApp/Facebook sharing
- PWA manifest + service worker for offline support
- Bengali localization file (locales/bn.json)
- Error handling with Bengali messages + retry logic
- Health check endpoint + error middleware
- Analytics tracking
- Docker + docker-compose setup
- Vercel deployment config
- GitHub Actions CI/CD
- sitemap.xml + robots.txt
- MIT License + Contributing guide
- Updated .gitignore (security)"

# Push
git push origin main
```

---

## Step 10: Post-Deploy Checklist

- [ ] Verify bdask.com loads correctly
- [ ] Test on mobile (Chrome on Android)
- [ ] Test WhatsApp sharing preview (paste bdask.com in WhatsApp)
- [ ] Test Facebook sharing (Facebook Sharing Debugger: developers.facebook.com/tools/debug/)
- [ ] Check health endpoint: `bdask.com/api/health`
- [ ] Test offline mode (disable WiFi, reload page)
- [ ] Test on 3G throttling (Chrome DevTools → Network → Slow 3G)
- [ ] Submit sitemap to Google Search Console

---

## What's Next (Week 2+)

1. **User Auth** — Add Google/Facebook OAuth or bKash phone login
2. **Real Football API** — Connect Football-Data.org
3. **Real Currency API** — Connect ExchangeRate-API
4. **Google Analytics 4** — Replace simple analytics
5. **Performance** — Lazy load images, optimize bundle size
6. **Community Features** — User profiles, saved questions, Q&A history
