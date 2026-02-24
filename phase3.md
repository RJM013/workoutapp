# GZCLP Workout Tracker — App Specification v3

## Overview

Build a mobile-first web app for tracking the GZCLP (GZCL Linear Progression) weightlifting program. The app should be fast, minimal, and optimized for use between sets at the gym — big tap targets, minimal navigation, and zero friction logging. It should be a single-page React app that works as a bookmarked PWA on a phone. Primary target device is iPhone 16 Pro Max (430 x 932pt viewport, 3x retina).

---

## Core Concepts

### The GZCLP Program Structure

GZCLP is a 4-day lifting program that rotates through 4 workout days. **The T1 and T2 exercises are fully configurable by the user**, but each day always follows the structure: one T1 lift, one T2 lift, and 1-3 T3 accessories.

**Default Configuration:**

| Day | T1 (Heavy)           | T2 (Volume)          |
|-----|----------------------|----------------------|
| A1  | Smith Squat 5x3      | Bench Press 3x10     |
| B1  | Dumbbell OHP 5x3     | Leg Press 3x10       |
| A2  | Bench Press 5x3      | Smith Squat 3x10     |
| B2  | Leg Press 5x3        | Dumbbell OHP 3x10    |

Each day also includes T3 (accessory) exercises. The days cycle in order: A1 → B1 → A2 → B2 → A1 → ...

### Tier System

**T1 — Heavy compound lifts.** The primary strength driver for the day.
- Progression: Add weight every session (increment varies by exercise — see table below)
- Failure scheme: 5x3 → 6x2 → 10x1 → Reset to 85% and restart at 5x3

**T2 — Moderate volume compound lifts.** Same movement patterns as T1, but on different days and at lighter weight with more reps.
- Progression: Add weight every session (increment varies by exercise — see table below)
- Failure scheme: 3x10 → 3x8 → 3x6 → Reset to 85% and restart at 3x10

**T3 — Accessories.** Isolation/machine exercises for weak points and aesthetics.
- 3 sets, last set is AMRAP (As Many Reps As Possible), target 15 reps on first two sets
- Progression: When AMRAP set hits 25+ reps, increase weight next session
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

**Weight increment rules (per exercise, user-configurable):**

| Exercise          | Default Increment | Rounding         | Notes |
|-------------------|-------------------|------------------|-------|
| Bench Press       | +5 lbs            | Nearest 5 lbs    | Barbell — standard plates |
| Smith Squat       | +10 lbs           | Nearest 5 lbs    | Smith bar — standard plates |
| Leg Press         | +10 lbs           | Nearest 5 lbs    | Machine — plate loaded |
| Dumbbell OHP      | +10 lbs (5/hand)  | Nearest 10 lbs   | DBs jump 5 lbs per hand = 10 total. Progression may be every other session. |
| T3 (all)          | +5 lbs            | Nearest 5 lbs    | When AMRAP ≥ 25 |

**Important: Dumbbell increment handling.** Dumbbell exercises round to the nearest 10 lbs total (since most gyms have 5 lb increments per dumbbell). The app should account for this in all weight calculations including resets. Example: DB OHP reset from 60 lbs → 60 × 0.85 = 51 → round to 50 lbs.

**Reset calculation:** Round down to nearest rounding increment: `Math.floor(weight * 0.85 / rounding) * rounding`. Examples:
- Barbell bench failed 10x1 at 185 lbs → 185 × 0.85 = 157.25 → `floor(157.25 / 5) * 5` = 155 lbs
- DB OHP failed 10x1 at 70 lbs → 70 × 0.85 = 59.5 → `floor(59.5 / 10) * 10` = 50 lbs
- Smith Squat failed 10x1 at 195 lbs → 195 × 0.85 = 165.75 → `floor(165.75 / 5) * 5` = 165 lbs
- Leg Press failed 3x6 at 250 lbs → 250 × 0.85 = 212.5 → `floor(212.5 / 5) * 5` = 210 lbs

### Failure Definition (Critical)

**A set is failed** if the user completes fewer reps than the target for that set.

**A workout is failed for an exercise** if ANY set is failed. All prescribed reps across ALL sets must be completed for the session to count as successful. Examples:
- T1 5x3: Must complete 3 reps on all 5 sets (15 total). Getting 3, 3, 3, 3, 2 = FAILURE.
- T2 3x10: Must complete 10 reps on all 3 sets (30 total). Getting 10, 10, 8 = FAILURE.
- T3 3x15: First two sets must hit 15. Only the last set is AMRAP and doesn't have a failure threshold.

**Partial failure handling:** The app records actual reps per set regardless. The pass/fail determination uses the rule above. The user can tap a set to mark it complete (auto-fills target reps) or edit it down if they didn't hit target.

### Weight Display Conventions

**Dumbbell exercises:** The app stores and calculates using **total combined weight** (both hands). Display shows both:
- Storage/calculation: `30` (lbs)
- Display: `30 lbs (15 ea)` or `15 lb DBs`
- All increment and reset math operates on total weight

**Smith machine exercises:** Track **plates only** (exclude the bar), since Smith bar weight varies by machine (15-25 lbs). The app should note this during setup: "Enter the plate weight only — don't include the Smith bar."

**Leg Press:** Track **plates only** (exclude the sled). Same note during setup: "Enter the plate weight loaded on the machine."

**Barbell exercises:** Track **total weight including the bar** (standard 45 lb bar). The app assumes a 45 lb bar for plate calculator purposes.

### Default Starting Weights

**T1 Starting Weights (user enters during setup):**

