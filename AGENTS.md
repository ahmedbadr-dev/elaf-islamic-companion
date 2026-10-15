# Elaf — agent notes

React + Vite + Tailwind CSS + Capacitor Android app.

## Dev server

```bash
npm run dev
```

Default: `http://localhost:8443`  
Dashboard: `http://localhost:8443/dashboard`

## Project structure

- `src/main.tsx` — React entry; imports `src/index.css`, mounts `src/App.tsx`
- `src/App.tsx` — App shell and primary UI orchestration
- `src/index.css` — Global CSS + Tailwind v4 (`@import 'tailwindcss'`)
- `index.html` — Vite HTML shell (`#root`)
- `package.json` — Dependencies and scripts
- `vite.config.ts` — Vite + React + Tailwind + location hub plugin
- `android/` — Capacitor Android project
- `firestore.rules` — Firebase security rules

## Stack

- React 19 / React DOM 19
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Vite 8, TypeScript 5.7
- Capacitor 8, Firebase Auth + Firestore

## Styling

Use Tailwind utility classes in JSX. Theme / global CSS lives in `src/index.css`. Keep `@import` statements first.
