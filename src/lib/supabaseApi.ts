import { supabase } from './supabase'
import type {
  UserProfile,
  LiftState,
  T3LiftState,
  WorkoutSession,
  WorkoutExercise,
  ProgressionEvent,
  PersonalRecord
} from '../types'
import type { WorkoutDay } from '../types'

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id) return session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.warn('Supabase auth failed:', error.message)
    return null
  }
  return data.user?.id ?? null
}

// --- Profile ---
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    units: data.units as 'lbs' | 'kg',
    t3Exercises: data.t3_exercises as Record<WorkoutDay, string[]>,
    restTimerT1: data.rest_timer_t1,
    restTimerT2: data.rest_timer_t2,
    restTimerT3: data.rest_timer_t3,
    dayStructure: (data.day_structure as UserProfile['dayStructure']) ?? undefined,
    currentDay: (data.current_day as UserProfile['currentDay']) ?? undefined,
    customExercises: (data.custom_exercises as UserProfile['customExercises']) ?? undefined,
    xp: data.xp ?? 0,
    level: data.level ?? 1
  }
}

export async function upsertProfile(userId: string, profile: UserProfile): Promise<void> {
  await supabase.from('profiles').upsert(
    {
      id: userId,
      units: profile.units,
      t3_exercises: profile.t3Exercises,
      rest_timer_t1: profile.restTimerT1,
      rest_timer_t2: profile.restTimerT2,
      rest_timer_t3: profile.restTimerT3,
      day_structure: profile.dayStructure ?? null,
      current_day: profile.currentDay ?? null,
      custom_exercises: profile.customExercises ?? [],
      xp: profile.xp ?? 0,
      level: profile.level ?? 1,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  )
}

export async function updateProfileXp(userId: string, xp: number, level: number): Promise<void> {
  await supabase.from('profiles').update({
    xp,
    level,
    updated_at: new Date().toISOString()
  }).eq('id', userId)
}

export async function updateProfileMeta(
  userId: string,
  meta: { setupComplete?: boolean; lastWorkoutDay?: WorkoutDay; lastWorkoutDate?: string; currentDay?: WorkoutDay; xp?: number; level?: number }
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (meta.setupComplete !== undefined) updates.setup_complete = meta.setupComplete
  if (meta.lastWorkoutDay !== undefined) updates.last_workout_day = meta.lastWorkoutDay
  if (meta.lastWorkoutDate !== undefined) updates.last_workout_date = meta.lastWorkoutDate
  if (meta.currentDay !== undefined) updates.current_day = meta.currentDay
  if (meta.xp !== undefined) updates.xp = meta.xp
  if (meta.level !== undefined) updates.level = meta.level
  await supabase.from('profiles').update(updates).eq('id', userId)
}

// --- Lift State ---
function liftStateFromRow(r: { lift_name: string; tier: string; current_weight: number; current_stage: number; current_scheme: string; increment: number; rounding?: number; history: unknown }): LiftState {
  return {
    liftName: r.lift_name,
    tier: r.tier as 'T1' | 'T2',
    currentWeight: r.current_weight,
    currentStage: r.current_stage as 1 | 2 | 3,
    currentScheme: r.current_scheme as LiftState['currentScheme'],
    increment: r.increment,
    rounding: r.rounding ?? 5,
    history: (r.history as LiftState['history']) ?? []
  }
}

export async function getLiftState(userId: string): Promise<Map<string, LiftState>> {
  const { data, error } = await supabase
    .from('lift_state')
    .select('*')
    .eq('user_id', userId)

  if (error || !data) return new Map()

  const map = new Map<string, LiftState>()
  for (const r of data) {
    const state = liftStateFromRow(r)
    map.set(`${state.liftName}-${state.tier}`, state)
  }
  return map
}

export async function upsertLiftState(userId: string, id: string, state: LiftState): Promise<void> {
  const [liftName, tier] = id.split('-')
  await supabase.from('lift_state').upsert(
    {
      user_id: userId,
      lift_name: liftName,
      tier,
      current_weight: state.currentWeight,
      current_stage: state.currentStage,
      current_scheme: state.currentScheme,
      increment: state.increment,
      rounding: state.rounding ?? 5,
      history: state.history,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,lift_name,tier' }
  )
}

// --- T3 State ---
function t3StateFromRow(r: { exercise_name: string; current_weight: number; increment?: number; is_bodyweight?: boolean; track_duration?: boolean; history: unknown }): T3LiftState {
  return {
    liftName: r.exercise_name,
    currentWeight: r.current_weight,
    increment: r.increment ?? 5,
    isBodyweight: r.is_bodyweight ?? undefined,
    trackDuration: r.track_duration ?? undefined,
    history: (r.history as T3LiftState['history']) ?? []
  }
}

export async function getT3State(userId: string): Promise<Map<string, T3LiftState>> {
  const { data, error } = await supabase
    .from('t3_state')
    .select('*')
    .eq('user_id', userId)

  if (error || !data) return new Map()

  const map = new Map<string, T3LiftState>()
  for (const r of data) {
    const state = t3StateFromRow(r)
    map.set(state.liftName, state)
  }
  return map
}

export async function upsertT3State(userId: string, exerciseName: string, state: T3LiftState): Promise<void> {
  await supabase.from('t3_state').upsert(
    {
      user_id: userId,
      exercise_name: exerciseName,
      current_weight: state.currentWeight,
      increment: state.increment ?? 5,
      is_bodyweight: state.isBodyweight ?? false,
      track_duration: state.trackDuration ?? false,
      history: state.history,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,exercise_name' }
  )
}

// --- Workouts ---
async function workoutFromRows(
  w: { id: string; day: string; date: string; started_at: string; completed_at: string | null; notes: string | null; status: string },
  exercises: { id: string; exercise_name: string; tier: string; target_weight: number; target_scheme: string; notes: string | null; sort_order: number }[],
  setsByExercise: Map<string, { set_number: number; target_reps: number; actual_reps: number | null; is_amrap: boolean; completed_at: string | null }[]>
): Promise<WorkoutSession> {
  const exs: WorkoutExercise[] = exercises
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((ex) => {
      const sets = (setsByExercise.get(ex.id) ?? [])
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({
          targetReps: s.target_reps,
          actualReps: s.actual_reps,
          completed: !!s.completed_at
        }))
      return {
        liftName: ex.exercise_name,
        tier: ex.tier as WorkoutExercise['tier'],
        targetWeight: ex.target_weight,
        targetScheme: ex.target_scheme,
        sets,
        notes: ex.notes ?? undefined
      }
    })

  return {
    id: w.id,
    day: w.day as WorkoutDay,
    date: w.date,
    startTime: new Date(w.started_at).getTime(),
    exercises: exs,
    status: w.status as 'in_progress' | 'completed' | 'abandoned',
    notes: w.notes ?? undefined,
    completedAt: w.completed_at ? new Date(w.completed_at).getTime() : undefined
  }
}

export async function getActiveWorkout(userId: string): Promise<WorkoutSession | null> {
  const { data: workouts, error: we } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .limit(1)

  if (we || !workouts?.length) return null
  const w = workouts[0]

  const { data: exs } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('workout_id', w.id)
    .order('sort_order')

  if (!exs?.length) return workoutFromRows(w, [], new Map())

  const { data: sets } = await supabase
    .from('workout_sets')
    .select('*')
    .in('workout_exercise_id', exs.map((e) => e.id))

  const setsByEx = new Map<string, typeof sets>()
  for (const s of sets ?? []) {
    const list = setsByEx.get(s.workout_exercise_id) ?? []
    list.push(s)
    setsByEx.set(s.workout_exercise_id, list)
  }

  const setsByExercise = new Map<string, { set_number: number; target_reps: number; actual_reps: number | null; is_amrap: boolean; completed_at: string | null }[]>()
  for (const [exId, list] of setsByEx) {
    setsByExercise.set(exId, list as { set_number: number; target_reps: number; actual_reps: number | null; is_amrap: boolean; completed_at: string | null }[])
  }

  return workoutFromRows(w, exs, setsByExercise)
}

export async function getWorkoutById(userId: string, workoutId: string): Promise<WorkoutSession | null> {
  const { data: workouts, error: we } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', workoutId)
    .limit(1)

  if (we || !workouts?.length) return null
  const w = workouts[0]

  const { data: exs } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('workout_id', w.id)
    .order('sort_order')

  if (!exs?.length) return workoutFromRows(w, [], new Map())

  const { data: sets } = await supabase
    .from('workout_sets')
    .select('*')
    .in('workout_exercise_id', exs.map((e) => e.id))

  const setsByEx = new Map<string, { set_number: number; target_reps: number; actual_reps: number | null; is_amrap: boolean; completed_at: string | null }[]>()
  for (const s of sets ?? []) {
    const list = setsByEx.get(s.workout_exercise_id) ?? []
    list.push(s)
    setsByEx.set(s.workout_exercise_id, list)
  }

  return workoutFromRows(w, exs, setsByEx)
}

export async function getCompletedWorkouts(userId: string, limit = 50): Promise<WorkoutSession[]> {
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(limit)

  if (error || !workouts?.length) return []

  const result: WorkoutSession[] = []
  for (const w of workouts) {
    const session = await getWorkoutById(userId, w.id)
    if (session) result.push(session)
  }
  return result
}

export async function createWorkout(userId: string, session: WorkoutSession): Promise<void> {
  const { error: we } = await supabase.from('workouts').insert({
    id: session.id,
    user_id: userId,
    day: session.day,
    date: session.date,
    started_at: new Date(session.startTime).toISOString(),
    status: session.status
  })
  if (we) throw we

  for (let i = 0; i < session.exercises.length; i++) {
    const ex = session.exercises[i]
    const { data: exRow } = await supabase.from('workout_exercises').insert({
      workout_id: session.id,
      exercise_name: ex.liftName,
      tier: ex.tier,
      target_weight: ex.targetWeight,
      target_scheme: ex.targetScheme,
      notes: ex.notes ?? null,
      sort_order: i
    }).select('id').single()

    if (!exRow?.id) continue
    for (let j = 0; j < ex.sets.length; j++) {
      const set = ex.sets[j]
      await supabase.from('workout_sets').insert({
        workout_exercise_id: exRow.id,
        set_number: j + 1,
        target_reps: set.targetReps,
        actual_reps: set.actualReps,
        is_amrap: ex.tier === 'T3' && j === 2
      })
    }
  }
}

export async function updateWorkout(userId: string, session: WorkoutSession): Promise<void> {
  // Fetch existing workout_exercises to get their ids
  const { data: exs } = await supabase
    .from('workout_exercises')
    .select('id, sort_order')
    .eq('workout_id', session.id)
    .order('sort_order')

  if (!exs?.length) {
    await createWorkout(userId, session)
    return
  }

  if (session.status === 'completed') {
    await supabase.from('workouts').update({
      status: 'completed',
      completed_at: session.completedAt ? new Date(session.completedAt).toISOString() : new Date().toISOString(),
      notes: session.notes ?? null
    }).eq('id', session.id).eq('user_id', userId)
  } else if (session.status === 'abandoned') {
    await supabase.from('workouts').update({
      status: 'abandoned'
    }).eq('id', session.id).eq('user_id', userId)
  }

  for (let i = 0; i < session.exercises.length; i++) {
    const ex = session.exercises[i]
    const exId = exs[i]?.id
    if (!exId) continue

    for (let j = 0; j < ex.sets.length; j++) {
      const set = ex.sets[j]
      const { data: setRows } = await supabase
        .from('workout_sets')
        .select('id')
        .eq('workout_exercise_id', exId)
        .eq('set_number', j + 1)

      if (setRows?.[0]) {
        await supabase.from('workout_sets').update({
          actual_reps: set.actualReps,
          completed_at: set.completed ? new Date().toISOString() : null
        }).eq('id', setRows[0].id)
      }
    }
  }
}

// --- Progression Events ---
export async function addProgressionEvent(userId: string, event: ProgressionEvent): Promise<void> {
  await supabase.from('progression_events').insert({
    user_id: userId,
    lift_name: event.liftName,
    tier: event.tier,
    event_type: event.eventType,
    from_weight: event.fromWeight,
    to_weight: event.toWeight,
    from_stage: event.fromStage,
    to_stage: event.toStage,
    details: event.details ?? null,
    workout_id: event.workoutId ?? null,
    created_at: new Date(event.createdAt).toISOString()
  })
}

export async function getProgressionEvents(userId: string, liftName: string, tier: 'T1' | 'T2'): Promise<ProgressionEvent[]> {
  const { data, error } = await supabase
    .from('progression_events')
    .select('*')
    .eq('user_id', userId)
    .eq('lift_name', liftName)
    .eq('tier', tier)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((r) => ({
    id: r.id,
    liftName: r.lift_name,
    tier: r.tier,
    eventType: r.event_type,
    fromWeight: r.from_weight,
    toWeight: r.to_weight,
    fromStage: r.from_stage,
    toStage: r.to_stage,
    details: r.details ?? undefined,
    workoutId: r.workout_id ?? undefined,
    createdAt: new Date(r.created_at).getTime()
  }))
}

// --- Bodyweight Log ---
export async function upsertBodyweight(userId: string, weight: number, loggedAt: string): Promise<void> {
  await supabase.from('bodyweight_log').upsert(
    { user_id: userId, weight, logged_at: loggedAt },
    { onConflict: 'user_id,logged_at' }
  )
}

export async function getBodyweightLog(userId: string, limit = 90): Promise<{ weight: number; loggedAt: string }[]> {
  const { data, error } = await supabase
    .from('bodyweight_log')
    .select('weight, logged_at')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data.map((r) => ({ weight: r.weight, loggedAt: r.logged_at }))
}

// --- Personal Records ---
export async function addPersonalRecord(userId: string, record: Omit<PersonalRecord, 'id'>): Promise<void> {
  await supabase.from('personal_records').insert({
    user_id: userId,
    exercise_name: record.exerciseName,
    tier: record.tier ?? null,
    record_type: record.recordType,
    value: record.value,
    workout_id: record.workoutId ?? null,
    achieved_at: new Date(record.achievedAt).toISOString()
  })
}

export async function getPersonalRecordsForLift(userId: string, exerciseName: string): Promise<PersonalRecord[]> {
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)

  if (error || !data) return []

  return data.map((r) => ({
    id: r.id,
    exerciseName: r.exercise_name,
    tier: r.tier ?? undefined,
    recordType: r.record_type,
    value: r.value,
    workoutId: r.workout_id ?? undefined,
    achievedAt: new Date(r.achieved_at).getTime()
  }))
}

export async function getAllPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false })

  if (error || !data) return []

  return data.map((r) => ({
    id: r.id,
    exerciseName: r.exercise_name,
    tier: r.tier ?? undefined,
    recordType: r.record_type,
    value: r.value,
    workoutId: r.workout_id ?? undefined,
    achievedAt: new Date(r.achieved_at).getTime()
  }))
}

