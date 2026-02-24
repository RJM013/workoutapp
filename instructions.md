# GZCLP Workout Tracker — App Specification & Build Prompt

## Overview

Build a mobile-first web app for tracking the GZCLP (GZCL Linear Progression) weightlifting program. The app should be fast, minimal, and optimized for use between sets at the gym — big tap targets, minimal navigation, and zero friction logging. It should be a single-page React app that works as a bookmarked PWA on a phone.

Supabase will be the backend for edge functions, and data storage. 
API url: https://ysrioiyrgunppmqdwdsx.supabase.co
Publishable key: sb_publishable_s8IF8vepSlg-Nw1XEhRqbw_EJ-cUJ-a
Deployment style: Vercel

---

## Core Concepts

### The GZCLP Program Structure

GZCLP is a 4-day lifting program that rotates through 4 workout days:

| Day | T1 (Heavy)       | T2 (Volume)       |
|-----|-------------------|--------------------|
| A1  | Squat 5x3        | Bench Press 3x10   |
| B1  | OHP 5x3          | Deadlift 3x10      |
| A2  | Bench Press 5x3  | Squat 3x10         |
| B2  | Deadlift 5x3     | OHP 3x10           |

Each day also includes T3 (accessory) exercises. The days cycle in order: A1 → B1 → A2 → B2 → A1 → ...

### Tier System

**T1 — Heavy compound lifts.** The primary strength driver for the day.
- Progression: Add weight every session (5 lbs upper body, 10 lbs lower body)
- Failure scheme: 5x3 → 6x2 → 10x1 → Reset to 85% and restart at 5x3

**T2 — Moderate volume compound lifts.** Same 4 lifts as T1, but on different days and at lighter weight with more reps.
- Progression: Add weight every session (5 lbs upper body, 10 lbs lower body)
- Failure scheme: 3x10 → 3x8 → 3x6 → Reset to 85% and restart at 3x10

**T3 — Accessories.** Isolation/machine exercises for weak points and aesthetics.
- 3 sets, last set is AMRAP (As Many Reps As Possible), target 15 reps on first two sets
- Progression: When AMRAP set hits 25+ reps, increase weight next session (typically 5 lbs)
- No complex failure scheme — just stay at the same weight until AMRAP hits 25

### Progression Logic (Critical)

This is the core value of the app — automating the progression decisions.

**T1 Progression Detail:**

