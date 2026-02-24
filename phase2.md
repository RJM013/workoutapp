# GZCLP Workout Tracker — Phase 2 Supplement

> **Context:** This document supplements the Phase 1 spec (core workout logging, progression logic, active workout screen). The app is deployed on **Vercel** with a **Supabase** backend. Everything below is additive — do not remove or replace any Phase 1 functionality.

---

## 1. Dashboard & Progress Tracking

The dashboard is the first screen users see when opening the app. It should immediately communicate: where you are in the program, how you're progressing, and what's coming next.

### 1A. Dashboard Layout

**Top Section — Next Workout Preview**
- Show the next workout day (e.g., "Next Up: Day A2") with all exercises, weights, and schemes listed
- If the user worked out today, show "Rest Day — Next: Day B1" or similar
- "Start Workout" button remains the primary CTA

**Middle Section — Lift Overview Cards**
One card per main lift (Squat, Bench, Deadlift, OHP). Each card shows:

```
┌─────────────────────────────────┐
│  SQUAT                          │
│                                 │
│  T1: 185 lbs — Stage 1 (5x3)   │
│  T2: 135 lbs — Stage 1 (3x10)  │
│                                 │
│  ▲ +50 lbs since start          │
│  Last session: Feb 22 ✅         │
│  Streak: 8 sessions without fail│
└─────────────────────────────────┘
```

- Tapping a card opens the **Lift Detail Screen** (see section 1C)
- Cards should use subtle color coding:
  - Green border/accent: currently progressing normally (Stage 1)
  - Yellow/amber: in a reduced rep stage (Stage 2 or 3)
  - Blue: recently reset and climbing back up

**Bottom Section — Recent Activity Feed**
A compact, scrollable list of recent workouts:
```
Feb 22 — Day A1: Squat 185x5x3 ✅ | Bench 105x3x10 ✅
Feb 20 — Day B2: Deadlift 225x6x2 ❌→ 10x1 | OHP 75x3x10 ✅
Feb 18 — Day A2: Bench 155x5x3 ✅ | Squat 145x3x10 ✅
```

Each entry is tappable to see the full workout detail.

### 1B. Progression Event Log

This is a key differentiator — **every weight change has a clear explanation**. Users should never wonder "why is my squat at this weight?"

Create a per-lift timeline that logs every progression event:

```
SQUAT — Progression History
─────────────────────────────
Feb 24  ▲ 195 lbs (5x3) — Added 10 lbs after completing 185x5x3
Feb 22  ✅ 185 lbs (5x3) — All sets completed
Feb 20  ✅ 175 lbs (5x3) — All sets completed
Feb 15  ⟳ 165 lbs (5x3) — RESET from 195 lbs (10x1 failed)
                            Reset formula: 195 × 0.85 = 165.75 → 165 lbs
Feb 13  ❌ 195 lbs (10x1) — Failed (completed 8 of 10 singles)
                            Triggered reset to Stage 1
Feb 11  ❌ 195 lbs (6x2) — Failed (completed 5 of 6 doubles)
                            Advanced to Stage 3 (10x1)
Feb 8   ❌ 195 lbs (5x3) — Failed (got 3,3,3,2,2)
                            Advanced to Stage 2 (6x2)
Feb 6   ✅ 185 lbs (5x3) — All sets completed
```

**Event types and their icons/labels:**
| Icon | Event | Description |
|------|-------|-------------|
| ▲ | Weight increased | Completed all reps → added increment |
| ✅ | Successful session | All prescribed reps completed |
| ❌ | Failed session | Could not complete all prescribed reps |
| ⟳ | Reset | Failed Stage 3 → reset to 85% at Stage 1 |
| → | Stage advance | Failed current stage → moved to next stage |

**Critical: Always show the math.** When a reset happens, display:
- The weight that was failed
- The formula: `[failed weight] × 0.85 = [exact result] → [rounded to nearest 5]`
- The new stage and scheme

When a stage advance happens, display:
- What was attempted and what was achieved (e.g., "Got 3,3,3,2,2 — needed 5x3")
- What the next session will look like

### 1C. Lift Detail Screen

Accessed by tapping a lift card on the dashboard. Shows everything about one lift across both tiers.