| Exercise      | Default T1 Weight | What This Means                        |
|---------------|-------------------|----------------------------------------|
| Smith Squat   | 95 lbs            | ~47.5 lbs plates per side              |
| Bench Press   | 75 lbs            | 45 lb bar + 15 lbs per side            |
| Leg Press     | 140 lbs           | ~70 lbs plates per side                |
| Dumbbell OHP  | 30 lbs total      | 15 lb dumbbell in each hand            |

**T2 Starting Weights (auto-calculated at 65% of T1, rounded to exercise rounding):**

| Exercise      | T1 Weight | Calc (×0.65) | Rounding | T2 Starting Weight |
|---------------|-----------|--------------|----------|-------------------|
| Smith Squat   | 95 lbs    | 61.75        | 5 lbs    | **60 lbs**        |
| Bench Press   | 75 lbs    | 48.75        | 5 lbs    | **50 lbs**        |
| Leg Press     | 140 lbs   | 91.00        | 5 lbs    | **90 lbs**        |
| Dumbbell OHP  | 30 lbs    | 19.50        | 10 lbs   | **20 lbs**        |

T2 auto-calculation formula: `Math.round(t1Weight * 0.65 / rounding) * rounding`

User can override T2 weights independently during setup if the auto-calculation doesn't feel right.

---

## Calculation Reference & Verification

This section provides complete worked examples that the app's logic MUST reproduce exactly. Use these as test cases.

### Example 1: Bench Press T1 — Full Progression Through All Stages

Starting weight: 75 lbs | Increment: +5 lbs | Rounding: 5 lbs

```
Session 1:  75 lbs  5x3  → 3,3,3,3,3 ✅ SUCCESS → next: 80 lbs 5x3
Session 2:  80 lbs  5x3  → 3,3,3,3,3 ✅ SUCCESS → next: 85 lbs 5x3
Session 3:  85 lbs  5x3  → 3,3,3,3,3 ✅ SUCCESS → next: 90 lbs 5x3
...
Session 8:  100 lbs 5x3  → 3,3,3,3,2 ❌ FAIL    → next: 100 lbs 6x2 (Stage 2, SAME weight)
Session 9:  100 lbs 6x2  → 2,2,2,2,2,2 ✅ SUCCESS → next: 105 lbs 6x2
Session 10: 105 lbs 6x2  → 2,2,2,2,2,2 ✅ SUCCESS → next: 110 lbs 6x2
Session 11: 110 lbs 6x2  → 2,2,2,2,1,1 ❌ FAIL    → next: 110 lbs 10x1 (Stage 3, SAME weight)
Session 12: 110 lbs 10x1 → 1,1,1,1,1,1,1,1,1,1 ✅ SUCCESS → next: 115 lbs 10x1
Session 13: 115 lbs 10x1 → 1,1,1,1,1,1,1,1,0,0 ❌ FAIL → RESET
  Reset calc: floor(115 * 0.85 / 5) * 5 = floor(97.75 / 5) * 5 = floor(19.55) * 5 = 19 * 5 = 95 lbs
  → next: 95 lbs 5x3 (Stage 1, RESET weight)
Session 14: 95 lbs  5x3  → 3,3,3,3,3 ✅ SUCCESS → next: 100 lbs 5x3
  (cycle continues, but user is now stronger and may push past 100 this time)
```

### Example 2: Dumbbell OHP T1 — Dumbbell Rounding

Starting weight: 30 lbs total (15/hand) | Increment: +10 lbs | Rounding: 10 lbs

```
Session 1:  30 lbs 5x3 → 3,3,3,3,3 ✅ → next: 40 lbs (20/hand)
Session 2:  40 lbs 5x3 → 3,3,3,3,3 ✅ → next: 50 lbs (25/hand)
Session 3:  50 lbs 5x3 → 3,3,3,3,3 ✅ → next: 60 lbs (30/hand)
Session 4:  60 lbs 5x3 → 3,3,3,2,2 ❌ → next: 60 lbs 6x2 (Stage 2)
Session 5:  60 lbs 6x2 → 2,2,2,2,2,2 ✅ → next: 70 lbs 6x2 (35/hand)
...
Session N:  80 lbs 10x1 → fail ❌
  Reset: floor(80 * 0.85 / 10) * 10 = floor(68 / 10) * 10 = floor(6.8) * 10 = 6 * 10 = 60 lbs
  → next: 60 lbs 5x3 (30/hand)
```

Note: DB OHP progresses 10 lbs per session (5/hand) which is aggressive. User may want to reduce increment to +10 lbs every OTHER session. The app supports changing increment per exercise in settings.

### Example 3: Smith Squat T2 — Volume Tier Progression

Starting weight: 60 lbs (plates only) | Increment: +10 lbs | Rounding: 5 lbs

```
Session 1:  60 lbs 3x10 → 10,10,10 ✅ → next: 70 lbs 3x10
Session 2:  70 lbs 3x10 → 10,10,10 ✅ → next: 80 lbs 3x10
Session 3:  80 lbs 3x10 → 10,10,10 ✅ → next: 90 lbs 3x10
Session 4:  90 lbs 3x10 → 10,10,7  ❌ → next: 90 lbs 3x8 (Stage 2, SAME weight)
Session 5:  90 lbs 3x8  → 8,8,8    ✅ → next: 100 lbs 3x8
Session 6:  100 lbs 3x8 → 8,8,8    ✅ → next: 110 lbs 3x8
Session 7:  110 lbs 3x8 → 8,8,6    ❌ → next: 110 lbs 3x6 (Stage 3, SAME weight)
Session 8:  110 lbs 3x6 → 6,6,6    ✅ → next: 120 lbs 3x6
Session 9:  120 lbs 3x6 → 6,5,4    ❌ → RESET
  Reset: floor(120 * 0.85 / 5) * 5 = floor(102 / 5) * 5 = floor(20.4) * 5 = 20 * 5 = 100 lbs
  → next: 100 lbs 3x10 (Stage 1, RESET)
```

