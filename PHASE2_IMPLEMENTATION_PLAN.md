# Phase 2 Implementation Plan — GZCLP Workout Tracker

> **Context:** This plan maps the Phase 2 supplement spec to concrete implementation tasks. Phase 1 (Setup, Home, Active Workout, History, Settings, Rest Timer) is already in place. All Phase 2 work is additive.

---

## Current State Summary

| Component | Status |
|-----------|--------|
| Setup / Onboarding | ✅ Done |
| Home (basic) | ✅ Done — next workout, exercises list, lift grid |
| Active Workout | ✅ Done — set logging, rest timer, progression messages |
| History | ✅ Basic list of completed workouts |
| Settings | ✅ T3 config, units, rest timers |
| Data layer | Dexie (IndexedDB) + Supabase sync via single `user_data` JSON blob |
| Supabase schema | Single `user_data` table (Phase 2 doc proposes normalized tables) |

---

## Implementation Phases

### Phase 2.1 — Foundation & Data Model

**Goal:** Add progression event logging and schema support for new features without breaking existing sync.

| Task | Description | Effort |
|------|-------------|--------|
| **2.1.1** | Add `progression_events` to Dexie schema — store events when T1/T2 progression changes (weight_increased, session_completed, session_failed, stage_advanced, reset) | Medium |
| **2.1.2** | Update `finishWorkout` in store to write progression events for each T1/T2 exercise (success, fail, stage advance, reset) | Medium |
| **2.1.3** | Add `notes` to workout sessions and per-exercise notes in `WorkoutExercise` type | Small |
| **2.1.4** | Add `completed_at` to sessions for duration tracking | Small |
| **2.1.5** | Add `bodyweight_log` table to Dexie | Small |
| **2.1.6** | Add `personal_records` table to Dexie; compute PRs on workout completion | Medium |
| **2.1.7** | Update Supabase sync to include new tables in `user_data` JSON (or plan migration to normalized schema — see 2.1.8) | Medium |
| **2.1.8** | **Optional:** Migrate Supabase to normalized schema (profiles, lift_state, workouts, progression_events, etc.) per Phase 2 doc — only if multi-device/auth is required | Large |

**Deliverables:** Progression events persisted, notes/duration/bodyweight/PRs in data model, sync updated.

---

### Phase 2.2 — Dashboard Overhaul

**Goal:** Transform Home into the full dashboard per spec (1A, 1B, 1C, 1D).

| Task | Description | Effort |
|------|-------------|--------|
| **2.2.1** | **Next Workout Preview** — Expand to show all exercises with weights and schemes; add "Rest Day — Next: Day X" when user worked out today | Small |
| **2.2.2** | **Lift Overview Cards** — One card per main lift (Squat, Bench, Deadlift, OHP) with T1/T2 weights, stages, "+X lbs since start", last session date, streak | Medium |
| **2.2.3** | **Card color coding** — Green (Stage 1), Yellow/amber (Stage 2/3), Blue (recently reset) | Small |
| **2.2.4** | **Recent Activity Feed** — Scrollable list of recent workouts with compact format (date, day, exercises + outcome) | Medium |
| **2.2.5** | **Lift Detail Screen** — New route `/lift/:liftName`; header with T1/T2 weights, all-time best; progress chart; stage visualization; session history table | Large |
| **2.2.6** | **Progression Event Log** — Per-lift timeline with icons (▲ ✅ ❌ ⟳ →) and "always show the math" for resets/stage advances | Large |
| **2.2.7** | **Aggregate Stats** — New route `/stats`; total volume, consistency streak, workouts/week, avg duration, estimated 1RM, bodyweight trend, days since last workout | Large |
| **2.2.8** | **Body weight entry** — Quick tap-to-enter on dashboard; 7-day rolling average display | Medium |

**Deliverables:** Full dashboard, Lift Detail screen, Stats page, Recent Activity, Progression Event Log.

---

### Phase 2.3 — Exercise Instructions

**Goal:** Every exercise has an instruction page (2A, 2B, 2C).

| Task | Description | Effort |
|------|-------------|--------|
| **2.3.1** | Create `EXERCISE_INSTRUCTIONS` constant — object mapping exercise name → { muscles, equipment, keyPoints, commonMistakes, breathing } for all 20 exercises in spec | Medium |
| **2.3.2** | Create `ExerciseInfoModal` component — bottom sheet/modal with header, tags, Key Points, Common Mistakes, Breathing | Medium |
| **2.3.3** | Add info icon (ⓘ) next to exercise name on Active Workout screen; opens ExerciseInfoModal (context-sensitive overlay) | Small |
| **2.3.4** | Add Exercise Library in Settings — list of all exercises, tap to open instruction card | Small |
| **2.3.5** | Handle exercises not in library (custom T3s) — show placeholder or "No instructions available" | Small |

**Deliverables:** Exercise info modal, 20 exercises with full content, access from workout + settings.

---

### Phase 2.4 — GZCLP Education

**Goal:** Teach users the methodology (3A, 3B, 3C).

| Task | Description | Effort |
|------|-------------|--------|
| **2.4.1** | Create "Learn GZCLP" page — Philosophy, Why Failure Scheme Matters, Sawtooth Pattern (with simple illustration) | Medium |
| **2.4.2** | Add route `/learn` and link from Settings | Small |
| **2.4.3** | **Contextual tooltips** — Info icons next to Stage 1/2/3, T1/T2/T3 labels, reset events, AMRAP, weight increment; expand on tap | Medium |
| **2.4.4** | **Post-Workout Summary** — Replace or enhance current "Finish Workout" flow with GZCLP-aware recap (per-exercise: outcome, next session, tooltip for stage advance) | Large |