**Header:**
- Lift name, current T1 and T2 weights/stages
- "All-time best" weight for T1 and T2

**Progress Chart:**
- Line chart showing weight over time for this lift
- Two lines: T1 (solid) and T2 (dashed)
- X-axis: dates. Y-axis: weight
- Mark failures with a red dot, resets with a distinct marker
- The chart should make the sawtooth pattern of GZCLP visible (climb → fail → reset → climb higher)

**Stage Visualization:**
Show where the user currently is in the progression cycle:

```
T1 Progression:
[■ 5x3 ■] → [ 6x2 ] → [ 10x1 ] → [ Reset ]
  ↑ You are here, climbing at 185 lbs
```

Or if they've failed:
```
T1 Progression:
[ 5x3 ] → [■ 6x2 ■] → [ 10x1 ] → [ Reset ]
  ↑ Failed 5x3 at 195 lbs, now doing 6x2 at 195 lbs
```

**Session History Table:**
Full log of every session for this lift, showing date, tier, weight, scheme, reps per set, and outcome.

### 1D. Aggregate Stats

A dedicated stats/insights section (accessible from dashboard or nav):

- **Total volume lifted** (all time / this week / this month) — sum of weight × reps across all exercises
- **Consistency streak** — consecutive weeks with 4 workouts completed
- **Workouts this week/month** — simple count with a target indicator (4/week)
- **Time per workout** — average session duration, trend over time
- **Estimated 1RM** for each main lift (Epley formula: `weight × (1 + reps/30)` — use the T1 data)
- **Bodyweight trend** (if tracking — see section 4)
- **Days since last workout** — subtle reminder if it's been a while, no guilt-tripping

---

## 2. Exercise Instruction Section

### 2A. Exercise Database

Every exercise in the app (T1, T2, and all T3 options) should have an instruction page. This page is accessible:
- From the active workout screen (small info icon next to the exercise name)
- From settings/exercise library
- Context-sensitive: during a workout, it opens as a bottom sheet / modal overlay so you don't lose your workout state

### 2B. Exercise Instruction Card Content

Each exercise card should include:

**Header:**
- Exercise name
- Primary muscles worked (listed as tags, e.g., "Chest · Triceps · Shoulders")
- Equipment needed (e.g., "Barbell + Rack", "Cable Machine", "Dumbbells")

**Form Cues — "Key Points"**
3-5 short, actionable bullet points for proper form. These should be concise enough to glance at between sets. Written in second person, imperative mood.

Example for **Barbell Squat:**
```
• Feet shoulder-width apart, toes slightly out (15-30°)
• Bar sits on upper traps (high bar) or rear delts (low bar)
• Break at hips and knees simultaneously — sit down, not back
• Knees track over toes — don't let them cave inward
• Hit at least parallel (hip crease below knee), then drive up through your heels
```

**Common Mistakes**
2-3 things people typically get wrong. Phrased as "Don't [X], instead [Y]."

Example for **Barbell Squat:**
```
• Don't let your knees cave inward — push them out over your pinky toe
• Don't round your lower back at the bottom — brace your core like you're about to get punched
• Don't rise onto your toes — keep your whole foot planted, drive through mid-foot
```

**Breathing Cue**
One line. Example: "Breathe in at the top, brace your core, squat down, exhale as you push up."

### 2C. Full Exercise Library

Here is the instruction content for all exercises in the app:

---

#### **SQUAT (T1/T2)**
- **Muscles:** Quads · Glutes · Hamstrings · Core
- **Equipment:** Barbell + Squat Rack
- **Key Points:**
  - Feet shoulder-width apart, toes angled slightly outward (15-30°)
  - Bar rests on upper traps; grip the bar outside your shoulders
  - Break at hips and knees simultaneously — sit between your legs
  - Descend until hip crease is at or below the top of your knee (parallel or deeper)
  - Drive up through mid-foot, keeping chest tall
- **Common Mistakes:**
  - Don't let knees cave inward — actively push them out over your toes
  - Don't lean excessively forward — keep your chest up and core braced
  - Don't cut depth short — partial squats leave progress on the table
- **Breathing:** Big breath in at the top, brace core hard, descend, exhale forcefully as you drive up.

