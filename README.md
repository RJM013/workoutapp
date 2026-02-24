# GZCLP Workout Tracker

A mobile-first PWA for tracking the GZCLP (GZCL Linear Progression) weightlifting program. Optimized for use between sets at the gym with big tap targets, minimal navigation, and zero-friction logging.

## Features

- **4-day program** (A1, B1, A2, B2) with automatic day rotation
- **T1/T2 progression** — Full failure scheme: 5x3→6x2→10x1 (T1) and 3x10→3x8→3x6 (T2) with auto-reset at 85%
- **T3 accessories** — AMRAP progression (hit 25+ to add weight)
- **Rest timer** — Auto-starts after each set, configurable per tier
- **Offline-first** — IndexedDB storage, works without internet
- **Supabase sync** — Cloud backup with anonymous auth (no signup)
- **PWA** — Add to home screen for app-like experience

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- Zustand (state)
- Dexie (IndexedDB)
- Supabase (cloud sync)
- React Router

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Enable **Anonymous sign-ins**: Authentication → Providers → Anonymous → Enable
3. Run the migration in SQL Editor: copy `supabase/migrations/20250224000000_initial_schema.sql`
4. Add env vars (or use `.env` from `.env.example`):
   - `VITE_SUPABASE_URL` — Project URL
   - `VITE_SUPABASE_ANON_KEY` — Project Settings → API → anon public key

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy (Vercel)

```bash
vercel
```

Or connect your repo to Vercel for automatic deployments.