| Stage  | Scheme | On Success (completed all reps)     | On Failure (couldn't complete)       |
|--------|--------|--------------------------------------|---------------------------------------|
| Stage 1| 5x3    | Add weight next session              | Move to Stage 2 at SAME weight       |
| Stage 2| 6x2    | Add weight next session              | Move to Stage 3 at SAME weight       |
| Stage 3| 10x1   | Add weight next session              | RESET: 85% of failed weight → Stage 1|

**T2 Progression Detail:**

| Stage  | Scheme | On Success (completed all reps)     | On Failure (couldn't complete)       |
|--------|--------|--------------------------------------|---------------------------------------|
| Stage 1| 3x10   | Add weight next session              | Move to Stage 2 at SAME weight       |
| Stage 2| 3x8    | Add weight next session              | Move to Stage 3 at SAME weight       |
| Stage 3| 3x6    | Add weight next session              | RESET: 85% of failed weight → Stage 1|

**Weight increment rules:**
- Squat: +10 lbs per successful session (T1 and T2 tracked independently)
- Deadlift: +10 lbs per successful session
- Bench Press: +5 lbs per successful session
- OHP: +5 lbs per successful session
- T3 exercises: +5 lbs when AMRAP ≥ 25

**Reset calculation:** Round down to nearest 5 lbs. Example: Failed 10x1 at 185 lbs → 185 × 0.85 = 157.25 → reset to 155 lbs at 5x3.

---

## Data Model

### User Profile / Settings
```
{
  units: "lbs" | "kg",              // default lbs
  t3Exercises: {                     // customizable T3 selections per day
    A1: ["Lat Pulldown", "Face Pull"],
    B1: ["Dumbbell Row", "Bicep Curl"],
    A2: ["Lat Pulldown", "Cable Crunch"],
    B2: ["Dumbbell Row", "Lateral Raise"]
  }
}
```

### Lift State (persistent, per lift, per tier)
Each of the 4 main lifts has INDEPENDENT state for T1 and T2:
```
{
  liftName: "Squat",
  tier: "T1",
  currentWeight: 135,
  currentStage: 1,              // 1, 2, or 3
  currentScheme: "5x3",         // derived from stage
  increment: 10,                // lbs per successful session
  history: [                    // array of past sessions
    {
      date: "2025-02-24",
      weight: 125,
      stage: 1,
      scheme: "5x3",
      setsCompleted: [3, 3, 3, 3, 3],  // reps achieved per set
      completed: true                     // did they hit all prescribed reps?
    }
  ]
}
```

### T3 Lift State
```
{
  liftName: "Lat Pulldown",
  currentWeight: 80,
  history: [
    {
      date: "2025-02-24",
      weight: 80,
      setsCompleted: [15, 15, 22],  // last set is AMRAP
      amrapHit25: false
    }
  ]
}
```

### Workout Session (in-progress)
```
{
  day: "A1",
  date: "2025-02-24",
  startTime: timestamp,
  exercises: [
    { liftName: "Squat", tier: "T1", targetWeight: 135, targetScheme: "5x3", 
      sets: [
        { targetReps: 3, actualReps: null, completed: false },
        { targetReps: 3, actualReps: null, completed: false },
        // ... one per set
      ]
    },
    // T2 and T3 exercises...
  ],
  status: "in_progress" | "completed"
}
```

---

## Default Exercise Library

### T3 Exercise Options (user selects which ones to include per day)

**Pull movements:** Lat Pulldown, Dumbbell Row, Cable Row, Barbell Row, Pull-Up, Chin-Up, Face Pull

**Push movements:** Dumbbell Bench Press, Incline Dumbbell Press, Dips, Tricep Pushdown, Overhead Tricep Extension

**Arms:** Bicep Curl, Hammer Curl, EZ Bar Curl, Tricep Pushdown, Skull Crushers

**Shoulders:** Lateral Raise, Front Raise, Rear Delt Fly, Face Pull

**Core:** Cable Crunch, Hanging Leg Raise, Ab Wheel Rollout, Plank (timed)

**Legs:** Leg Press, Leg Curl, Leg Extension, Bulgarian Split Squat, Calf Raise, Hip Thrust

Allow users to also type in custom exercise names.

---

## Screens & User Flow

### 1. Home / Dashboard
- Show which workout day is next (A1, B1, A2, or B2)
- Show the exercises for that day with current weights and schemes
- Big "Start Workout" button
- Quick stats: current working weights for the 4 main lifts, streak/consistency info
- Access to history and settings

### 2. Active Workout Screen (MOST IMPORTANT — this is where 90% of time is spent)
- Show current exercise name, weight, and target scheme prominently at top
- Display sets as large, tappable circles/buttons in a row
- Each set button shows target reps (e.g., "3") 
- **Tap a set to mark it complete** (fills in with target reps)
- **Long press or tap a completed set to edit** the actual reps if they got fewer than target
- After all sets for an exercise are logged, show a brief result:
  - ✅ "All reps hit — adding 5 lbs next session"
  - ❌ "Missed reps — moving to 6x2 next session" (or whatever the progression dictates)
- "Next Exercise" button advances to T2, then T3s
- **Rest timer**: Auto-starts when a set is marked complete
  - T1: 3-5 min default (user configurable)
  - T2: 2-3 min default
  - T3: 60-90 sec default
  - Visual countdown, optional vibration/sound alert
  - Skippable
- For T3 AMRAP (last set): show a number input or quick +/- stepper for reps instead of a simple tap
- At the end: "Workout Complete" summary screen with all lifts and whether progression advances

### 3. History / Progress Screen
- List of past workouts by date
- Tap into a workout to see details
- Per-lift progress chart (weight over time) — simple line chart
- Show current stage for each T1/T2 lift (so you can see "Bench T1: Stage 2, 6x2 @ 145 lbs")

### 4. Settings / Configuration
- Edit T3 exercise selections per day (add/remove/reorder)
- Add custom T3 exercises
- Edit current weights for any lift (manual override for when you need to adjust)
- Edit progression stage for any lift (manual override)
- Units toggle (lbs/kg)
- Rest timer duration defaults
- Export data as JSON (backup)
- Import data from JSON (restore)
- Reset all data (with confirmation)

### 5. Initial Setup (First Launch)
- Welcome screen explaining GZCLP briefly
- Enter starting weights for the 4 main lifts (T1 weight — T2 will auto-calculate at ~65-70% of T1, or let user set independently)
- Select T3 exercises for each day from the library (with sensible defaults pre-selected)
- Option to customize rest timer defaults

---

## UI/UX Requirements

### Mobile-First Design
- **Everything must be usable with one thumb on a phone screen**
- Minimum tap target: 48x48px (ideally larger for set buttons — 64px+)
- No tiny text — minimum 16px body, 20px+ for weights/reps during active workout
- High contrast (gym lighting varies — dark mode preferred or auto-detect)
- No horizontal scrolling ever
- Minimal navigation depth — 2 taps max to get anywhere

### Active Workout UX Priorities
1. **See what you need to do** (exercise, weight, reps) at a glance
2. **Log a set in one tap** (the most common action)
3. **See rest timer** without navigating away
4. **Know what's next** without thinking
5. **Handle failures gracefully** — if you got 2 reps instead of 3, make it easy to log that

### Visual Design
- Clean, minimal, dark theme (easy on eyes in gym lighting)
- Use color sparingly but meaningfully:
  - Green: completed sets/successful progression
  - Red/Orange: failed sets/missed reps
  - Blue/Purple: current/active set
  - Gray: upcoming/not yet attempted
- Weight numbers should be the most prominent element during a workout
- Sans-serif font, high readability

### Offline Capability
- The app should work without internet once loaded (service worker / PWA)
- All data stored locally
- No account creation or login required

---

## Technical Recommendations

### Stack Options

**Simple (recommended for MVP):**
- Single-file React app (JSX) with Tailwind CSS
- localStorage or IndexedDB for persistence
- No backend, no auth, no server
- Deploy as a static site (Vercel, Netlify, GitHub Pages)

**More robust (if building as a portfolio piece):**
- React + TypeScript
- IndexedDB via Dexie.js for structured local storage
- PWA with service worker for offline support
- Optional: Supabase or Firebase for cloud sync/backup
- Optional: Auth if you want multi-device sync

### Key Technical Considerations
- **State management**: React context or Zustand — keep it simple. The data model isn't complex enough to need Redux.
- **Rest timer**: Use `setInterval` with a ref to avoid drift. The timer should persist if the user switches exercises or navigates.
- **Data integrity**: Always save workout state on every set completion (not just at the end). If the app crashes or the phone dies, the workout should be recoverable.
- **Weight calculations**: Always round to nearest 5 lbs (or 2.5 kg). Use a utility function for all weight math.
- **PWA manifest**: Include so users can "Add to Home Screen" for a native app feel — no browser chrome, launches full screen.

---

## Nice-to-Haves (Post-MVP)

- **Plate calculator**: Enter target weight, shows which plates to load on each side of the bar (assuming 45 lb bar). Very useful in the gym.
- **1RM estimator**: Based on current working weights and rep schemes, estimate one-rep max for each lift.
- **Body weight tracking**: Simple weight log with trend line.
- **Workout notes**: Free-text notes per exercise or per session ("left shoulder felt tight", "spotter helped on last rep").
- **PR notifications**: Celebrate when you hit a new weight milestone.
- **Estimated workout duration**: Based on historical data, estimate how long today's session will take.
- **Warm-up set calculator**: Suggest warm-up sets ramping up to your working weight (e.g., bar x 10, 50% x 5, 75% x 3, then working sets).
- **Dark/light theme toggle**.
- **Haptic feedback** on set completion (if device supports it).
- **Share/export** a workout summary (screenshot-friendly card format).

---

## Example User Flow

1. User opens app → sees "Today: Day A1 — Squat / Bench / Lat Pulldown / Face Pull"
2. Taps "Start Workout"
3. Screen shows: **SQUAT — 135 lbs — 5x3**
4. Five circles labeled "3" appear in a row
5. User does first set of 3 reps, taps first circle → it turns green, rest timer starts (3:00)
6. Timer counts down, user rests
7. User does set 2, taps second circle → green, timer resets
8. Repeats for all 5 sets
9. All green → message: "✅ Squat T1 complete — 145 lbs next session"
10. Taps "Next Exercise" → **BENCH PRESS — 95 lbs — 3x10**
11. Three circles labeled "10" appear
12. User completes 10, 10, but only gets 8 on last set
13. Taps third circle, edits to 8 → circle turns orange
14. Message: "❌ Missed reps — staying at 95 lbs, moving to 3x8 next session"
15. Continues through T3 exercises
16. On Lat Pulldown last set (AMRAP): stepper shows reps, user enters 22
17. Message: "Keep going — hit 25 to increase weight"
18. After all exercises: **Workout Complete** summary card
19. Data saved, next workout auto-advances to B1