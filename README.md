# Elaf — Islamic Companion

**Elaf** is a modern Islamic companion mobile app built with React, Vite, and Capacitor. It brings prayer times, Quran reading, digital dhikr, live streams, NFC-powered PRO features, and an AI assistant into one polished Android experience.

> Portfolio project showcasing full-stack mobile product work: native Android packaging, Firebase auth & Firestore, location-aware prayer times, NFC hardware flows, local notifications, and a consent-based ops dashboard.

---

## Highlights

| Area | What it delivers |
|------|------------------|
| **Prayer** | Location-based salah times (Aladhan / Umm al-Qura), countdown, Qibla, adhan modes |
| **Quran** | Mushaf reader with bookmarks and daily wird tracking |
| **Dhikr** | On-screen counter plus **NFC misbaha** pairing for PRO unlock |
| **Live** | Curated YouTube live / video channels (Haramain and more) |
| **AI** | “Ask Elaf” — Gemini-powered Islamic Q&A (PRO) |
| **Shop** | In-app misbaha order flow |
| **Widget** | Persistent Android prayer notification widget |
| **Azkar** | Scheduled morning / evening azkar audio reminders |
| **Dashboard** | Localhost map of consented user locations (nearby-mosques roadmap) |

---

## Tech stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite 8  
- **Mobile:** Capacitor 8 (Android)  
- **Backend / cloud:** Firebase Auth, Cloud Firestore  
- **APIs:** Aladhan prayer times, Gemini (Google AI), reverse geocoding  
- **Native plugins:** Geolocation, Local Notifications, Haptics, NFC (`@capgo/capacitor-nfc`), native settings  

---

## Architecture (high level)

```
src/
  App.tsx                 # Shell, tabs, PRO / NFC / location orchestration
  components/             # Screens (prayer, quran, live, AI, shop, auth…)
  services/               # Firebase, prayer times, NFC claim, Gemini, widgets
  hooks/                  # Schedulers (adhan, azkar, location, NFC)
  context/                # App / simulator state
android/                  # Capacitor Android project + custom plugins
firestore.rules           # Security rules (NFC tags, users, locations)
```

**NFC PRO flow:** scan mistaha tag → signup / login → claim tag in Firestore → welcome overlay → unlock PRO features.

**Prayer times:** device GPS → Aladhan timings by coordinates (city fallback) → cache with day invalidation → refresh from home / prayer UI.

---

## Getting started

### Prerequisites

- Node.js 22+  
- Android Studio (SDK + emulator or device)  
- A Firebase project (Auth + Firestore)  
- Optional: Gemini API key for AI features  

### Install

```bash
npm install
cp .env.example .env
# Set VITE_GEMINI_API_KEY and VITE_ADMIN_EMAILS as needed
```

### Web (local)

```bash
npm run dev
```

- App: `http://localhost:8443/`  
- Locations dashboard: `http://localhost:8443/dashboard`  

### Android

```bash
npm run cap:sync
npx cap open android
```

Build a debug APK from Android Studio, or:

```bash
cd android
./gradlew assembleDebug
```

---

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_GEMINI_API_KEY` | Google AI Studio key for Elaf AI |
| `VITE_ADMIN_EMAILS` | Optional admin emails (dashboard lock later) |

Never commit `.env`. Client Firebase config lives in `src/services/firebase.ts` — point it at **your** project before shipping.

Deploy Firestore rules when you change `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

---

## Product notes

- **Privacy:** Approximate location for nearby-mosques is synced only after explicit user consent.  
- **PRO:** Gated by NFC mistaha ownership stored in Firestore (`nfcTags` / `users`).  
- **RTL / Arabic UI:** Primary product language is Arabic; this repository documentation is English for portfolio clarity.  

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite development server |
| `npm run build` | Production web build |
| `npm run cap:sync` | Build web assets + Capacitor sync + adhan audio copy |
| `npm run format` | Format with oxfmt |

---

## Roadmap

- [ ] Nearby mosques based on consented location clusters  
- [ ] Dashboard authentication  
- [ ] Play Store release build & signing  
- [ ] iOS Capacitor target  

---

## Author

Built as a production-minded Islamic lifestyle / companion product — combining UI craft, native mobile integration, and cloud-backed identity & hardware (NFC) flows.

---

## License

Private portfolio use by default. Contact the author if you need other terms.
