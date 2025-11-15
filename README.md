# Device & Game Library Tracker

A personal web application built with Next.js 14 that lets you track consoles, devices, and game collections. Library progress, wishlist state, ratings, notes, and playtime are stored in Supabase while RAWG powers rich public metadata.

## Features

- 🧠 RAWG-powered discovery search with per-platform filtering, paginated results, and quick library import.
- 📊 Dashboard stats summarising totals, wishlist, playtime, and top platforms/genres sourced from Supabase.
- 🎮 Personal library controls for ownership, status, rating, playtime, and notes with optimistic updates.
- 📺 Game detail view with trailers, screenshot gallery, community reviews, similar games, and Supabase-integrated progress tracking.
- ☁️ Supabase-backed persistence designed for single-user today with a migration path to multi-user tomorrow.
- 🌗 Dark/light theme toggle plus accessibility preferences (reduced motion, high contrast, large text).
- 📱 Installable PWA shell with offline caching of static assets.

## Tech stack

- [Next.js 14 (App Router)](https://nextjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase JavaScript client](https://supabase.com/docs/reference/javascript)
- Custom theme preference provider synchronised with localStorage for flicker-free light/dark switching

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

This project is ready for one-click deployment on [Vercel](https://vercel.com/). Set the following environment variables for production and local development:

| Name | Description |
| --- | --- |
| `RAWG_BASE_URL` | RAWG API base URL (defaults to `https://api.rawg.io/api`). |
| `NEXT_PUBLIC_RAWG_API_KEY` | RAWG API key used by the server-side proxy routes. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase credentials for library persistence. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase credentials when using the browser SDK. |

Optional: set `DG_TRACKER_DEFAULT_USER_ID` if you want to reserve a specific UUID for the single-user setup.

## Data storage

- Personal library data lives in the Supabase `user_games` table (see `supabase/migrations` for the schema).
- Devices and legacy local features continue to use localStorage via the existing React context stores.
- JSON backup and restore for legacy data remains available under **Settings → Backup & Restore**.

## Project structure

```
app/                     # Next.js App Router pages & layout
app/actions              # Server actions for Supabase mutations
components/              # Reusable UI components (cards, dashboards, game detail helpers)
components/game          # Game detail specific components (actions panel, gallery, video)
components/dashboard     # Dashboard cards, search, and library grid
hooks/                   # React context stores for devices, games, and settings
lib/                     # Shared utilities, Supabase helpers, types, RAWG API client
public/                  # Static assets, icons, PWA manifest and service worker
supabase/migrations      # SQL migrations for the `user_games` table
```

## Notes

- Games and devices use `crypto.randomUUID()` for identifiers when stored locally.
- Supabase rows use server-side UUID generation with automatic `updated_at` triggers.
- Status styling, cards, and layout leverage Tailwind CSS with a modern dark-first theme.

Enjoy managing your Device & Game Library! 🎯