### Example 4: Lat Pulldown T3 — AMRAP Progression

Starting weight: 80 lbs | Increment: +5 lbs

```
Session 1:  80 lbs → 15, 15, 18 (AMRAP)  → AMRAP < 25 → stay at 80 lbs
Session 2:  80 lbs → 15, 15, 21 (AMRAP)  → AMRAP < 25 → stay at 80 lbs
Session 3:  80 lbs → 15, 15, 23 (AMRAP)  → AMRAP < 25 → stay at 80 lbs
Session 4:  80 lbs → 15, 15, 26 (AMRAP)  → AMRAP ≥ 25 → INCREASE to 85 lbs
Session 5:  85 lbs → 15, 15, 17 (AMRAP)  → AMRAP < 25 → stay at 85 lbs
...
```

Note: Only the LAST set's rep count matters for progression. The first two sets target 15 reps and are pass/fail like T1/T2 — but failing them does NOT trigger a stage change. If user can't hit 15 on the first two sets, the weight is too heavy and should be manually reduced in settings.

### Example 5: Full Week 1 Walkthrough (Default Config)

**Day A1 (Monday):**
| Tier | Exercise        | Weight  | Scheme | Sets Logged     | Result                   |
|------|-----------------|---------|--------|-----------------|--------------------------|
| T1   | Smith Squat     | 95 lbs  | 5x3    | 3,3,3,3,3       | ✅ → 105 lbs next        |
| T2   | Bench Press     | 50 lbs  | 3x10   | 10,10,10         | ✅ → 55 lbs next         |
| T3   | Lat Pulldown    | 80 lbs  | 3x15+  | 15,15,19         | Stay 80 lbs (AMRAP < 25) |
| T3   | DB Romanian DL  | 40 lbs  | 3x15+  | 15,15,20         | Stay 40 lbs (AMRAP < 25) |

**Day B1 (Tuesday):**
| Tier | Exercise        | Weight  | Scheme | Sets Logged     | Result                   |
|------|-----------------|---------|--------|-----------------|--------------------------|
| T1   | Dumbbell OHP    | 30 lbs  | 5x3    | 3,3,3,3,3       | ✅ → 40 lbs next (20/hand)|
| T2   | Leg Press       | 90 lbs  | 3x10   | 10,10,10         | ✅ → 100 lbs next        |
| T3   | Cable Row       | 60 lbs  | 3x15+  | 15,15,22         | Stay 60 lbs (AMRAP < 25) |
| T3   | Bicep Curl      | 20 lbs  | 3x15+  | 15,15,25         | ✅ → 25 lbs next (AMRAP ≥ 25)|

**Day A2 (Thursday):**
| Tier | Exercise        | Weight  | Scheme | Sets Logged     | Result                   |
|------|-----------------|---------|--------|-----------------|--------------------------|
| T1   | Bench Press     | 75 lbs  | 5x3    | 3,3,3,3,3       | ✅ → 80 lbs next         |
| T2   | Smith Squat     | 60 lbs  | 3x10   | 10,10,10         | ✅ → 70 lbs next         |
| T3   | Lat Pulldown    | 80 lbs  | 3x15+  | 15,15,21         | Stay 80 lbs              |
| T3   | Cable Crunch    | 50 lbs  | 3x15+  | 15,15,18         | Stay 50 lbs              |

**Day B2 (Friday):**
| Tier | Exercise        | Weight  | Scheme | Sets Logged     | Result                   |
|------|-----------------|---------|--------|-----------------|--------------------------|
| T1   | Leg Press       | 140 lbs | 5x3    | 3,3,3,3,3       | ✅ → 150 lbs next        |
| T2   | Dumbbell OHP    | 20 lbs  | 3x10   | 10,10,10         | ✅ → 30 lbs next (15/hand)|
| T3   | Dumbbell Row    | 30 lbs  | 3x15+  | 15,15,17         | Stay 30 lbs              |
| T3   | Lateral Raise   | 10 lbs  | 3x15+  | 15,15,20         | Stay 10 lbs              |

**Week 2 starting weights (carried forward):**
| Exercise       | T1 Weight | T1 Scheme | T2 Weight | T2 Scheme |
|----------------|-----------|-----------|-----------|-----------|
| Smith Squat    | 105 lbs   | 5x3       | 70 lbs    | 3x10      |
| Bench Press    | 80 lbs    | 5x3       | 55 lbs    | 3x10      |
| Dumbbell OHP   | 40 lbs    | 5x3       | 30 lbs    | 3x10      |
| Leg Press      | 150 lbs   | 5x3       | 100 lbs   | 3x10      |

### Volume Sanity Check Per Tier

These rep totals should be consistent:

| Tier | Stage 1     | Stage 2     | Stage 3      |
|------|-------------|-------------|--------------|
| T1   | 5x3 = 15   | 6x2 = 12   | 10x1 = 10   |
| T2   | 3x10 = 30  | 3x8 = 24   | 3x6 = 18    |
| T3   | 3x15 = 45+ | (no stages) | (no stages)  |

Volume intentionally decreases as you move through stages — this is by design. You're maintaining the weight you stalled at while reducing total reps so you can still complete the workout. After a reset, you go back to high volume at a lighter weight.

---

## Exercise Library

