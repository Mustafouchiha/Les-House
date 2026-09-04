# Taxta Bozor — Mini App (frontend)

Telegram Mini App: yog'och va qurilish materiallari bozori uchun POS + katalog +
ombor + kassa + qarzdorlik interfeysi. React 18 + Vite (JSX).

Backend: **https://github.com/Mustafouchiha/Les-House-backend**

## Ishga tushirish

```bash
npm install
cp .env.example .env      # dev'da bo'sh qoldiring — Vite proxy /api ni backendga uzatadi
npm run dev               # http://localhost:5173
```

Backend `http://localhost:8080` da ishlab turishi kerak (`VITE_API_PROXY` bilan
o'zgartiriladi). Telegramdan tashqarida sahifa tepasida **DEV** paneli chiqadi —
u yerdan rol tanlanadi (`+998901234567` = ADMIN, `…1111111` = MANAGER,
`…2222222` = OPERATOR, `…3333333` = WORKER, boshqasi = CUSTOMER).

## Build

```bash
npm run build            # dist/
```

## Environment

| O'zgaruvchi | Tavsif |
|---|---|
| `VITE_API_URL` | backend origin (production). Dev'da bo'sh |
| `VITE_API_PROXY` | dev proxy target (default `http://localhost:8080`) |

## Deploy

`render.yaml` — Render static site blueprint. Yoki `npm run build` natijasidagi
`dist/` ni istalgan static hostingga (Vercel, Netlify, Cloudflare Pages) joylang;
`VITE_API_URL` ni backend URL'ga qo'ying va SPA rewrite (`/* → /index.html`) yoqing.

## Telegram

`index.html` Telegram WebApp SDK'ni yuklaydi. `src/telegram.js` — SDK wrapper
(theme, `expand`, `initData`, `requestContact`) + brauzer uchun fallback. Mini App
`initData` ni `POST /api/auth/telegram` ga yuboradi, backend HMAC bilan tekshiradi.

BotFather sozlamalari backend README'sida.

## Tuzilishi

```
src/
  App.jsx            auth holati + sahifa router + account gating
  store.jsx          AuthProvider (Telegram/dev login) + CartProvider
  telegram.js        Telegram WebApp SDK wrapper
  api/client.js      fetch wrapper (JWT, VITE_API_URL)
  theme.css          maketdan olingan dizayn tokenlari (yashil blueprint)
  components/         Shell (sidebar/bottom-nav), Receipt, ui (Blueprint/Kpi/Dialog…)
  pages/             Savdo (POS), Dashboard, Ombor, Mahsulotlar, KirimChiqim,
                     Mijozlar, Qarzlar, Kassa, Hisobotlar, Kalkulyator, Tarix,
                     Employees, CustomerCatalog, Login
  lib/format.js      UZS/USD formatlash, o'lchov birliklari
```
