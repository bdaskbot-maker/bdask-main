# 🤝 Contributing to BdAsk | বিডিআস্কে অবদান রাখুন

[English](#english) | [বাংলা](#bangla)

---

## English <a name="english"></a>

Thank you for your interest in contributing to BdAsk! We welcome contributions from developers across Bangladesh and beyond.

### How to Contribute

1. **Fork** this repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/bdaskai.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** and test thoroughly
5. **Commit**: `git commit -m "feat: add your feature description"`
6. **Push**: `git push origin feature/your-feature-name`
7. **Create a Pull Request** against the `main` branch

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — CSS/formatting changes (no code logic)
- `refactor:` — Code refactoring
- `test:` — Adding/updating tests
- `chore:` — Build/config changes

### Development Setup

```bash
# Clone and install
git clone https://github.com/bdaichat/bdaskai.git
cd bdaskai

# Setup environment
cp .env.example .env
# Fill in your API keys in .env

# Run backend
cd backend && npm install && npm start

# Run frontend (new terminal)
cd frontend && npm install && npm start
```

### Code Guidelines

- **Bengali strings**: Use `locales/bn.json` for all Bengali text — don't hardcode
- **Error messages**: Always provide Bengali error messages with English fallback
- **Mobile-first**: Test on mobile screen sizes (360px width minimum)
- **Accessibility**: Use semantic HTML and proper ARIA labels
- **Comments**: Write comments in English for code readability

### Priority Areas

We especially welcome contributions in:
- 🐛 Bug fixes
- 🌐 Bengali language improvements
- 📱 Mobile UX improvements
- ♿ Accessibility
- 🧪 Tests
- 📖 Documentation (Bengali)
- 🎨 UI/Design improvements

### Reporting Bugs

Open an [Issue](https://github.com/bdaichat/bdaskai/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshot if applicable
- Device/browser info

---

## বাংলা <a name="bangla"></a>

বিডিআস্কে অবদান রাখতে আপনার আগ্রহের জন্য ধন্যবাদ! বাংলাদেশ এবং বিশ্বজুড়ে ডেভেলপারদের অবদান আমরা স্বাগত জানাই।

### কিভাবে অবদান রাখবেন

১. এই রিপোজিটরি **Fork** করুন
২. আপনার ফর্ক **Clone** করুন: `git clone https://github.com/YOUR_USERNAME/bdaskai.git`
৩. নতুন **ব্রাঞ্চ তৈরি** করুন: `git checkout -b feature/your-feature-name`
৪. আপনার **পরিবর্তন করুন** এবং ভালোভাবে টেস্ট করুন
৫. **কমিট** করুন: `git commit -m "feat: আপনার ফিচারের বিবরণ"`
৬. **পুশ** করুন: `git push origin feature/your-feature-name`
৭. `main` ব্রাঞ্চে **Pull Request তৈরি** করুন

### যেসব ক্ষেত্রে অবদান রাখতে পারেন

- 🐛 বাগ ফিক্স
- 🌐 বাংলা ভাষার উন্নতি
- 📱 মোবাইল UX উন্নতি
- ♿ অ্যাক্সেসিবিলিটি
- 🧪 টেস্ট
- 📖 বাংলা ডকুমেন্টেশন
- 🎨 UI/ডিজাইন উন্নতি

### বাগ রিপোর্ট করুন

একটি [Issue](https://github.com/bdaichat/bdaskai/issues) খুলুন এবং জানান:
- কিভাবে সমস্যাটি ঘটে (ধাপে ধাপে)
- কি হওয়া উচিত ছিল vs কি হয়েছে
- স্ক্রিনশট (যদি সম্ভব হয়)
- ডিভাইস/ব্রাউজারের তথ্য

---

ধন্যবাদ! 🇧🇩