### T1/T2 Exercise Pool (Compound Movements)

Users select 4 exercises for their T1/T2 rotation during setup. Each exercise has metadata that drives progression logic.

**Barbell Exercises:**
| Exercise            | Increment | Rounding | Equipment   | Movement Pattern |
|---------------------|-----------|----------|-------------|------------------|
| Bench Press         | 5 lbs     | 5 lbs    | Barbell     | Horizontal Push  |
| Barbell Squat       | 10 lbs    | 5 lbs    | Barbell     | Squat            |
| Deadlift            | 10 lbs    | 5 lbs    | Barbell     | Hinge            |
| Barbell OHP         | 5 lbs     | 5 lbs    | Barbell     | Vertical Push    |
| Barbell Row         | 5 lbs     | 5 lbs    | Barbell     | Horizontal Pull  |

**Smith Machine Exercises:**
| Exercise            | Increment | Rounding | Equipment   | Movement Pattern |
|---------------------|-----------|----------|-------------|------------------|
| Smith Squat         | 10 lbs    | 5 lbs    | Smith       | Squat            |
| Smith Bench Press   | 5 lbs     | 5 lbs    | Smith       | Horizontal Push  |
| Smith OHP           | 5 lbs     | 5 lbs    | Smith       | Vertical Push    |
| Smith Row           | 5 lbs     | 5 lbs    | Smith       | Horizontal Pull  |

**Dumbbell Exercises (T1/T2):**
| Exercise            | Increment | Rounding | Equipment   | Movement Pattern |
|---------------------|-----------|----------|-------------|------------------|
| Dumbbell OHP        | 10 lbs    | 10 lbs   | Dumbbells   | Vertical Push    |
| Dumbbell Bench Press| 10 lbs    | 10 lbs   | Dumbbells   | Horizontal Push  |
| Dumbbell Row (Heavy)| 10 lbs    | 10 lbs   | Dumbbells   | Horizontal Pull  |

**Machine Exercises (T1/T2):**
| Exercise            | Increment | Rounding | Equipment   | Movement Pattern |
|---------------------|-----------|----------|-------------|------------------|
| Leg Press           | 10 lbs    | 5 lbs    | Machine     | Squat/Push       |
| Hack Squat          | 10 lbs    | 5 lbs    | Machine     | Squat            |
| Chest Press Machine | 5 lbs     | 5 lbs    | Machine     | Horizontal Push  |
| Shoulder Press Mach.| 5 lbs     | 5 lbs    | Machine     | Vertical Push    |

**Custom Exercise:** User can add any exercise and manually set the increment, rounding, and equipment type.

### T3 Exercise Pool (Accessories)

Organized by muscle group. Each T3 defaults to +5 lbs increment when AMRAP ≥ 25, but user can override.

**Back / Pull:**
Lat Pulldown, Cable Row, Dumbbell Row, Chest-Supported Row, Pull-Up (bodyweight — track reps only), Chin-Up (bodyweight), Face Pull, Straight-Arm Pulldown

**Chest / Push:**
Dumbbell Bench Press, Incline Dumbbell Press, Cable Fly, Pec Deck, Dips (bodyweight or weighted), Tricep Pushdown, Overhead Tricep Extension, Skull Crushers

**Shoulders:**
Lateral Raise, Front Raise, Rear Delt Fly, Cable Lateral Raise, Face Pull, Upright Row

**Arms:**
Bicep Curl (Dumbbell), Hammer Curl, EZ Bar Curl, Cable Curl, Preacher Curl, Tricep Pushdown, Tricep Overhead Extension, Skull Crushers

**Legs / Glutes:**
Leg Press, Leg Curl (Lying/Seated), Leg Extension, Bulgarian Split Squat, Calf Raise (Standing/Seated), Hip Thrust, Goblet Squat, Dumbbell Romanian Deadlift, Glute Kickback

**Core:**
Cable Crunch, Hanging Leg Raise, Ab Wheel Rollout, Plank (timed — track seconds not reps), Weighted Decline Sit-Up, Pallof Press, Dead Bug

**Custom:** User can type in any exercise name and assign it to any muscle group.

### Bodyweight Exercise Handling

Some T3 exercises are bodyweight (Pull-Up, Chin-Up, Dips, Plank). For these:
- Weight field shows "BW" or "BW + 25" if weighted
- Progression for BW-only: Track reps. When AMRAP ≥ 25, prompt user to add weight via belt/vest
- Plank: Track seconds instead of reps. No AMRAP mechanic — just log duration per set

---

## Data Model

### User Profile / Settings
```
{
  units: "lbs" | "kg",                   // default lbs
  createdAt: timestamp,
  dayStructure: {                         // fully configurable T1/T2 assignments
    A1: { t1: "Smith Squat",    t2: "Bench Press" },
    B1: { t1: "Dumbbell OHP",   t2: "Leg Press" },
    A2: { t1: "Bench Press",    t2: "Smith Squat" },
    B2: { t1: "Leg Press",      t2: "Dumbbell OHP" }
  },
  t3Exercises: {                          // customizable T3 selections per day
    A1: ["Lat Pulldown", "DB Romanian Deadlift"],
    B1: ["Cable Row", "Bicep Curl"],
    A2: ["Lat Pulldown", "Cable Crunch"],
    B2: ["Dumbbell Row", "Lateral Raise"]
  },
  restTimers: {                           // default durations in seconds
    T1: 180,
    T2: 120,
    T3: 75
  },
  currentDay: "A1",                       // which day is next in rotation
  customExercises: []                     // user-added exercises
}
```

