export type WorkoutDay = 'A1' | 'B1' | 'A2' | 'B2'

export type Tier = 'T1' | 'T2' | 'T3'

export type Units = 'lbs' | 'kg'

export const T1_SCHEMES = ['5x3', '6x2', '10x1'] as const
export const T2_SCHEMES = ['3x10', '3x8', '3x6'] as const
export type T1Scheme = typeof T1_SCHEMES[number]
export type T2Scheme = typeof T2_SCHEMES[number]

/** Phase 3: Configurable T1/T2 assignments per day (exercise names) */
export type DayStructure = Record<WorkoutDay, { t1: string; t2: string }>

export interface CustomExerciseDefinition {
  name: string
  equipment: string
  movementPattern: string
  muscleGroup: string
  increment: number
  rounding: number
  allowedTiers: ('T1' | 'T2')[]
}

export interface UserProfile {
  units: Units
  t3Exercises: Record<WorkoutDay, string[]>
  restTimerT1: number // seconds
  restTimerT2: number
  restTimerT3: number
  /** Phase 3: Configurable T1/T2 per day */
  dayStructure?: DayStructure
  /** Phase 3: Next day in rotation */
  currentDay?: WorkoutDay
  /** Phase 3: User-added exercises */
  customExercises?: CustomExerciseDefinition[]
}

export interface LiftHistoryEntry {
  date: string
  weight: number
  stage: number
  scheme: string
  setsCompleted: number[]
  completed: boolean
}

export interface T3HistoryEntry {
  date: string
  weight: number
  setsCompleted: number[]
  amrapHit25: boolean
}

export interface LiftState {
  liftName: string
  tier: 'T1' | 'T2'
  currentWeight: number
  currentStage: 1 | 2 | 3
  currentScheme: T1Scheme | T2Scheme
  increment: number
  /** Phase 3: Per-exercise rounding (5 or 10 for dumbbells) */
  rounding: number
  history: LiftHistoryEntry[]
}

export interface T3LiftState {
  liftName: string
  currentWeight: number
  /** Phase 3: Default 5 */
  increment?: number
  /** Phase 3: Bodyweight exercises — display "BW" or "BW + 25" */
  isBodyweight?: boolean
  /** Phase 3: Plank-style — track seconds not reps */
  trackDuration?: boolean
  history: T3HistoryEntry[]
}

export interface WorkoutSet {
  targetReps: number
  actualReps: number | null
  completed: boolean
}

export interface WorkoutExercise {
  liftName: string
  tier: Tier
  targetWeight: number
  targetScheme: string
  sets: WorkoutSet[]
  notes?: string
}

export interface WorkoutSession {
  id: string
  day: WorkoutDay
  date: string
  startTime: number
  exercises: WorkoutExercise[]
  status: 'in_progress' | 'completed' | 'abandoned'
  notes?: string
  completedAt?: number
  /** Phase 3: Total duration in seconds */
  totalDuration?: number
}

export type ProgressionEventType =
  | 'weight_increased'
  | 'session_completed'
  | 'session_failed'
  | 'stage_advanced'
  | 'reset'
  | 'manual_override'

export interface ProgressionEvent {
  id: string
  liftName: string
  tier: 'T1' | 'T2'
  eventType: ProgressionEventType
  fromWeight?: number
  toWeight?: number
  fromStage?: number
  toStage?: number
  details?: Record<string, unknown>
  workoutId?: string
  createdAt: number
}

export interface BodyweightLog {
  id: string
  weight: number
  loggedAt: string // YYYY-MM-DD
}

export interface PersonalRecord {
  id: string
  exerciseName: string
  tier?: string
  recordType: 'weight' | 'volume' | 'estimated_1rm'
  value: number
  workoutId?: string
  achievedAt: number
}

/** @deprecated Use dayStructure from profile. Kept for migration. */
export const MAIN_LIFTS = ['Squat', 'Bench Press', 'OHP', 'Deadlift'] as const
export type MainLift = typeof MAIN_LIFTS[number]

/** @deprecated Use profile.dayStructure. Kept for migration. */
export const DAY_STRUCTURE: Record<WorkoutDay, { t1: MainLift; t2: MainLift }> = {
  A1: { t1: 'Squat', t2: 'Bench Press' },
  B1: { t1: 'OHP', t2: 'Deadlift' },
  A2: { t1: 'Bench Press', t2: 'Squat' },
  B2: { t1: 'Deadlift', t2: 'OHP' }
}

/** @deprecated Use T3_LIBRARY from exerciseRegistry. Kept for backward compatibility. */
export const T3_LIBRARY: Record<string, string[]> = {
  Pull: ['Lat Pulldown', 'Dumbbell Row', 'Cable Row', 'Barbell Row', 'Pull-Up', 'Chin-Up', 'Face Pull'],
  Push: ['Dumbbell Bench Press', 'Incline Dumbbell Press', 'Dips', 'Tricep Pushdown', 'Overhead Tricep Extension'],
  Arms: ['Bicep Curl', 'Hammer Curl', 'EZ Bar Curl', 'Tricep Pushdown', 'Skull Crushers'],
  Shoulders: ['Lateral Raise', 'Front Raise', 'Rear Delt Fly', 'Face Pull'],
  Core: ['Cable Crunch', 'Hanging Leg Raise', 'Ab Wheel Rollout', 'Plank (timed)'],
  Legs: ['Leg Press', 'Leg Curl', 'Leg Extension', 'Bulgarian Split Squat', 'Calf Raise', 'Hip Thrust']
}