// --- Load all data (for initial load) ---
export async function loadAllData(userId: string): Promise<{
  profile: UserProfile | null
  setupComplete: boolean
  lastWorkoutDay: WorkoutDay | null
  lastWorkoutDate: string | null
  lifts: Map<string, LiftState>
  t3Lifts: Map<string, T3LiftState>
  activeSession: WorkoutSession | null
}> {
  const [profileRow, lifts, t3Lifts, activeSession] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    getLiftState(userId),
    getT3State(userId),
    getActiveWorkout(userId)
  ])

  const profile = profileRow.data
    ? {
        units: profileRow.data.units as 'lbs' | 'kg',
        t3Exercises: profileRow.data.t3_exercises as Record<WorkoutDay, string[]>,
        restTimerT1: profileRow.data.rest_timer_t1,
        restTimerT2: profileRow.data.rest_timer_t2,
        restTimerT3: profileRow.data.rest_timer_t3,
        dayStructure: (profileRow.data.day_structure as UserProfile['dayStructure']) ?? undefined,
        currentDay: (profileRow.data.current_day as UserProfile['currentDay']) ?? undefined,
        customExercises: (profileRow.data.custom_exercises as UserProfile['customExercises']) ?? undefined,
        xp: profileRow.data.xp ?? 0,
        level: profileRow.data.level ?? 1
      }
    : null

  return {
    profile,
    setupComplete: profileRow.data?.setup_complete ?? false,
    lastWorkoutDay: (profileRow.data?.last_workout_day as WorkoutDay) ?? null,
    lastWorkoutDate: profileRow.data?.last_workout_date ?? null,
    lifts,
    t3Lifts,
    activeSession
  }
}

// --- Ensure profile exists (for new users) ---
export async function ensureProfile(userId: string, defaults: UserProfile): Promise<void> {
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).single()
  if (!data) {
    await supabase.from('profiles').insert({
      id: userId,
      units: defaults.units,
      t3_exercises: defaults.t3Exercises,
      rest_timer_t1: defaults.restTimerT1,
      rest_timer_t2: defaults.restTimerT2,
      rest_timer_t3: defaults.restTimerT3,
      day_structure: defaults.dayStructure ?? { A1: { t1: 'Smith Squat', t2: 'Bench Press' }, B1: { t1: 'Dumbbell OHP', t2: 'Leg Press' }, A2: { t1: 'Bench Press', t2: 'Smith Squat' }, B2: { t1: 'Leg Press', t2: 'Dumbbell OHP' } },
      current_day: defaults.currentDay ?? 'A1',
      custom_exercises: defaults.customExercises ?? [],
      setup_complete: false
    })
  }
}

export { getUserId }