### Exercise Registry (built-in + custom)
```
{
  name: "Smith Squat",
  equipment: "Smith",
  movementPattern: "Squat",
  muscleGroup: "Legs",
  increment: 10,
  rounding: 5,
  allowedTiers: ["T1", "T2"],           // which tiers this exercise can be used in
  isBodyweight: false,
  trackDuration: false                   // true for plank-style exercises
}
```

### Lift State (persistent, per lift, per tier)
Each T1/T2 exercise has INDEPENDENT state per tier:
```
{
  exerciseName: "Smith Squat",
  tier: "T1",
  currentWeight: 95,
  currentStage: 1,                       // 1, 2, or 3
  currentScheme: "5x3",                  // derived from stage + tier
  increment: 10,                         // inherited from exercise registry, user-overridable
  rounding: 5,
  history: [
    {
      date: "2025-02-24",
      weight: 85,
      stage: 1,
      scheme: "5x3",
      setsCompleted: [3, 3, 3, 3, 3],
      completed: true,
      workoutDuration: 420,              // seconds spent on this exercise (optional)
      notes: ""                          // per-exercise notes
    }
  ]
}
```

### T3 Lift State
```
{
  exerciseName: "Lat Pulldown",
  currentWeight: 80,
  increment: 5,
  isBodyweight: false,
  trackDuration: false,
  history: [
    {
      date: "2025-02-24",
      weight: 80,
      setsCompleted: [15, 15, 22],       // last set is AMRAP
      amrapHit25: false,
      notes: ""
    }
  ]
}
```

### Workout Session (in-progress)
```
{
  id: uuid,
  day: "A1",
  date: "2025-02-24",
  startTime: timestamp,
  endTime: null,                          // set on completion
  totalDuration: null,                    // seconds
  exercises: [
    {
      exerciseName: "Smith Squat",
      tier: "T1",
      targetWeight: 95,
      targetScheme: "5x3",
      sets: [
        { setNumber: 1, targetReps: 3, actualReps: null, completed: false, timestamp: null },
        { setNumber: 2, targetReps: 3, actualReps: null, completed: false, timestamp: null },
        // ...
      ],
      notes: ""
    },
    // T2 and T3 exercises...
  ],
  status: "in_progress" | "completed" | "abandoned",
  notes: ""                               // session-level notes
}
```

---

## Screens & User Flow

