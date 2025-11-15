# Device & Game Library Tracker

A personal web application built with Next.js 14 for tracking consoles and building a video game backlog. The dashboard fuses RAWG, TheGamesDB, and YouTube metadata while personal ownership state, status, ratings, notes, and playtime stay safely in the browser via `localStorage`.

## Features

- 🔍 **RAWG-powered discovery** – search by title or platform, paginate through results, and import games with one click.
- 🧩 **Multi-API fusion layer** – RAWG provides core metadata, TheGamesDB fills retro box art gaps, and YouTube supplies gameplay videos when RAWG has none.
- 🎮 **Personal library controls** – ownership, play status, rating, playtime, and notes are editable from cards, the dashboard, and game detail pages.
- 📊 **Real-time stats** – totals, wishlist counts, playtime, top platforms, and top genres are computed locally from your library.
- 📺 **Rich detail pages** – hero art, description, stores, media gallery, trailer/gameplay video fallback, and similar games.
- ♿ **Accessibility aware** – light/dark theme, reduced motion, high contrast, and large text preferences persist locally and apply before hydration to avoid flicker.
- 📱 **PWA ready** – installable manifest, lightweight service worker, and offline cache for static assets.

## Tech stack

- [Next.js 14 (App Router)](https://nextjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- RAWG, TheGamesDB, and YouTube Data API v3 for public metadata
- Custom theme + settings providers backed by `localStorage`

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

This project is optimised for deployment on [Vercel](https://vercel.com/). Configure the following environment variables (server-side only):

| Name | Description |
| --- | --- |
| `RAWG_BASE_URL` | RAWG API base URL (defaults to `https://api.rawg.io/api`). |
| `RAWG_API_KEY` | RAWG API key consumed by the server-only fusion routes. |
| `YOUTUBE_SEARCH_BASE_URL` | YouTube Data API search endpoint (defaults to `https://www.googleapis.com/youtube/v3/search`). |
| `YOUTUBE_API_KEY` | YouTube Data API key for gameplay/trailer fallback. |
| `TGDB_BASE_URL` | TheGamesDB API base URL (defaults to `https://api.thegamesdb.net/v1`). |
| `TGDB_API_KEY` | TheGamesDB API key used for retro box art fallback. |

## Data storage

- Personal library entries are stored in the browser under the `DG_TRACKER_USER_GAMES` key and synchronised through the `useUserGameLibrary` hook.
- Devices, legacy ROM listings, and user settings also persist in `localStorage` to keep the app single-user friendly.
- JSON backup and restore for legacy data remains available under **Settings → Backup & Restore**.

## Project structure

```
app/                     # Next.js App Router pages & layout
app/api                  # API routes for fused metadata (RAWG, TGDB, YouTube)
components/              # Reusable UI components (dashboard cards, detail page helpers)
components/game          # Game detail specific components (actions panel, gallery, video)
components/dashboard     # Dashboard search, stats, and library views
hooks/                   # React context stores and localStorage hooks
lib/                     # Shared utilities, API clients, and types
public/                  # Static assets, icons, manifest, and service worker
```

## Notes

- Games use `crypto.randomUUID()` and RAWG ids for consistent keys in the local library.
- The fusion API routes are server-only; client components always call `/api/games/...` instead of talking to RAWG, TGDB, or YouTube directly.
- Theme and accessibility preferences are applied before React hydrates to eliminate light/dark flashing.

Enjoy managing your Device & Game Library! 🎯
