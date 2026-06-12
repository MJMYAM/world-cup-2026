# 🏆 كأس العالم 2026 — النسخة المثالية (v2.0)

> جدول تفاعلي كامل لكأس العالم 2026 — مُعاد بناؤه من الصفر بهيكل modular احترافي.

## ✨ المميزات

- 📱 **PWA كامل** — قابل للتثبيت ويعمل offline
- ⚡ **Service Worker** مع Stale-While-Revalidate
- 🌐 **i18n** — عربي / إنجليزي (قابل للتوسع)
- 🏆 **Tournament Bracket** — شجرة الأدوار الإقصائية
- 📊 **ترتيب مباشر** للمجموعات الـ12 (عبر ESPN)
- ⚽ **نتائج مباشرة** كل دقيقتين
- 🎯 **بطاقة مباراة قابلة للتوسيع** — الأهداف + التشكيلة + القناة
- 🔍 **بحث ذكي** (عربي + إنجليزي)
- 🎨 **Dark theme** (قابل لإضافة Light)
- ⌨️ **اختصارات لوحة المفاتيح** (1-5 للتابات)
- ♿ **ARIA labels** كاملة
- 🌐 **مسارات URL** (hash-based routing)
- 🔌 **ES Modules** بنية قابلة للصيانة

## 🗂️ هيكل المشروع

```
wc2026-pro/
├── index.html              ← الصفحة الرئيسية
├── bracket.html            ← صفحة شجرة الإقصائيات (الخيار D)
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service Worker
├── assets/
│   └── icons/              ← أيقونات PWA
├── src/
│   ├── main.js             ← نقطة الدخول
│   ├── core/
│   │   ├── store.js        ← State management
│   │   ├── api.js          ← ESPN + Claude + caching
│   │   └── i18n.js         ← الترجمة
│   ├── data/
│   │   ├── teams.js        ← 48 منتخب
│   │   ├── stadiums.js     ← 16 ملعب
│   │   ├── groups.js       ← 12 مجموعة
│   │   └── matches.js      ← 104 مباراة
│   ├── components/
│   │   └── MatchCard.js
│   ├── pages/
│   │   ├── Home.js
│   │   └── Bracket.js
│   ├── styles/
│   │   ├── tokens.css      ← Design tokens
│   │   ├── base.css
│   │   ├── components.css
│   │   └── bracket.css
│   └── utils/
│       └── utils.js
└── docs/
    ├── ANALYSIS.md         ← تحليل v1.0
    └── ROADMAP.md          ← خارطة الطريق
```

## 🚀 التشغيل

```bash
# لا يحتاج build step — شغّله بأي HTTP server
python -m http.server 8080
# أو
npx serve .
```

ثم افتح `http://localhost:8080/`

> ⚠️ لا تفتح الملف مباشرة (`file://`) — الـES modules تحتاج HTTP.

## 🔧 التطوير

### إضافة ترجمة جديدة

```js
// src/core/i18n.js
dict.fr = {
  app_title: "Coupe du Monde 2026",
  // ...
};
```

### إضافة منتخب

```js
// src/data/teams.js
TEAMS["المنتخب الجديد"] = "🏳️";
ISO["المنتخب الجديد"] = "xx"; // ISO 3166-1 alpha-2
ALIAS["المنتخب الجديد"] = ["new team", "newteam"];
```

### إضافة مرحلة جديدة

عدّل `ROUNDS` و `M` في `src/data/matches.js`، ثم أضف `i` و `label` في `Bracket.js`.

## 📡 المصادر

- **ESPN API** — `site.api.espn.com` (مجاني، بدون API key)
- **Claude API** — `api.anthropic.com` (fallback للبحث)
- **flagcdn.com** — صور الأعلام
- **Google Fonts** — Changa + IBM Plex Sans Arabic

## 📜 الترخيص

MIT — استخدمه، طوره، انشره.

---

> إعداد وتنفيذ: **مبارك المعتوق** ⚽