**Deliverables:** Learn GZCLP page, tooltips throughout app, enhanced post-workout summary.

---

### Phase 2.5 — Workout Utilities & Quality of Life

**Goal:** Plate calculator, warm-ups, timer, notes, PRs, rest recommendations (4A–4G).

| Task | Description | Effort |
|------|-------------|--------|
| **2.5.1** | **Plate Calculator** — Modal from active workout (button near weight); input target weight, show plates per side; configurable plate inventory in Settings | Medium |
| **2.5.2** | **Warm-Up Calculator** — Collapsible section before each T1; bar×10, ~50%×5, ~75%×3, ~90%×1; auto-adjust to working weight | Medium |
| **2.5.3** | **Workout Duration Timer** — Auto-start on workout start, display elapsed time, log with session, show in stats | Small |
| **2.5.4** | **Workout Notes** — Per-exercise note field (during workout); per-session note; display in history | Medium |
| **2.5.5** | **Personal Records** — Detect weight/volume PRs on completion; show "🏆 New PR!" toast; PR history in Stats | Medium |
| **2.5.6** | **Rest Day Recommendation** — If 2+ consecutive workout days, show gentle note on dashboard | Small |

**Deliverables:** Plate calc, warm-ups, duration timer, notes, PR celebration, rest day note.

---

### Phase 2.6 — Data Management & PWA

**Goal:** Auth, sync, offline, export, PWA config (4H, 4I).

| Task | Description | Effort |
|------|-------------|--------|
| **2.6.1** | **Auth** — Supabase email/password or magic link; gate data behind user | Large |
| **2.6.2** | **Real-time sync** — Persist to Supabase on every set completion (already partially done via `pushToSupabase`) | Small |
| **2.6.3** | **Offline support** — IndexedDB cache; queue writes when offline; sync when back online | Medium |
| **2.6.4** | **Export** — JSON export from Settings (already exists) | Done |
| **2.6.5** | **PWA** — Service worker, web manifest (name, icons, theme color dark), Add to Home Screen prompt, full-screen display, splash screen | Medium |

**Deliverables:** Auth (if desired), offline-first sync, full PWA setup.

---

### Phase 2.7 — Optional / Post-MVP

| Task | Description |
|------|-------------|
| **2.7.1** | Notifications (workout reminder, rest timer, weekly summary) |
| **2.7.2** | Supabase schema migration to normalized tables |

---

## Recommended Implementation Order

```
2.1 (Foundation)  →  2.2 (Dashboard)  →  2.3 (Exercise Instructions)  →  2.4 (GZCLP Education)
         ↓                    ↓                         ↓                            ↓
    2.5 (Utilities)  ←───────────────────────────────────────────────────────────────┘
         ↓
    2.6 (Data & PWA)
```

**Rationale:**
- 2.1 provides progression events and data structures needed by 2.2 (Lift Detail, Progression Log, Stats).
- 2.2 delivers the most visible user value (dashboard, lift detail, stats).
- 2.3 and 2.4 are largely independent and can run in parallel after 2.2.
- 2.5 builds on 2.1 (notes, PRs, timer) and enhances the workout flow.
- 2.6 can be done incrementally; PWA is quick, Auth is optional for MVP.

---

## Dependencies to Add

| Package | Purpose |
|---------|---------|
| `recharts` or `chart.js` | Line charts for Lift Detail and Stats |
| (Optional) `@radix-ui/react-dialog` or similar | Bottom sheet / modal for exercise info |
| (Optional) `vite-plugin-pwa` | Service worker, manifest generation |

---

## File Structure Additions

```
src/
├── pages/
│   ├── LiftDetail.tsx      # New — per-lift detail
│   ├── Stats.tsx           # New — aggregate stats
│   ├── LearnGZCLP.tsx      # New — education
│   └── ExerciseLibrary.tsx # New — or section in Settings
├── components/
│   ├── ExerciseInfoModal.tsx
│   ├── PlateCalculator.tsx
│   ├── WarmUpSection.tsx
│   ├── ProgressionEventLog.tsx
│   ├── LiftOverviewCard.tsx
│   └── GZCLPTooltip.tsx
├── data/
│   └── exerciseInstructions.ts  # All 20 exercises
└── lib/
    └── progressionEvents.ts     # Event creation helpers
```

---

## Schema Alignment Note

The Phase 2 doc specifies a **normalized Supabase schema** (profiles, lift_state, workouts, workout_exercises, workout_sets, progression_events, etc.). The current app uses a **single `user_data` JSON blob** synced to Supabase.

**Options:**
1. **Keep JSON blob** — Extend the blob to include progression_events, bodyweight_log, personal_records. Simpler, works with current sync.
2. **Migrate to normalized** — Required for multi-user, real-time collaboration, or complex queries. Larger effort; consider for post-MVP.

Recommendation: Implement Phase 2 with extended JSON blob first; migrate schema later if needed.

---

## Effort Summary

| Phase | Est. Effort |
|-------|-------------|
| 2.1 Foundation | 2–3 days |
| 2.2 Dashboard | 4–5 days |
| 2.3 Exercise Instructions | 1–2 days |
| 2.4 GZCLP Education | 1–2 days |
| 2.5 Utilities | 2–3 days |
| 2.6 Data & PWA | 2–3 days |
| **Total** | **~12–18 days** |

---

## Quick Wins (Do First)

1. **2.1.3–2.1.4** — Notes + completed_at (small, enables other features)
2. **2.5.3** — Workout duration timer (small, high value)
2. **2.5.6** — Rest day recommendation (small)
3. **2.3.1–2.3.3** — Exercise instructions + modal on workout screen (medium, very useful in gym)
