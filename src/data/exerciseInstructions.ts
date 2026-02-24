export interface ExerciseInstruction {
  muscles: string
  equipment: string
  keyPoints: string[]
  commonMistakes: string[]
  breathing: string
}

export const EXERCISE_INSTRUCTIONS: Record<string, ExerciseInstruction> = {
  Squat: {
    muscles: 'Quads · Glutes · Hamstrings · Core',
    equipment: 'Barbell + Squat Rack',
    keyPoints: [
      'Feet shoulder-width apart, toes angled slightly outward (15-30°)',
      'Bar rests on upper traps; grip the bar outside your shoulders',
      'Break at hips and knees simultaneously — sit between your legs',
      'Descend until hip crease is at or below the top of your knee (parallel or deeper)',
      'Drive up through mid-foot, keeping chest tall'
    ],
    commonMistakes: [
      "Don't let knees cave inward — actively push them out over your toes",
      "Don't lean excessively forward — keep your chest up and core braced",
      "Don't cut depth short — partial squats leave progress on the table"
    ],
    breathing: 'Big breath in at the top, brace core hard, descend, exhale forcefully as you drive up.'
  },
  'Bench Press': {
    muscles: 'Chest · Triceps · Front Delts',
    equipment: 'Barbell + Flat Bench + Rack',
    keyPoints: [
      'Lie flat with eyes directly under the bar',
      'Grip slightly wider than shoulder-width; wrists straight, not bent back',
      'Retract and depress your shoulder blades — pinch them together and down into the bench',
      'Unrack, lower the bar to your mid-chest (around nipple line) with control',
      'Press up and slightly back toward the rack, locking out at the top'
    ],
    commonMistakes: [
      "Don't flare elbows to 90° — keep them at roughly 45-75° to protect shoulders",
      "Don't bounce the bar off your chest — brief pause or light touch",
      "Don't lift your butt off the bench — maintain a slight arch but keep glutes down"
    ],
    breathing: 'Inhale as the bar descends, exhale as you press up.'
  },
  Deadlift: {
    muscles: 'Hamstrings · Glutes · Lower Back · Traps · Grip',
    equipment: 'Barbell (from floor)',
    keyPoints: [
      'Stand with feet hip-width apart, bar over mid-foot (about 1 inch from shins)',
      'Grip the bar just outside your knees — double overhand or mixed grip',
      'Hinge at hips, push your butt back, keep your chest up and back flat',
      'Drag the bar up your shins and thighs — it should stay in contact with your body',
      'Stand tall at the top, squeeze glutes — don\'t hyperextend your back'
    ],
    commonMistakes: [
      "Don't round your lower back — if you can't maintain a flat back, the weight is too heavy",
      "Don't jerk the bar off the floor — build tension first, then push the floor away",
      "Don't let the bar drift forward away from your body — keep it close"
    ],
    breathing: 'Big breath in at the bottom, brace hard, pull, exhale at the top. Reset breath each rep.'
  },
  'Overhead Press': {
    muscles: 'Shoulders · Triceps · Upper Chest · Core',
    equipment: 'Barbell + Rack',
    keyPoints: [
      'Start with bar resting on front delts, grip just outside shoulder-width',
      'Feet shoulder-width apart, squeeze your glutes and brace your core',
      'Press the bar straight up — move your head out of the way (lean back slightly), then push your head through once the bar passes your forehead',
      'Lock out directly overhead, bar over mid-foot, biceps near your ears',
      'Lower with control back to your front delts'
    ],
    commonMistakes: [
      "Don't excessively arch your lower back — squeeze glutes to prevent this",
      "Don't press the bar forward in an arc — the bar path should be nearly vertical",
      "Don't use your legs (that makes it a push press) — strict press means no knee bend"
    ],
    breathing: 'Inhale at the bottom, brace, press, exhale at lockout.'
  },
  'Lat Pulldown': {
    muscles: 'Lats · Biceps · Rear Delts',
    equipment: 'Cable Machine + Wide Bar Attachment',
    keyPoints: [
      'Grip the bar wider than shoulder-width, palms facing away',
      'Sit tall, lean back slightly (10-15°), chest up',
      'Pull the bar to your upper chest — drive your elbows down and back',
      'Squeeze your shoulder blades together at the bottom, then control the bar back up'
    ],
    commonMistakes: [
      "Don't lean way back and turn it into a row — slight lean only",
      "Don't pull behind your neck — always pull to your chest",
      "Don't use momentum — control the weight both directions"
    ],
    breathing: 'Exhale as you pull down, inhale as you return.'
  },
  'Dumbbell Row': {
    muscles: 'Lats · Rhomboids · Biceps · Rear Delts',
    equipment: 'Dumbbell + Bench',
    keyPoints: [
      'One knee and hand on the bench, other foot on the floor for stability',
      'Let the dumbbell hang straight down, then pull it toward your hip',
      'Drive your elbow up and back, squeezing your shoulder blade at the top',
      'Lower with control — full stretch at the bottom'
    ],
    commonMistakes: [
      "Don't rotate your torso to heave the weight up — keep your shoulders level",
      "Don't shrug the weight — drive with your elbow, not your trap",
      "Don't rush the negative — the lowering phase builds muscle too"
    ],
    breathing: 'Exhale as you pull, inhale as you lower.'
  },
  'Face Pull': {
    muscles: 'Rear Delts · Rotator Cuff · Traps',
    equipment: 'Cable Machine + Rope Attachment',
    keyPoints: [
      'Set the cable at upper chest to face height',
      'Grip the rope with thumbs pointing back toward you',
      'Pull toward your face, separating the rope ends — hands finish beside your ears',
      'Squeeze your rear delts and external rotators at the end position'
    ],
    commonMistakes: [
      "Don't use too much weight — this is a precision movement, keep it light",
      "Don't pull to your chest — the target is your face/forehead level",
      "Don't let your shoulders round forward at the start — stand tall"
    ],
    breathing: 'Exhale as you pull, inhale as you return.'
  },
  'Bicep Curl': {
    muscles: 'Biceps · Forearms',
    equipment: 'Dumbbells or EZ-Bar or Barbell',
    keyPoints: [
      'Stand upright, arms at your sides, palms facing forward',
      'Curl the weight up by bending at the elbow — keep upper arms pinned to your sides',
      'Squeeze at the top, then lower with control (2-3 second negative)',
      'Full extension at the bottom — don\'t keep a permanent bend'
    ],
    commonMistakes: [
      "Don't swing your body — if you need momentum, the weight is too heavy",
      "Don't let your elbows drift forward — keep them at your sides",
      "Don't rush the lowering phase — the eccentric is where growth happens"
    ],
    breathing: 'Exhale as you curl up, inhale as you lower.'
  },
  'Cable Crunch': {
    muscles: 'Abs (Rectus Abdominis)',
    equipment: 'Cable Machine + Rope Attachment',
    keyPoints: [
      'Kneel facing the cable, hold the rope beside your head',
      'Crunch down by flexing your spine — bring your elbows toward your knees',
      'Focus on curling your ribcage toward your pelvis, not just bowing forward',
      'Control the return — don\'t let the weight stack yank you back up'
    ],
    commonMistakes: [
      "Don't sit back onto your heels — your hips should stay stationary",
      "Don't just bend at the hips — the movement is spinal flexion, not a hip hinge",
      "Don't go too heavy — you should feel your abs, not your hip flexors"
    ],
    breathing: 'Exhale as you crunch down, inhale as you return.'
  },
  'Lateral Raise': {
    muscles: 'Side Delts',
    equipment: 'Dumbbells',
    keyPoints: [
      'Stand with dumbbells at your sides, slight bend in elbows',
      'Raise arms out to the sides until they\'re parallel with the floor',
      'Lead with your elbows, not your hands — think "pouring a pitcher of water"',
      'Lower with control — don\'t just drop them'
    ],
    commonMistakes: [
      "Don't go too heavy — lateral raises are notoriously humbling, 10-15 lbs is normal",
      "Don't shrug your shoulders up — keep them depressed",
      "Don't swing — if you need momentum, drop the weight"
    ],
    breathing: 'Exhale as you raise, inhale as you lower.'
  },
  'Tricep Pushdown': {
    muscles: 'Triceps',
    equipment: 'Cable Machine + Straight Bar or Rope',
    keyPoints: [
      'Stand facing the cable, elbows pinned at your sides',
      'Push the handle down until your arms are fully extended',
      'Squeeze your triceps at the bottom, then control the return',
      'Keep your upper arms completely still — only your forearms should move'
    ],
    commonMistakes: [
      "Don't flare your elbows out — keep them tight to your body",
      "Don't lean over the handle — stand upright",
      "Don't let the weight pull your elbows forward at the top"
    ],
    breathing: 'Exhale as you push down, inhale as you return.'
  },
  'Hanging Leg Raise': {
    muscles: 'Lower Abs · Hip Flexors',
    equipment: 'Pull-Up Bar',
    keyPoints: [
      'Hang from the bar with straight arms, shoulders engaged (don\'t just dangle)',
      'Raise your legs by curling your pelvis up — think about bringing your belt buckle to your chin',
      'Control the descent — don\'t swing',
      'Bent knees is fine to start; progress to straight legs over time'
    ],
    commonMistakes: [
      "Don't just swing your legs up with momentum — controlled movement",
      "Don't just lift your knees without curling your pelvis — the pelvic tilt is what hits your abs",
      "Don't death-grip and shrug — keep shoulders packed down"
    ],
    breathing: 'Exhale as you raise, inhale as you lower.'
  },
  'Leg Press': {
    muscles: 'Quads · Glutes · Hamstrings',
    equipment: 'Leg Press Machine',
    keyPoints: [
      'Feet shoulder-width on the platform, positioned in the middle or slightly high',
      'Lower the sled by bending your knees toward your chest — go as deep as you can without your lower back lifting off the pad',
      'Push through your whole foot, don\'t lock out your knees completely at the top',
      'Keep your lower back pressed flat against the pad at all times'
    ],
    commonMistakes: [
      "Don't go so deep that your lower back rounds off the pad — that's too far",
      "Don't lock your knees out hard at the top — keep a slight bend",
      "Don't place your feet too low — this puts excessive stress on your knees"
    ],
    breathing: 'Exhale as you push, inhale as you lower.'
  },
  'Leg Curl': {
    muscles: 'Hamstrings',
    equipment: 'Leg Curl Machine (Lying or Seated)',
    keyPoints: [
      'Adjust the pad so it sits on your lower calves, just above your ankles',
      'Curl the weight by bringing your heels toward your glutes',
      'Squeeze at the top, then lower slowly (3-second negative)',
      'Keep your hips pressed into the pad (lying) or seat (seated)'
    ],
    commonMistakes: [
      "Don't use momentum to swing the weight — controlled contraction",
      "Don't lift your hips off the pad to cheat the weight up",
      "Don't let the weight slam down — control the eccentric"
    ],
    breathing: 'Exhale as you curl, inhale as you lower.'
  },
  'Calf Raise': {
    muscles: 'Calves (Gastrocnemius · Soleus)',
    equipment: 'Smith Machine, Calf Raise Machine, or Step + Dumbbells',
    keyPoints: [
      'Stand on the edge of a step or platform with your heels hanging off',
      'Push up onto your toes as high as possible — full contraction at the top',
      'Lower slowly until you feel a deep stretch in your calves — go below the platform level',
      'Pause at the bottom and top for 1-2 seconds each'
    ],
    commonMistakes: [
      "Don't bounce — calves respond better to slow, controlled reps with pauses",
      "Don't cut the range of motion short — full stretch to full contraction",
      "Don't bend your knees — keep legs straight (or slightly bent for soleus emphasis)"
    ],
    breathing: 'Exhale as you rise, inhale as you lower.'
  },
  'Dumbbell Bench Press': {
    muscles: 'Chest · Triceps · Front Delts',
    equipment: 'Dumbbells + Flat or Incline Bench',
    keyPoints: [
      'Sit on the bench with dumbbells on your knees, kick them up as you lie back',
      'Press with palms facing forward, slight arc bringing the dumbbells together at the top',
      'Lower until your upper arms are parallel with the floor or slightly below',
      'Retract your shoulder blades just like barbell bench — stable base'
    ],
    commonMistakes: [
      "Don't let the dumbbells drift too wide at the bottom — keep elbows at 45-75°",
      "Don't clang the dumbbells together at the top — touch lightly or stop just short",
      "Don't drop them recklessly — learn to lower them to your knees safely"
    ],
    breathing: 'Inhale as you lower, exhale as you press.'
  },
  'Pull-Up': {
    muscles: 'Lats · Biceps · Core',
    equipment: 'Pull-Up Bar',
    keyPoints: [
      'Hang with arms fully extended, shoulders engaged (pull shoulder blades down)',
      'Pull yourself up until your chin clears the bar',
      'Lower with control — full extension at the bottom, no half reps',
      'If you can\'t do bodyweight reps, use an assisted pull-up machine or resistance band'
    ],
    commonMistakes: [
      "Don't kip or swing — strict form builds more muscle",
      "Don't cut the range short — go all the way down, all the way up",
      "Don't crane your neck to get your chin over — if you have to strain your neck, you\'re not high enough"
    ],
    breathing: 'Exhale as you pull up, inhale as you lower.'
  },
  'Chin-Up': {
    muscles: 'Lats · Biceps · Core',
    equipment: 'Pull-Up Bar',
    keyPoints: [
      'Hang with arms fully extended, palms toward you, grip shoulder-width or narrower',
      'Pull yourself up until your chin clears the bar',
      'Lower with control — full extension at the bottom',
      'Chin-up emphasizes biceps more than pull-up'
    ],
    commonMistakes: [
      "Don't kip or swing — strict form",
      "Don't cut the range short — full ROM",
      "Don't let your shoulders roll forward at the bottom"
    ],
    breathing: 'Exhale as you pull up, inhale as you lower.'
  },
  'Cable Row': {
    muscles: 'Mid-Back · Lats · Biceps',
    equipment: 'Cable Machine + V-Handle or Wide Handle',
    keyPoints: [
      'Sit upright with slight knee bend, feet braced on the platform',
      'Pull the handle toward your lower chest/upper abdomen',
      'Squeeze your shoulder blades together at the end, then extend fully',
      'Keep your torso upright — don\'t rock back and forth'
    ],
    commonMistakes: [
      "Don't use your lower back to row the weight — your torso should barely move",
      "Don't shrug — pull with your elbows and lats, not your traps",
      "Don't round forward at full extension — maintain a tall posture throughout"
    ],
    breathing: 'Exhale as you pull, inhale as you extend.'
  },
  'Hammer Curl': {
    muscles: 'Brachialis · Biceps · Forearms',
    equipment: 'Dumbbells',
    keyPoints: [
      'Hold dumbbells at your sides with palms facing each other (neutral grip)',
      'Curl up keeping the neutral grip — don\'t rotate your wrists',
      'Same rules as regular curls: upper arms stay pinned, control the negative'
    ],
    commonMistakes: [
      "Don't swing — same as regular curls",
      "Don't alternate and rest one arm — do both together for more time under tension, or alternate with no pause"
    ],
    breathing: 'Exhale as you curl, inhale as you lower.'
  },
  'Bulgarian Split Squat': {
    muscles: 'Quads · Glutes · Balance',
    equipment: 'Dumbbells + Bench',
    keyPoints: [
      'Stand 2-3 feet in front of a bench, place one foot behind you on the bench (laces down)',
      'Lower straight down until your back knee nearly touches the floor',
      'Push up through your front heel — keep your torso upright',
      'Most of your weight should be on your front leg'
    ],
    commonMistakes: [
      "Don't stand too close to the bench — you need room to drop straight down",
      "Don't lean forward excessively — stay upright",
      "Don't rush — balance takes practice, start with bodyweight if needed"
    ],
    breathing: 'Exhale as you stand, inhale as you lower.'
  },
  'Hip Thrust': {
    muscles: 'Glutes · Hamstrings',
    equipment: 'Barbell + Bench (or Body Weight)',
    keyPoints: [
      'Sit on the floor with your upper back against a bench, barbell across your hips (use a pad)',
      'Drive through your heels to lift your hips until your thighs are parallel with the floor',
      'Squeeze your glutes hard at the top for 1-2 seconds — full lockout',
      'Lower with control — don\'t just drop'
    ],
    commonMistakes: [
      "Don't hyperextend your lower back at the top — stop at neutral spine with glutes squeezed",
      "Don't push through your toes — drive through heels",
      "Don't let your chin tuck to your chest — look forward throughout"
    ],
    breathing: 'Exhale as you thrust up, inhale as you lower.'
  },
  'Ab Wheel Rollout': {
    muscles: 'Abs · Core · Lats',
    equipment: 'Ab Wheel',
    keyPoints: [
      'Start on your knees, hands on the wheel, arms straight',
      'Roll forward slowly, extending your arms — go as far as you can while maintaining a flat back',
      'Pull back to the start by contracting your abs — don\'t just use your arms',
      'Keep your core braced the entire time — don\'t let your hips sag'
    ],
    commonMistakes: [
      "Don't let your lower back arch/sag — if it does, you've gone too far",
      "Don't bend at the hips on the way back — roll back with your core",
      "Don't go to full extension if you're not strong enough yet — build range over time"
    ],
    breathing: 'Exhale as you roll out, inhale as you return.'
  }
}

EXERCISE_INSTRUCTIONS['OHP'] = EXERCISE_INSTRUCTIONS['Overhead Press']!

export function getExerciseInstruction(name: string): ExerciseInstruction | null {
  return EXERCISE_INSTRUCTIONS[name] ?? null
}