#### **BENCH PRESS (T1/T2)**
- **Muscles:** Chest · Triceps · Front Delts
- **Equipment:** Barbell + Flat Bench + Rack
- **Key Points:**
  - Lie flat with eyes directly under the bar
  - Grip slightly wider than shoulder-width; wrists straight, not bent back
  - Retract and depress your shoulder blades — pinch them together and down into the bench
  - Unrack, lower the bar to your mid-chest (around nipple line) with control
  - Press up and slightly back toward the rack, locking out at the top
- **Common Mistakes:**
  - Don't flare elbows to 90° — keep them at roughly 45-75° to protect shoulders
  - Don't bounce the bar off your chest — brief pause or light touch
  - Don't lift your butt off the bench — maintain a slight arch but keep glutes down
- **Breathing:** Inhale as the bar descends, exhale as you press up.

#### **DEADLIFT (T1/T2)**
- **Muscles:** Hamstrings · Glutes · Lower Back · Traps · Grip
- **Equipment:** Barbell (from floor)
- **Key Points:**
  - Stand with feet hip-width apart, bar over mid-foot (about 1 inch from shins)
  - Grip the bar just outside your knees — double overhand or mixed grip
  - Hinge at hips, push your butt back, keep your chest up and back flat
  - Drag the bar up your shins and thighs — it should stay in contact with your body
  - Stand tall at the top, squeeze glutes — don't hyperextend your back
- **Common Mistakes:**
  - Don't round your lower back — if you can't maintain a flat back, the weight is too heavy
  - Don't jerk the bar off the floor — build tension first, then push the floor away
  - Don't let the bar drift forward away from your body — keep it close
- **Breathing:** Big breath in at the bottom, brace hard, pull, exhale at the top. Reset breath each rep.

#### **OVERHEAD PRESS / OHP (T1/T2)**
- **Muscles:** Shoulders · Triceps · Upper Chest · Core
- **Equipment:** Barbell + Rack
- **Key Points:**
  - Start with bar resting on front delts, grip just outside shoulder-width
  - Feet shoulder-width apart, squeeze your glutes and brace your core
  - Press the bar straight up — move your head out of the way (lean back slightly), then push your head through once the bar passes your forehead
  - Lock out directly overhead, bar over mid-foot, biceps near your ears
  - Lower with control back to your front delts
- **Common Mistakes:**
  - Don't excessively arch your lower back — squeeze glutes to prevent this
  - Don't press the bar forward in an arc — the bar path should be nearly vertical
  - Don't use your legs (that makes it a push press) — strict press means no knee bend
- **Breathing:** Inhale at the bottom, brace, press, exhale at lockout.

#### **LAT PULLDOWN (T3)**
- **Muscles:** Lats · Biceps · Rear Delts
- **Equipment:** Cable Machine + Wide Bar Attachment
- **Key Points:**
  - Grip the bar wider than shoulder-width, palms facing away
  - Sit tall, lean back slightly (10-15°), chest up
  - Pull the bar to your upper chest — drive your elbows down and back
  - Squeeze your shoulder blades together at the bottom, then control the bar back up
- **Common Mistakes:**
  - Don't lean way back and turn it into a row — slight lean only
  - Don't pull behind your neck — always pull to your chest
  - Don't use momentum — control the weight both directions

#### **DUMBBELL ROW (T3)**
- **Muscles:** Lats · Rhomboids · Biceps · Rear Delts
- **Equipment:** Dumbbell + Bench
- **Key Points:**
  - One knee and hand on the bench, other foot on the floor for stability
  - Let the dumbbell hang straight down, then pull it toward your hip
  - Drive your elbow up and back, squeezing your shoulder blade at the top
  - Lower with control — full stretch at the bottom
- **Common Mistakes:**
  - Don't rotate your torso to heave the weight up — keep your shoulders level
  - Don't shrug the weight — drive with your elbow, not your trap
  - Don't rush the negative — the lowering phase builds muscle too

#### **FACE PULL (T3)**
- **Muscles:** Rear Delts · Rotator Cuff · Traps
- **Equipment:** Cable Machine + Rope Attachment
- **Key Points:**
  - Set the cable at upper chest to face height
  - Grip the rope with thumbs pointing back toward you
  - Pull toward your face, separating the rope ends — hands finish beside your ears
  - Squeeze your rear delts and external rotators at the end position
