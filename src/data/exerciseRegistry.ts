/**
 * Phase 3 Exercise Registry — T1/T2 compound movements and T3 accessories
 * Each exercise has increment, rounding, equipment for progression logic
 */

export type EquipmentType = 'Barbell' | 'Smith' | 'Dumbbells' | 'Machine'

export interface ExerciseDefinition {
  name: string
  equipment: EquipmentType
  movementPattern: string
  muscleGroup: string
  increment: number
  rounding: number
  allowedTiers: ('T1' | 'T2')[]
  isBodyweight?: boolean
  trackDuration?: boolean
}

/** T1/T2 compound exercises — users pick 4 for their rotation */
export const T1_T2_EXERCISES: ExerciseDefinition[] = [
  // Barbell
  { name: 'Bench Press', equipment: 'Barbell', movementPattern: 'Horizontal Push', muscleGroup: 'Chest', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Barbell Squat', equipment: 'Barbell', movementPattern: 'Squat', muscleGroup: 'Legs', increment: 10, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Deadlift', equipment: 'Barbell', movementPattern: 'Hinge', muscleGroup: 'Legs', increment: 10, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Barbell OHP', equipment: 'Barbell', movementPattern: 'Vertical Push', muscleGroup: 'Shoulders', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Barbell Row', equipment: 'Barbell', movementPattern: 'Horizontal Pull', muscleGroup: 'Back', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
  // Smith
  { name: 'Smith Squat', equipment: 'Smith', movementPattern: 'Squat', muscleGroup: 'Legs', increment: 10, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Smith Bench Press', equipment: 'Smith', movementPattern: 'Horizontal Push', muscleGroup: 'Chest', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Smith OHP', equipment: 'Smith', movementPattern: 'Vertical Push', muscleGroup: 'Shoulders', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Smith Row', equipment: 'Smith', movementPattern: 'Horizontal Pull', muscleGroup: 'Back', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
  // Dumbbell
  { name: 'Dumbbell OHP', equipment: 'Dumbbells', movementPattern: 'Vertical Push', muscleGroup: 'Shoulders', increment: 10, rounding: 10, allowedTiers: ['T1', 'T2'] },
  { name: 'Dumbbell Bench Press', equipment: 'Dumbbells', movementPattern: 'Horizontal Push', muscleGroup: 'Chest', increment: 10, rounding: 10, allowedTiers: ['T1', 'T2'] },
  { name: 'Dumbbell Row (Heavy)', equipment: 'Dumbbells', movementPattern: 'Horizontal Pull', muscleGroup: 'Back', increment: 10, rounding: 10, allowedTiers: ['T1', 'T2'] },
  // Machine
  { name: 'Leg Press', equipment: 'Machine', movementPattern: 'Squat/Push', muscleGroup: 'Legs', increment: 10, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Hack Squat', equipment: 'Machine', movementPattern: 'Squat', muscleGroup: 'Legs', increment: 10, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Chest Press Machine', equipment: 'Machine', movementPattern: 'Horizontal Push', muscleGroup: 'Chest', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'Shoulder Press Machine', equipment: 'Machine', movementPattern: 'Vertical Push', muscleGroup: 'Shoulders', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
  // Legacy (for migration from Phase 1/2)
  { name: 'Squat', equipment: 'Barbell', movementPattern: 'Squat', muscleGroup: 'Legs', increment: 10, rounding: 5, allowedTiers: ['T1', 'T2'] },
  { name: 'OHP', equipment: 'Barbell', movementPattern: 'Vertical Push', muscleGroup: 'Shoulders', increment: 5, rounding: 5, allowedTiers: ['T1', 'T2'] },
]

/** T3 accessories grouped by muscle — default increment 5, rounding 5 */
export const T3_LIBRARY: Record<string, string[]> = {
  'Back / Pull': [
    'Lat Pulldown',
    'Cable Row',
    'Dumbbell Row',
    'Chest-Supported Row',
    'Pull-Up',
    'Chin-Up',
    'Face Pull',
    'Straight-Arm Pulldown',
  ],
  'Chest / Push': [
    'Dumbbell Bench Press',
    'Incline Dumbbell Press',
    'Cable Fly',
    'Pec Deck',
    'Dips',
    'Tricep Pushdown',
    'Overhead Tricep Extension',
    'Skull Crushers',
  ],
  Shoulders: [
    'Lateral Raise',
    'Front Raise',
    'Rear Delt Fly',
    'Cable Lateral Raise',
    'Face Pull',
    'Upright Row',
  ],
  Arms: [
    'Bicep Curl',
    'Bicep Curl (Dumbbell)',
    'Hammer Curl',
    'EZ Bar Curl',
    'Cable Curl',
    'Preacher Curl',
    'Tricep Pushdown',
    'Tricep Overhead Extension',
    'Skull Crushers',
  ],
  'Legs / Glutes': [
    'Leg Press',
    'Leg Curl (Lying/Seated)',
    'Leg Extension',
    'Bulgarian Split Squat',
    'Calf Raise (Standing/Seated)',
    'Hip Thrust',
    'Goblet Squat',
    'Dumbbell Romanian Deadlift',
    'DB Romanian Deadlift',
    'Glute Kickback',
  ],
  Core: [
    'Cable Crunch',
    'Hanging Leg Raise',
    'Ab Wheel Rollout',
    'Plank (timed)',
    'Weighted Decline Sit-Up',
    'Pallof Press',
    'Dead Bug',
  ],
}

/** T3 exercises that are bodyweight-only (track reps, prompt to add weight at 25) */
export const T3_BODYWEIGHT: Set<string> = new Set(['Pull-Up', 'Chin-Up', 'Dips'])

/** T3 exercises that track duration (seconds) instead of reps */
export const T3_TRACK_DURATION: Set<string> = new Set(['Plank (timed)'])

/** Default T3 increment and rounding for accessories */
export const T3_DEFAULT_INCREMENT = 5
export const T3_DEFAULT_ROUNDING = 5

/** Get T1/T2 exercise definition by name */
export function getExerciseDefinition(name: string): ExerciseDefinition | undefined {
  return T1_T2_EXERCISES.find((e) => e.name === name)
}

/** Get T3 metadata — most use default 5/5 */
export function getT3Increment(_name: string): number {
  return T3_DEFAULT_INCREMENT
}

export function getT3Rounding(_name: string): number {
  return T3_DEFAULT_ROUNDING
}

export function isT3Bodyweight(name: string): boolean {
  return T3_BODYWEIGHT.has(name)
}

export function isT3TrackDuration(name: string): boolean {
  return T3_TRACK_DURATION.has(name)
}

/** Phase 3 default day structure */
export const DEFAULT_DAY_STRUCTURE = {
  A1: { t1: 'Smith Squat', t2: 'Bench Press' },
  B1: { t1: 'Dumbbell OHP', t2: 'Leg Press' },
  A2: { t1: 'Bench Press', t2: 'Smith Squat' },
  B2: { t1: 'Leg Press', t2: 'Dumbbell OHP' },
} as const

/** Phase 3 default T3 exercises per day */
export const DEFAULT_T3_EXERCISES = {
  A1: ['Lat Pulldown', 'DB Romanian Deadlift'],
  B1: ['Cable Row', 'Bicep Curl'],
  A2: ['Lat Pulldown', 'Cable Crunch'],
  B2: ['Dumbbell Row', 'Lateral Raise'],
} as const
