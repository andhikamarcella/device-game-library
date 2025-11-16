# Device & Game Library Tracker

A personal web application built with Next.js 14 that lets you track consoles, devices, and game collections. All data is stored in the browser via `localStorage`, making it easy to deploy and run without a backend.

## Features

- 🕹️ Dashboard overview for devices and games, including status breakdowns and recent activity.
- 📱 Device manager with filtering, favorites, and modal-based create/edit flows.
- 🎮 Games library table with advanced filters, quick status cycling, favorites, and detail drawers.
- ☁️ Backup & restore utilities with JSON export/import plus reset controls.
- 🌗 Dark/light theme toggle (default dark) persisted between sessions.
- 🔍 IGDB-powered discovery search with detailed game profiles for quick metadata lookups.
- 💾 Local-first storage layer using custom React context stores for games, devices, and settings.

## Tech stack

- [Next.js 14 (App Router)](https://nextjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- Custom theme preference provider synchronized with localStorage for flicker-free light/dark switching

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## Building for production

```bash
npm run build
npm start
```

## Deployment

This project is ready for one-click deployment on [Vercel](https://vercel.com/). Configure the following environment variables for IGDB access:

| Variable | Description |
| --- | --- |
| `IGDB_BASE_URL` | Usually `https://api.igdb.com/v4`. |
| `TWITCH_CLIENT_ID` | Your Twitch application client ID (used for IGDB auth). |
| `TWITCH_CLIENT_SECRET` | The matching Twitch client secret. |

Add them to your Vercel project and `.env.local` for local development.

## Data storage & backups

- All devices, games, and settings are stored locally in `window.localStorage`.
- Navigate to **Settings → Backup & Restore** to export a JSON backup or import a previous snapshot.
- Reset utilities are available for games, devices, or the entire app (with confirmations).

## Project structure

```
app/             # Next.js App Router pages & layout
components/      # Reusable UI components (cards, modals, badges, etc.)
hooks/           # React context stores for devices, games, settings
lib/             # Shared utilities, types, storage helpers, IGDB API client
public/          # Static assets
```

## Notes

- Games and devices use `crypto.randomUUID()` for identifiers.
- Status styling, cards, and layout all leverage Tailwind CSS with a dashboard-inspired dark theme.

Enjoy managing your Device & Game Library! 🎯