### 1. Home / Dashboard
- Show which workout day is next (A1, B1, A2, or B2) with the day label prominent
- List the exercises for that day with current weights, schemes, and equipment tags
- **Streak counter**: Show consecutive weeks with 4+ workouts (not consecutive days — rest days don't break the streak)
- **At-a-glance lift summary**: All 4 main lift T1 working weights in a compact grid
- Big "Start Workout" button — this should be the most visually dominant element
- If there's an in-progress workout that was abandoned/crashed, show "Resume Workout" instead with the date it started
- Bottom nav: Home, History, Settings (3 tabs only — keep it minimal)

### 2. Active Workout Screen (MOST IMPORTANT — 90% of usage time)

**Layout (top to bottom on 16 Pro Max):**

```
┌──────────────────────────────┐
│  Exercise Name      [1/4]    │  ← current exercise + progress indicator
│  SMITH SQUAT                 │
│  T1 · Stage 1               │
├──────────────────────────────┤
│                              │
│         95 lbs               │  ← weight, huge text, most prominent element
│          5x3                 │  ← scheme below weight
│                              │
├──────────────────────────────┤
│                              │
│   ⬤    ⬤    ⬤    ⬤    ⬤    │  ← set buttons (large, tappable, spaced)
│   3    3    3    3    3      │  ← target reps below each
│                              │
├──────────────────────────────┤
│       ┌─────────────┐       │
│       │   REST 2:47  │       │  ← rest timer (appears after set completion)
│       │    [Skip]    │       │
│       └─────────────┘       │
├──────────────────────────────┤
│  Next: Bench Press · 3x10   │  ← peek at what's coming
│                              │
│  [ Next Exercise → ]        │  ← only appears when all sets logged
│  [   Add Note   ]           │
└──────────────────────────────┘
```

**Set button interactions:**
- **Tap** an incomplete set → marks it complete with target reps, turns green, starts rest timer
- **Tap** a completed (green) set → opens a small rep editor (stepper: -1, +1, or direct number input) so you can log partial reps
- **Set turns orange** if actual reps < target reps (failure)
- Sets should be completed in order (left to right) but allow tapping any set for corrections
- Active/current set should have a subtle pulse or ring to draw the eye

**Rest timer behavior:**
- Auto-starts on set completion
- Persists across exercise views (if you navigate away and come back, it's still counting)
- Countdown display with circular progress ring (not just numbers)
- Vibrate on completion (navigator.vibrate if available)
- Tap timer to dismiss / skip
- Timer durations per tier (user-configurable in settings):
  - T1: 180 seconds (3 min)
  - T2: 120 seconds (2 min)
  - T3: 75 seconds (1:15)

**T3 AMRAP set (last set):**
- Instead of a simple tap, show a number stepper with large +/- buttons
- Pre-fill with target (15) so user just taps up for each additional rep
- Show a target line at 25 ("Hit 25 to level up!")

**Exercise completion feedback:**
After all sets are logged for an exercise, show an inline result card:
- ✅ Success: "All reps hit — [weight + increment] lbs next session" (green accent)
- ❌ Failure: "Missed reps — switching to [next scheme] next session" (orange accent)
- For T3: "AMRAP: 22 reps — 3 more to increase weight" or "AMRAP: 27 reps — increasing to [weight + 5] lbs!"

**Workout completion:**
After all exercises done, show a summary card:
- Total workout duration
- Each exercise: weight, scheme, pass/fail
- Progression changes ("Bench T1 → 120 lbs next time")
- Motivational note if PRs were hit
- "Done" button saves everything and advances to next day in rotation

### 3. History / Progress Screen

**Two sub-views (segmented toggle at top):**

**Calendar View:**
- Monthly calendar with dots on workout days
- Color-coded: green dot (completed), orange dot (had failures), gray dot (abandoned)
- Tap a day → shows that workout's summary
- Current week streak indicator

**Lifts View:**
- List of all T1/T2 exercises with current state:
  ```
  SMITH SQUAT T1          BENCH PRESS T1
  Stage 1 · 5x3           Stage 2 · 6x2
  95 lbs                   120 lbs
  ↑ 10 lbs/session         ↑ 5 lbs/session
  ```
- Tap a lift → shows weight-over-time chart (simple line graph)
- Chart should show stage transitions as markers (vertical dotted lines where you shifted from 5x3 → 6x2, etc.)
- PR indicator on the chart for all-time highest weight at each stage

### 4. Settings / Configuration

**Program Setup:**
- Edit T1/T2 exercise assignments per day (pick from exercise library or add custom)
- Edit T3 exercise selections per day (add/remove/reorder)
- Add custom exercises (name, equipment type, increment, muscle group)
- The app should warn if a movement pattern is missing from the rotation (e.g., "No hinge movement — consider adding Romanian Deadlift as a T3")

**Weight Overrides:**
- Edit current weight for any T1/T2 lift
- Edit current stage for any T1/T2 lift
- Edit current weight for any T3 lift
- Bulk "reset all weights" option (back to setup)

**Preferences:**
- Units toggle (lbs/kg) — converting all existing data
- Rest timer duration defaults per tier
- Haptic feedback toggle
- Timer sound toggle

**Data Management:**
- Export all data as JSON (for backup — include date in filename)
- Import data from JSON (restore — with overwrite warning)
- Reset all data (double confirmation: "Are you sure?" then "This cannot be undone. Type RESET to confirm.")

### 5. Initial Setup (First Launch)

**Step 1: Welcome**
- Brief explanation: "GZCLP is a 4-day lifting program that automatically adjusts your weights and rep schemes as you progress."
- "Let's set up your lifts"

**Step 2: Choose Your Lifts**
- Show the 4 movement pattern slots: Push, Pull/Legs, Push, Pull/Legs (simplified)
- Pre-select the defaults (Smith Squat, Bench Press, DB OHP, Leg Press)
- Let user swap any from the exercise library
- Show the resulting 4-day rotation as a preview table

**Step 3: Starting Weights**
- For each of the 4 selected T1 exercises, enter starting weight
- Helper text: "Pick a weight you could comfortably do for 8 reps. You'll start at 5x3 — it should feel easy."
- **Equipment-specific notes displayed inline:**
  - Smith machine exercises: "Enter plate weight only — don't include the Smith bar"
  - Leg Press / machines: "Enter the plate weight loaded on the machine"
  - Dumbbell exercises: Input accepts per-hand weight, app converts to total (e.g., user enters "15", display shows "30 lbs total (15 ea)")
  - Barbell exercises: "Enter total weight including the 45 lb bar"
- T2 weights auto-calculate at 65% of T1 using: `Math.round(t1Weight * 0.65 / rounding) * rounding`
- Show calculated T2 weight next to each T1 input so user can verify
- Toggle to set T2 weights independently if auto-calc doesn't feel right
- **Suggested defaults** (pre-filled, user can change):
  - Smith Squat: 95 lbs (plates) → T2 auto: 60 lbs
  - Bench Press: 75 lbs (total) → T2 auto: 50 lbs
  - Leg Press: 140 lbs (plates) → T2 auto: 90 lbs
  - Dumbbell OHP: 15 lbs/hand (30 total) → T2 auto: 20 lbs total

**Step 4: Accessories**
- Pre-select default T3s per day
- Show the full library grouped by muscle, let user swap/add/remove
- Cap at 3 T3s per day with a note: "You can add more later in Settings"

**Step 5: Confirmation**
- Show the complete weekly plan
- "Looks good — let's lift"

---

## Visual Design System

### Philosophy
Utilitarian gym tool aesthetic. Think instrument panel, not SaaS dashboard. The app should feel like a purpose-built tool — dense with information but not cluttered. Inspired by aviation instruments, tactical gear interfaces, and high-end fitness equipment displays. NOT a startup landing page.

### Target Device
iPhone 16 Pro Max: 430 x 932pt (1290 x 2796px @3x). Safe area insets: 59pt top, 34pt bottom. Design for this, gracefully adapt down for smaller screens.

### Color Palette

**Background layers:**
| Token               | Hex       | Usage                                    |
|----------------------|-----------|------------------------------------------|
| `bg-base`            | `#0D0D0D` | App background — near black              |
| `bg-surface`         | `#1A1A1A` | Cards, input fields, elevated surfaces   |
| `bg-surface-raised`  | `#242424` | Active states, hover, pressed surfaces   |
| `bg-surface-overlay` | `#2E2E2E` | Modals, bottom sheets, popovers         |

**Text:**
| Token          | Hex       | Usage                                    |
|----------------|-----------|------------------------------------------|
| `text-primary` | `#E8E8E8` | Primary text, headings, weights          |
| `text-secondary`| `#8A8A8A`| Labels, subtitles, helper text           |
| `text-muted`   | `#555555` | Disabled, placeholder text               |

**Accent colors (used sparingly — functional meaning only):**
| Token          | Hex       | Usage                                    |
|----------------|-----------|------------------------------------------|
| `accent-success`| `#4ADE80`| Completed sets, successful progression   |
| `accent-fail`  | `#F97316` | Missed reps, failed sets (warm orange, not red — red feels punishing) |
| `accent-active`| `#A78BFA` | Current set, active timer, interactive highlights (muted violet) |
| `accent-info`  | `#60A5FA` | Informational badges, stage indicators   |
| `border-subtle`| `#2A2A2A` | Dividers, card borders — barely visible  |

**Why these colors:**
- Near-black background: Easiest on eyes in any gym lighting, from fluorescent to dim
- Warm orange for failure instead of red: Red triggers anxiety; orange feels like "hey, adjust" not "you failed"
- Muted violet for active state: Distinct from green/orange without being jarring. Avoids the overused blue/teal SaaS palette
- No gradients, no glows, no shadows. Flat, high-contrast, utilitarian

### Typography

**Font:** `"SF Pro Display", "Inter", -apple-system, system-ui, sans-serif`

Use SF Pro on iOS (native, free), Inter as web fallback. Both are highly legible and have excellent number rendering which matters for weights.

| Element                        | Size   | Weight    | Letter Spacing |
|--------------------------------|--------|-----------|----------------|
| Weight display (active workout)| 48px   | 700 (Bold)| -0.02em        |
| Scheme display (5x3)          | 24px   | 600       | 0.05em         |
| Exercise name (active)        | 20px   | 600       | 0              |
| Section headers               | 16px   | 600       | 0.04em (caps)  |
| Body text                     | 16px   | 400       | 0              |
| Labels / secondary            | 14px   | 400       | 0.02em         |
| Tiny metadata                 | 12px   | 500       | 0.04em         |

**Weight numbers use tabular (monospace) figures** so digits don't shift as numbers change. SF Pro and Inter both support this via `font-variant-numeric: tabular-nums`.

### Spacing & Layout

**Grid:** 8px base unit. All spacing should be multiples of 8.
- Card padding: 16px
- Section gaps: 24px
- Element gaps within cards: 12px
- Screen horizontal padding: 20px (safe for thumb reach from edges)

**Bottom navigation:** 
- Height: 64px + 34pt safe area = 98pt total from bottom
- 3 items: Home, History, Settings
- Simple icons (no labels — save space, 3 items is unambiguous)
- Active tab indicated by `accent-active` color on icon

**Set buttons (active workout):**
- Size: 56 x 56px (exceeds 48px minimum tap target)
- Border radius: 50% (circles)
- Gap between: 12px
- States:
  - Default: `bg-surface` with `border-subtle` border, `text-secondary` rep number
  - Active (current set): `accent-active` border (2px), subtle pulse animation
  - Complete: `accent-success` background at 20% opacity, `accent-success` border, green checkmark or rep count
  - Failed: `accent-fail` background at 20% opacity, `accent-fail` border, orange rep count

### Motion & Feedback

- **Set completion:** Quick scale-up (1.0 → 1.1 → 1.0, 200ms) + color transition
- **Exercise transition:** Horizontal slide (current exits left, next enters right, 300ms ease)
- **Rest timer:** Circular progress ring animates continuously (stroke-dashoffset)
- **Haptic:** `navigator.vibrate(50)` on set completion, `navigator.vibrate([100, 50, 100])` on timer done
- **No loading spinners** — the app is local-first, everything should be instant
- **Reduced motion:** Respect `prefers-reduced-motion` — disable animations, keep color changes

### Component Library

**Cards:** `bg-surface`, 12px border-radius, 1px `border-subtle` border, 16px padding. No shadows.

**Buttons (primary):** `accent-active` background, `#0D0D0D` text, 12px border-radius, 48px height, 600 weight text.

**Buttons (secondary/ghost):** Transparent background, `text-secondary` text, 1px `border-subtle` border on hover/active.

**Inputs:** `bg-surface-raised` background, 12px border-radius, 48px height, `text-primary` text, `text-muted` placeholder. No visible border until focused → `accent-active` 1px border.

**Segmented controls:** `bg-surface` background with `bg-surface-raised` active segment. Used for History view toggle (Calendar | Lifts).

**Badges/Tags:** Pill-shaped (full border-radius), small (24px height), `bg-surface-raised` background. Used for equipment type ("Smith", "DB", "Machine"), tier labels ("T1", "T2", "T3"), stage labels.

**Bottom sheets:** For exercise notes, rep editing, exercise picker. Slides up from bottom, `bg-surface-overlay` background, 16px top border-radius, drag handle at top.

---

## Technical Recommendations

### Stack Options

**Simple (recommended for MVP):**
- Single-file React app (JSX) with Tailwind CSS
- localStorage for persistence (with JSON serialization)
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
- **Rest timer**: Use `setInterval` with a ref to avoid drift. Store the timer end-time (not remaining time) so it survives re-renders. The timer should persist if the user switches exercises or navigates.
- **Data integrity**: Save workout state to storage on every set completion (not just at the end). If the app crashes or the phone dies, the workout should be recoverable on next launch.
- **Weight calculation utility functions** (these are critical — get them right):
  ```javascript
  // Round to nearest increment (for normal progression)
  function addWeight(current, increment, rounding) {
    const raw = current + increment;
    return Math.round(raw / rounding) * rounding;
  }
  
  // Reset weight (round DOWN to nearest rounding)
  function resetWeight(failedWeight, rounding) {
    return Math.floor(failedWeight * 0.85 / rounding) * rounding;
  }
  
  // T2 auto-calculate from T1 (round to nearest)
  function calcT2FromT1(t1Weight, rounding) {
    return Math.round(t1Weight * 0.65 / rounding) * rounding;
  }
  
  // Check if workout passed (all sets hit target reps)
  function didPass(sets) {
    return sets.every(set => set.actualReps >= set.targetReps);
  }
  
  // For T3: check if AMRAP (last set) hit threshold
  function shouldIncreaseT3(sets) {
    const lastSet = sets[sets.length - 1];
    return lastSet.actualReps >= 25;
  }
  
  // Get next state after completing an exercise
  function getNextState(currentState, passed, tier) {
    if (passed) {
      return {
        weight: addWeight(currentState.weight, currentState.increment, currentState.rounding),
        stage: currentState.stage,
        // scheme stays the same
      };
    }
    // Failed
    const maxStage = 3;
    if (currentState.stage < maxStage) {
      return {
        weight: currentState.weight,  // SAME weight
        stage: currentState.stage + 1,
        // scheme changes based on new stage
      };
    }
    // Failed at max stage → reset
    return {
      weight: resetWeight(currentState.weight, currentState.rounding),
      stage: 1,
      // back to initial scheme
    };
  }
  ```
- **Scheme lookup tables:**
  ```javascript
  const T1_SCHEMES = { 1: { sets: 5, reps: 3 }, 2: { sets: 6, reps: 2 }, 3: { sets: 10, reps: 1 } };
  const T2_SCHEMES = { 1: { sets: 3, reps: 10 }, 2: { sets: 3, reps: 8 }, 3: { sets: 3, reps: 6 } };
  ```
- **PWA manifest**: Include so users can "Add to Home Screen" for native app feel — standalone display mode, black status bar, custom icon.
- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and use `env(safe-area-inset-bottom)` for bottom nav padding.
- **Font loading**: Use `system-ui` stack to avoid FOUT. SF Pro is already on iOS.

---

## Nice-to-Haves (Post-MVP)

- **Plate calculator**: Enter target weight, shows which plates to load on each side of the bar (assuming 45 lb bar or Smith ~15 lb bar). Extremely useful in the gym.
- **Warm-up set calculator**: Suggest warm-up ramp: empty bar x 10, 50% x 5, 75% x 3, then working sets. Display as a collapsible section above the working sets.
- **1RM estimator**: Based on current working weights and rep schemes, estimate one-rep max for each lift using Epley formula.
- **Body weight tracking**: Simple weight log with 7-day rolling average trend line.
- **Workout notes**: Free-text notes per exercise and per session ("left shoulder felt tight", "spotter helped on last rep"). Already in the data model — just needs the UI.
- **PR celebrations**: Full-screen confetti or badge when you hit a new weight milestone on a lift.
- **Estimated workout duration**: Based on average of last 3 sessions, show "~45 min" on the dashboard.
- **Share workout summary**: Generate a screenshot-friendly card of today's workout results for sharing.
- **Haptic feedback toggle**: Some people find it annoying — make it optional.
- **Widget support**: iOS lock screen widget showing next workout day and lifts (if building native or with Capacitor).

---

## Example User Flow

1. User opens app → sees "Next: Day A1 — Smith Squat / Bench / Lat Pulldown / DB RDL"
2. Taps "Start Workout"
3. Screen shows: **SMITH SQUAT — 95 lbs — 5x3** with "T1 · Stage 1" tag and "Smith" equipment badge
4. Five circles labeled "3" appear, first one has a subtle violet pulse
5. User does first set of 3 reps, taps first circle → scales up briefly, turns green, rest timer ring appears (3:00)
6. Timer counts down with circular progress, phone vibrates when done
7. User does set 2, taps second circle → green, timer resets
8. Repeats for all 5 sets
9. All green → inline card: "✅ All reps hit — 105 lbs next session" (95 + 10 increment)
10. Taps "Next Exercise" → slide transition → **BENCH PRESS — 50 lbs — 3x10** with "Barbell" badge (T2, auto-calculated from 75 × 0.65 = 48.75, rounded to 50)
11. Three circles labeled "10" appear
12. User completes 10, 10, but only gets 8 on last set
13. Taps third circle (logs as 10), then taps again to edit → stepper appears, adjusts to 8 → circle turns orange
14. Inline card: "⚠️ Missed reps — staying at 50 lbs, moving to 3x8 next session" (Stage 1 → Stage 2, same weight)
15. Next exercise: **LAT PULLDOWN — 80 lbs — 3x15 (AMRAP last set)**
16. First two sets: tap to complete at 15
17. Last set: stepper UI appears, user taps up to 22
18. Card: "Keep pushing — 3 more reps to increase weight" (25 - 22 = 3)
19. Next exercise: **DB ROMANIAN DEADLIFT — 40 lbs (20 ea) — 3x15 (AMRAP last set)**
20. Completes all sets, AMRAP hits 18
21. Card: "7 more reps to increase weight" (25 - 18 = 7)
22. **Workout Complete** summary slides up:
    - Duration: 47 min
    - Smith Squat T1: 95 lbs 5x3 ✅ → 105 lbs next (95 + 10)
    - Bench T2: 50 lbs 3x10 ⚠️ → 50 lbs 3x8 next (stage change, no weight change)
    - Lat Pulldown: 80 lbs → stay at 80 lbs
    - DB RDL: 40 lbs → stay at 40 lbs
23. Taps "Done" → saves, advances rotation to B1, returns to dashboard
24. Dashboard now shows "Next: Day B1 — DB OHP / Leg Press / Cable Row / Bicep Curl"