- **Common Mistakes:**
  - Don't use too much weight — this is a precision movement, keep it light
  - Don't pull to your chest — the target is your face/forehead level
  - Don't let your shoulders round forward at the start — stand tall

#### **BICEP CURL (T3)**
- **Muscles:** Biceps · Forearms
- **Equipment:** Dumbbells or EZ-Bar or Barbell
- **Key Points:**
  - Stand upright, arms at your sides, palms facing forward
  - Curl the weight up by bending at the elbow — keep upper arms pinned to your sides
  - Squeeze at the top, then lower with control (2-3 second negative)
  - Full extension at the bottom — don't keep a permanent bend
- **Common Mistakes:**
  - Don't swing your body — if you need momentum, the weight is too heavy
  - Don't let your elbows drift forward — keep them at your sides
  - Don't rush the lowering phase — the eccentric is where growth happens

#### **CABLE CRUNCH (T3)**
- **Muscles:** Abs (Rectus Abdominis)
- **Equipment:** Cable Machine + Rope Attachment
- **Key Points:**
  - Kneel facing the cable, hold the rope beside your head
  - Crunch down by flexing your spine — bring your elbows toward your knees
  - Focus on curling your ribcage toward your pelvis, not just bowing forward
  - Control the return — don't let the weight stack yank you back up
- **Common Mistakes:**
  - Don't sit back onto your heels — your hips should stay stationary
  - Don't just bend at the hips — the movement is spinal flexion, not a hip hinge
  - Don't go too heavy — you should feel your abs, not your hip flexors

#### **LATERAL RAISE (T3)**
- **Muscles:** Side Delts
- **Equipment:** Dumbbells
- **Key Points:**
  - Stand with dumbbells at your sides, slight bend in elbows
  - Raise arms out to the sides until they're parallel with the floor
  - Lead with your elbows, not your hands — think "pouring a pitcher of water"
  - Lower with control — don't just drop them
- **Common Mistakes:**
  - Don't go too heavy — lateral raises are notoriously humbling, 10-15 lbs is normal
  - Don't shrug your shoulders up — keep them depressed
  - Don't swing — if you need momentum, drop the weight

#### **TRICEP PUSHDOWN (T3)**
- **Muscles:** Triceps
- **Equipment:** Cable Machine + Straight Bar or Rope
- **Key Points:**
  - Stand facing the cable, elbows pinned at your sides
  - Push the handle down until your arms are fully extended
  - Squeeze your triceps at the bottom, then control the return
  - Keep your upper arms completely still — only your forearms should move
- **Common Mistakes:**
  - Don't flare your elbows out — keep them tight to your body
  - Don't lean over the handle — stand upright
  - Don't let the weight pull your elbows forward at the top

#### **HANGING LEG RAISE (T3)**
- **Muscles:** Lower Abs · Hip Flexors
- **Equipment:** Pull-Up Bar
- **Key Points:**
  - Hang from the bar with straight arms, shoulders engaged (don't just dangle)
  - Raise your legs by curling your pelvis up — think about bringing your belt buckle to your chin
  - Control the descent — don't swing
  - Bent knees is fine to start; progress to straight legs over time
- **Common Mistakes:**
  - Don't just swing your legs up with momentum — controlled movement
  - Don't just lift your knees without curling your pelvis — the pelvic tilt is what hits your abs
  - Don't death-grip and shrug — keep shoulders packed down

#### **LEG PRESS (T3)**
- **Muscles:** Quads · Glutes · Hamstrings
- **Equipment:** Leg Press Machine
- **Key Points:**
  - Feet shoulder-width on the platform, positioned in the middle or slightly high
  - Lower the sled by bending your knees toward your chest — go as deep as you can without your lower back lifting off the pad
  - Push through your whole foot, don't lock out your knees completely at the top
  - Keep your lower back pressed flat against the pad at all times
- **Common Mistakes:**
  - Don't go so deep that your lower back rounds off the pad — that's too far
  - Don't lock your knees out hard at the top — keep a slight bend
  - Don't place your feet too low — this puts excessive stress on your knees

#### **LEG CURL (T3)**
- **Muscles:** Hamstrings
- **Equipment:** Leg Curl Machine (Lying or Seated)
- **Key Points:**
  - Adjust the pad so it sits on your lower calves, just above your ankles
  - Curl the weight by bringing your heels toward your glutes
  - Squeeze at the top, then lower slowly (3-second negative)
  - Keep your hips pressed into the pad (lying) or seat (seated)
- **Common Mistakes:**
  - Don't use momentum to swing the weight — controlled contraction
  - Don't lift your hips off the pad to cheat the weight up
  - Don't let the weight slam down — control the eccentric

#### **CALF RAISE (T3)**
- **Muscles:** Calves (Gastrocnemius · Soleus)
- **Equipment:** Smith Machine, Calf Raise Machine, or Step + Dumbbells
- **Key Points:**
  - Stand on the edge of a step or platform with your heels hanging off
  - Push up onto your toes as high as possible — full contraction at the top
  - Lower slowly until you feel a deep stretch in your calves — go below the platform level
  - Pause at the bottom and top for 1-2 seconds each
- **Common Mistakes:**
  - Don't bounce — calves respond better to slow, controlled reps with pauses
  - Don't cut the range of motion short — full stretch to full contraction
  - Don't bend your knees — keep legs straight (or slightly bent for soleus emphasis)

#### **DUMBBELL BENCH PRESS (T3)**
- **Muscles:** Chest · Triceps · Front Delts
- **Equipment:** Dumbbells + Flat or Incline Bench
- **Key Points:**
  - Sit on the bench with dumbbells on your knees, kick them up as you lie back
  - Press with palms facing forward, slight arc bringing the dumbbells together at the top
  - Lower until your upper arms are parallel with the floor or slightly below
  - Retract your shoulder blades just like barbell bench — stable base
- **Common Mistakes:**
  - Don't let the dumbbells drift too wide at the bottom — keep elbows at 45-75°
  - Don't clang the dumbbells together at the top — touch lightly or stop just short
  - Don't drop them recklessly — learn to lower them to your knees safely

#### **PULL-UP / CHIN-UP (T3)**
- **Muscles:** Lats · Biceps · Core (Pull-Up: wider grip, palms away. Chin-Up: narrow grip, palms toward you)
- **Equipment:** Pull-Up Bar
- **Key Points:**
  - Hang with arms fully extended, shoulders engaged (pull shoulder blades down)
  - Pull yourself up until your chin clears the bar
  - Lower with control — full extension at the bottom, no half reps
  - If you can't do bodyweight reps, use an assisted pull-up machine or resistance band
- **Common Mistakes:**
  - Don't kip or swing — strict form builds more muscle
  - Don't cut the range short — go all the way down, all the way up
  - Don't crane your neck to get your chin over — if you have to strain your neck, you're not high enough

#### **CABLE ROW (T3)**
- **Muscles:** Mid-Back · Lats · Biceps
- **Equipment:** Cable Machine + V-Handle or Wide Handle
- **Key Points:**
  - Sit upright with slight knee bend, feet braced on the platform
  - Pull the handle toward your lower chest/upper abdomen
  - Squeeze your shoulder blades together at the end, then extend fully
  - Keep your torso upright — don't rock back and forth
- **Common Mistakes:**
  - Don't use your lower back to row the weight — your torso should barely move
  - Don't shrug — pull with your elbows and lats, not your traps
  - Don't round forward at full extension — maintain a tall posture throughout

#### **HAMMER CURL (T3)**
- **Muscles:** Brachialis · Biceps · Forearms
- **Equipment:** Dumbbells
- **Key Points:**
  - Hold dumbbells at your sides with palms facing each other (neutral grip)
  - Curl up keeping the neutral grip — don't rotate your wrists
  - Same rules as regular curls: upper arms stay pinned, control the negative
- **Common Mistakes:**
  - Don't swing — same as regular curls
  - Don't alternate and rest one arm — do both together for more time under tension, or alternate with no pause

#### **BULGARIAN SPLIT SQUAT (T3)**
- **Muscles:** Quads · Glutes · Balance
- **Equipment:** Dumbbells + Bench
- **Key Points:**
  - Stand 2-3 feet in front of a bench, place one foot behind you on the bench (laces down)
  - Lower straight down until your back knee nearly touches the floor
  - Push up through your front heel — keep your torso upright
  - Most of your weight should be on your front leg
- **Common Mistakes:**
  - Don't stand too close to the bench — you need room to drop straight down
  - Don't lean forward excessively — stay upright
  - Don't rush — balance takes practice, start with bodyweight if needed

#### **HIP THRUST (T3)**
- **Muscles:** Glutes · Hamstrings
- **Equipment:** Barbell + Bench (or Body Weight)
- **Key Points:**
  - Sit on the floor with your upper back against a bench, barbell across your hips (use a pad)
  - Drive through your heels to lift your hips until your thighs are parallel with the floor
  - Squeeze your glutes hard at the top for 1-2 seconds — full lockout
  - Lower with control — don't just drop
- **Common Mistakes:**
  - Don't hyperextend your lower back at the top — stop at neutral spine with glutes squeezed
  - Don't push through your toes — drive through heels
  - Don't let your chin tuck to your chest — look forward throughout

#### **AB WHEEL ROLLOUT (T3)**
- **Muscles:** Abs · Core · Lats
- **Equipment:** Ab Wheel
- **Key Points:**
  - Start on your knees, hands on the wheel, arms straight
  - Roll forward slowly, extending your arms — go as far as you can while maintaining a flat back
  - Pull back to the start by contracting your abs — don't just use your arms
  - Keep your core braced the entire time — don't let your hips sag
- **Common Mistakes:**
  - Don't let your lower back arch/sag — if it does, you've gone too far
  - Don't bend at the hips on the way back — roll back with your core
  - Don't go to full extension if you're not strong enough yet — build range over time

---

## 3. GZCLP Education & Emphasis

The app should teach users the methodology, not just execute it. Weave GZCLP concepts into the UX so users understand *why* things are happening.

### 3A. GZCLP Explainer Section

A dedicated "Learn GZCLP" section accessible from settings or an onboarding flow. Content:

**The Philosophy**
GZCLP is built on the idea that training has three tiers of importance. Your heavy compound lifts (T1) are the foundation — they build raw strength. Your moderate volume work (T2) supports T1 by building muscle and reinforcing the movement patterns. Your accessories (T3) address weak points and keep you balanced. Every tier has a purpose. Skip T1 and you won't get strong. Skip T2 and your muscles won't grow enough to support heavier T1 weights. Skip T3 and your weak links will eventually stall everything.

**Why the Failure Scheme Matters**
Most programs treat failure as a setback — "deload and try again." GZCLP treats failure as information. If you can't do 5 sets of 3, you can probably still do 6 sets of 2 at the same weight — that's actually more total volume. And if you can't do 6x2, you can still do 10 heavy singles. You're practicing the lift at a challenging weight for longer before resetting, which means more strength adaptation. When you finally do reset, you come back to 5x3 at 85% and blow past your old plateau because you've spent weeks handling heavier loads.

**The Sawtooth Pattern**
Show a simple illustration: weight climbs linearly, hits a wall, drops to 85%, climbs again past the previous wall. Explain that this is expected and is a sign the program is working. The second time through is always higher than the first.

### 3B. Contextual GZCLP Tooltips

Throughout the app, add small info icons (ⓘ) that expand with brief explanations when tapped:

| Location | Tooltip Content |
|----------|----------------|
| Next to "Stage 1 (5x3)" | "Stage 1 is the standard progression. You'll add weight every session until you can't complete all reps." |
| Next to "Stage 2 (6x2)" | "You couldn't finish 5x3, so now you're doing 6 doubles at the same weight. More sets, fewer reps — still progressing." |
| Next to "Stage 3 (10x1)" | "Last chance before a reset. 10 heavy singles lets you practice the lift at a challenging weight." |
| On reset event | "Reset to 85% of your failed weight. You'll climb back through 5x3 and typically push past your old plateau." |
| Next to T1/T2/T3 labels | Brief explanation of the tier's purpose |
| On AMRAP set | "Go all out on this last set. When you hit 25 reps, the app will increase your weight next session." |
| Weight increment | "Upper body lifts increase by 5 lbs, lower body by 10 lbs. This is the standard GZCLP progression rate." |

### 3C. Post-Workout GZCLP Summary

After each workout, the summary screen should explain what happened in GZCLP terms:

```
Workout Complete — Day A1

SQUAT (T1)
185 lbs × 5x3 — All sets completed ✅
→ Next session: 195 lbs (5x3) — added 10 lbs

BENCH PRESS (T2)  
105 lbs × 3x10 — Set 3: got 8/10 ❌
→ Next session: 105 lbs (3x8) — stage advanced
  ⓘ You'll stay at 105 lbs but do 3 sets of 8 instead of 10.
     Complete all reps to keep adding weight at this stage.

LAT PULLDOWN (T3)
85 lbs × 15, 15, 22 (AMRAP)
→ Next session: same weight — hit 25 on AMRAP to increase

FACE PULL (T3)
30 lbs × 15, 15, 27 (AMRAP) 🎉
→ Next session: 35 lbs — AMRAP threshold reached!
```

---

## 4. Additional Quality Improvements

### 4A. Plate Calculator

A utility accessible from the active workout screen (small button near the weight display). Given a target weight, it shows which plates to load on each side of a 45 lb bar.

```
Target: 185 lbs
Bar: 45 lbs
Each side: 70 lbs
  → 45 + 25 plate
```

Common plate inventory: 45, 35, 25, 10, 5, 2.5 lbs. Let users configure available plates in settings (some gyms don't have 35s, some have 1.25 lb microplates).

### 4B. Warm-Up Set Calculator

Before each T1 lift, suggest warm-up sets based on the working weight:

```
Working weight: 185 lbs (5x3)

Warm-up:
  1. Bar (45 lbs) × 10 reps
  2. 95 lbs × 5 reps
  3. 135 lbs × 3 reps
  4. 165 lbs × 1 rep
  → Begin working sets: 185 lbs × 5x3
```

Formula: Empty bar × 10, ~50% × 5, ~75% × 3, ~90% × 1, then working sets. Adjust automatically as working weight increases. Include the warm-ups as a collapsible section on the active workout screen — not required to log, just a reference.

### 4C. Body Weight Tracking

Simple weight log — tap to enter today's weight on the dashboard. Display:
- 7-day rolling average (smooths out water weight fluctuations)
- Trend line over time
- Chart on the stats page alongside lift progress

Keep this lightweight — it's secondary to the workout tracking.

### 4D. Workout Notes

Free-text note field available:
- Per exercise during a workout ("Left shoulder felt tight on set 3")
- Per workout session ("Short on time, skipped T3s")
- Visible in the history view so you can reference what happened

### 4E. Personal Records (PRs)

Track and celebrate PRs:
- **Weight PR**: New highest weight completed for a given lift at a given tier/scheme
- **Volume PR**: New highest total volume (weight × total reps) in a single session for a lift
- When a PR is hit, show a subtle celebration (confetti, a badge, or a simple "🏆 New PR!" toast)
- PR history page showing all-time bests

### 4F. Workout Duration Timer

- Auto-start when the user begins a workout, auto-stop on completion
- Display elapsed time on the active workout screen (small, non-distracting)
- Log duration with each workout for the history view
- Show average workout duration in stats

### 4G. Rest Day Recommendations

On the dashboard, if the user has worked out 2+ days in a row, show a gentle note:
"You've lifted 3 days in a row — consider a rest day for recovery."
Not blocking, just informational. Respect the user's autonomy.

### 4H. Data Management (Supabase)

Since we're on Supabase:
- **Auth**: Simple email/password or magic link. No social login needed for MVP.
- **Real-time sync**: Data persists to Supabase on every set completion (not just end of workout). If the app crashes or phone dies, the workout is recoverable.
- **Offline support**: Cache workout state locally (IndexedDB or localStorage). Sync to Supabase when connectivity returns. Local-first, cloud-backed.
- **Export**: JSON export of all data from settings.
- **Multi-device**: Since data is in Supabase, the app works on phone and desktop automatically.

### 4I. PWA Configuration

- Service worker for offline functionality
- Web app manifest with app name, icons, theme color (dark)
- "Add to Home Screen" prompt or instructions on first visit
- Full-screen display mode (no browser chrome)
- Splash screen

### 4J. Notifications (Optional, Post-MVP)

- Workout reminder if it's a training day and the user hasn't started a session by a configurable time
- Rest timer completion notification (if app is backgrounded)
- Weekly summary push notification ("You hit 4/4 workouts this week — Squat up 20 lbs")

---

## 5. Supabase Schema Reference

### Tables

```sql
-- Users (handled by Supabase Auth, extend with profile)
create table profiles (
  id uuid references auth.users primary key,
  units text default 'lbs' check (units in ('lbs', 'kg')),
  created_at timestamptz default now()
);

-- Lift state for the 4 main lifts (T1 and T2 tracked independently)
create table lift_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  lift_name text not null, -- 'Squat', 'Bench Press', 'Deadlift', 'OHP'
  tier text not null check (tier in ('T1', 'T2')),
  current_weight numeric not null,
  current_stage int not null default 1 check (current_stage between 1 and 3),
  increment numeric not null, -- 5 or 10
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, lift_name, tier)
);

-- T3 exercise state
create table t3_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  exercise_name text not null,
  current_weight numeric not null default 0,
  assigned_day text check (assigned_day in ('A1', 'B1', 'A2', 'B2')),
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workout sessions
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  day text not null check (day in ('A1', 'B1', 'A2', 'B2')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned'))
);

-- Individual exercise entries within a workout
create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade,
  exercise_name text not null,
  tier text not null check (tier in ('T1', 'T2', 'T3')),
  weight numeric not null,
  stage int, -- for T1/T2 only
  scheme text, -- '5x3', '6x2', '10x1', '3x10', '3x8', '3x6', '3x15+'
  sort_order int default 0
);

-- Individual sets within an exercise
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid references workout_exercises(id) on delete cascade,
  set_number int not null,
  target_reps int not null,
  actual_reps int, -- null until completed
  is_amrap boolean default false,
  completed_at timestamptz
);

-- Progression event log (the history/audit trail)
create table progression_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  lift_name text not null,
  tier text not null,
  event_type text not null check (event_type in (
    'weight_increased', 'session_completed', 'session_failed',
    'stage_advanced', 'reset', 'manual_override'
  )),
  from_weight numeric,
  to_weight numeric,
  from_stage int,
  to_stage int,
  details jsonb, -- flexible field for additional context
  -- e.g., { "sets_completed": [3,3,3,2,2], "formula": "195 * 0.85 = 165" }
  workout_id uuid references workouts(id),
  created_at timestamptz default now()
);

-- Body weight log
create table bodyweight_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  weight numeric not null,
  logged_at date not null default current_date,
  unique(user_id, logged_at)
);

-- Personal records
create table personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  exercise_name text not null,
  tier text,
  record_type text not null check (record_type in ('weight', 'volume', 'estimated_1rm')),
  value numeric not null,
  workout_id uuid references workouts(id),
  achieved_at timestamptz default now()
);

-- Row Level Security: enable on all tables
-- Policy: users can only read/write their own data
-- Example for lift_state:
alter table lift_state enable row level security;
create policy "Users can manage own lift state"
  on lift_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- Repeat for all tables
```

### Key Indexes
```sql
create index idx_workouts_user_date on workouts(user_id, started_at desc);
create index idx_progression_events_user_lift on progression_events(user_id, lift_name, tier, created_at desc);
create index idx_workout_exercises_workout on workout_exercises(workout_id);
create index idx_workout_sets_exercise on workout_sets(workout_exercise_id);
create index idx_bodyweight_user_date on bodyweight_log(user_id, logged_at desc);
```

---

## 6. Screen Summary (All Phases)

| Screen | Phase | Description |
|--------|-------|-------------|
| Initial Setup / Onboarding | 1 | Enter starting weights, pick T3s |
| Dashboard | 2 | Next workout, lift cards, recent activity, body weight entry |
| Active Workout | 1 | Core logging flow — sets, reps, rest timer |
| Exercise Info Modal | 2 | Form cues, common mistakes, breathing — overlays during workout |
| Post-Workout Summary | 2 | GZCLP-aware recap with progression explanations |
| Lift Detail | 2 | Per-lift progress chart, stage visualization, progression event log |
| History | 2 | Past workouts list with details |
| Stats / Insights | 2 | Volume, consistency, 1RM estimates, body weight trend |
| Plate Calculator | 2 | Utility modal from active workout screen |
| Settings | 1+2 | T3 config, units, rest timers, data export, manual overrides |
| Learn GZCLP | 2 | Educational content about the methodology |