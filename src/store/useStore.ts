import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import * as api from '../lib/supabaseApi'
import type { WorkoutDay, UserProfile, LiftState, T3LiftState, WorkoutSession, ProgressionEvent, PersonalRecord, DayStructure } from '../types'
import { calcT2FromT1, addWeight } from '../lib/weightUtils'
import { getExerciseDefinition, DEFAULT_DAY_STRUCTURE, DEFAULT_T3_EXERCISES } from '../data/exerciseRegistry'
import { computeT1Progression, computeT2Progression, getSetsFromScheme, getT1Scheme, getT2Scheme } from '../lib/progression'
import { createProgressionEvents } from '../lib/progressionEvents'

const DEFAULT_PROFILE: UserProfile = {
  units: 'lbs',
  t3Exercises: { A1: [...DEFAULT_T3_EXERCISES.A1], B1: [...DEFAULT_T3_EXERCISES.B1], A2: [...DEFAULT_T3_EXERCISES.A2], B2: [...DEFAULT_T3_EXERCISES.B2] },
  restTimerT1: 180,
  restTimerT2: 120,
  restTimerT3: 75,
  dayStructure: DEFAULT_DAY_STRUCTURE as DayStructure
}

function getLiftId(liftName: string, tier: 'T1' | 'T2') {
  return `${liftName}-${tier}`
}

interface AppState {
  userId: string | null
  profile: UserProfile | null
  lifts: Map<string, LiftState>
  t3Lifts: Map<string, T3LiftState>
  setupComplete: boolean
  activeSession: WorkoutSession | null
  lastWorkoutDay: WorkoutDay | null
  lastWorkoutDate: string | null
  isLoading: boolean
  loadData: () => Promise<void>
  saveProfile: (profile: UserProfile) => Promise<void>
  completeSetup: (dayStructure: DayStructure, startingWeights: Record<string, number>, t3Exercises?: Record<WorkoutDay, string[]>) => Promise<void>
  getNextWorkoutDay: () => WorkoutDay
  getActiveSession: () => WorkoutSession | null
  startWorkout: () => Promise<WorkoutSession>
  completeSet: (exerciseIndex: number, setIndex: number, actualReps?: number) => Promise<void>
  completeT3Amrap: (exerciseIndex: number, reps: number) => Promise<void>
  nextExercise: () => void
  finishWorkout: () => Promise<{ exerciseName: string; tier?: string; recordType: string }[]>
  getLiftState: (liftName: string, tier: 'T1' | 'T2') => LiftState | undefined
  getT3State: (liftName: string) => T3LiftState | undefined
  updateLiftOverride: (liftName: string, tier: 'T1' | 'T2', weight: number, stage?: number) => Promise<void>
  updateT3Override: (liftName: string, weight: number) => Promise<void>
  updateT3Exercises: (day: WorkoutDay, exercises: string[]) => Promise<void>
  exportData: () => Promise<string>
  importData: (json: string) => Promise<void>
  resetAll: () => Promise<void>
  logBodyweight: (weight: number) => Promise<void>
  getProgressionEvents: (liftName: string, tier: 'T1' | 'T2') => Promise<ProgressionEvent[]>
  getBodyweightLog: () => Promise<{ weight: number; loggedAt: string }[]>
  getPersonalRecords: () => Promise<PersonalRecord[]>
  getCompletedWorkouts: () => Promise<WorkoutSession[]>
  getWorkoutById: (id: string) => Promise<WorkoutSession | null>
}

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    userId: null,
    profile: null,
    lifts: new Map(),
    t3Lifts: new Map(),
    setupComplete: false,
    activeSession: null,
    lastWorkoutDay: null,
    lastWorkoutDate: null,
    isLoading: true,

    loadData: async () => {
      set({ isLoading: true })
      try {
        const userId = await api.getUserId()
        if (!userId) {
          set({ isLoading: false })
          return
        }

        await api.ensureProfile(userId, DEFAULT_PROFILE)
        const data = await api.loadAllData(userId)

        const profile = data.profile ?? DEFAULT_PROFILE
        const mergedProfile = {
          ...DEFAULT_PROFILE,
          ...profile,
          dayStructure: profile.dayStructure ?? DEFAULT_DAY_STRUCTURE as DayStructure
        }
        set({
          userId,
          profile: mergedProfile,
          lifts: data.lifts,
          t3Lifts: data.t3Lifts,
          setupComplete: data.setupComplete,
          activeSession: data.activeSession,
          lastWorkoutDay: data.lastWorkoutDay,
          lastWorkoutDate: data.lastWorkoutDate,
          isLoading: false
        })
      } catch (e) {
        console.error('Load failed', e)
        set({ isLoading: false })
      }
    },

    saveProfile: async (profile) => {
      const userId = get().userId
      if (!userId) return
      await api.upsertProfile(userId, profile)
      set({ profile })
    },

    completeSetup: async (dayStructure, startingWeights, t3Exercises) => {
      const userId = get().userId
      if (!userId) return

      const profile = get().profile ?? DEFAULT_PROFILE
      const finalProfile = {
        ...profile,
        dayStructure,
        t3Exercises: t3Exercises ?? profile.t3Exercises
      }
      const lifts = new Map<string, LiftState>()

      for (const [liftName, t1Weight] of Object.entries(startingWeights)) {
        const def = getExerciseDefinition(liftName)
        const increment = def?.increment ?? 5
        const rounding = def?.rounding ?? 5
        const t2Weight = calcT2FromT1(t1Weight, rounding)

        lifts.set(getLiftId(liftName, 'T1'), {
          liftName,
          tier: 'T1',
          currentWeight: t1Weight,
          currentStage: 1,
          currentScheme: '5x3',
          increment,
          rounding,
          history: []
        })
        lifts.set(getLiftId(liftName, 'T2'), {
          liftName,
          tier: 'T2',
          currentWeight: t2Weight,
          currentStage: 1,
          currentScheme: '3x10',
          increment,
          rounding,
          history: []
        })
      }

      const newT3Lifts = new Map(get().t3Lifts)
      for (const day of ['A1', 'B1', 'A2', 'B2'] as WorkoutDay[]) {
        for (const name of finalProfile.t3Exercises[day]) {
          if (!newT3Lifts.has(name)) {
            const t3State = { liftName: name, currentWeight: 0, history: [] }
            await api.upsertT3State(userId, name, t3State)
            newT3Lifts.set(name, t3State)
          }
        }
      }

      for (const [id, state] of lifts) {
        await api.upsertLiftState(userId, id, state)
      }
      await api.upsertProfile(userId, finalProfile)
      await api.updateProfileMeta(userId, { setupComplete: true, lastWorkoutDay: 'A1', lastWorkoutDate: '', currentDay: 'A1' })

      set({ lifts, t3Lifts: newT3Lifts, profile: finalProfile, setupComplete: true })
    },

    getNextWorkoutDay: () => {
      const { lastWorkoutDay, lastWorkoutDate } = get()
      const order: WorkoutDay[] = ['A1', 'B1', 'A2', 'B2']
      if (!lastWorkoutDay || !lastWorkoutDate) return order[0]
      const lastIdx = order.indexOf(lastWorkoutDay)
      return order[(lastIdx + 1) % 4]
    },

    getActiveSession: () => get().activeSession,

    startWorkout: async () => {
      const userId = get().userId
      const { profile, lifts, t3Lifts, getNextWorkoutDay } = get()
      if (!userId || !profile) throw new Error('Not authenticated')

      const nextDay = getNextWorkoutDay()
      const today = new Date().toISOString().slice(0, 10)

      const dayStructure = profile.dayStructure ?? DEFAULT_DAY_STRUCTURE as DayStructure
      const { t1, t2 } = dayStructure[nextDay]
      const t1State = lifts.get(getLiftId(t1, 'T1'))
      const t2State = lifts.get(getLiftId(t2, 'T2'))
      const t3Names = profile.t3Exercises[nextDay] ?? []

      const exercises = []
      if (t1State) {
        const scheme = t1State.currentScheme
        exercises.push({
          liftName: t1State.liftName,
          tier: 'T1' as const,
          targetWeight: t1State.currentWeight,
          targetScheme: scheme,
          sets: getSetsFromScheme(scheme).map((targetReps) => ({ targetReps, actualReps: null, completed: false }))
        })
      }
      if (t2State) {
        const scheme = t2State.currentScheme
        exercises.push({
          liftName: t2State.liftName,
          tier: 'T2' as const,
          targetWeight: t2State.currentWeight,
          targetScheme: scheme,
          sets: getSetsFromScheme(scheme).map((targetReps) => ({ targetReps, actualReps: null, completed: false }))
        })
      }
      for (const name of t3Names) {
        const state = t3Lifts.get(name)
        exercises.push({
          liftName: name,
          tier: 'T3' as const,
          targetWeight: state?.currentWeight ?? 0,
          targetScheme: '3x15+',
          sets: [
            { targetReps: 15, actualReps: null, completed: false },
            { targetReps: 15, actualReps: null, completed: false },
            { targetReps: 15, actualReps: null, completed: false }
          ]
        })
      }

      const session: WorkoutSession = {
        id: crypto.randomUUID(),
        day: nextDay,
        date: today,
        startTime: Date.now(),
        exercises,
        status: 'in_progress'
      }

      await api.createWorkout(userId, session)
      set({ activeSession: session })
      return session
    },

    completeSet: async (exerciseIndex, setIndex, actualReps) => {
      const userId = get().userId
      const session = get().activeSession
      if (!userId || !session) return

      const ex = session.exercises[exerciseIndex]
      if (!ex) return

      const targetReps = ex.sets[setIndex].targetReps
      const reps = actualReps ?? targetReps
      const completed = reps >= targetReps

      const newExercises = [...session.exercises]
      const newSets = [...newExercises[exerciseIndex].sets]
      newSets[setIndex] = { targetReps, actualReps: reps, completed }
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets }

      const updated = { ...session, exercises: newExercises }
      await api.updateWorkout(userId, updated)
      set({ activeSession: updated })
    },

    completeT3Amrap: async (exerciseIndex, reps) => {
      const userId = get().userId
      const session = get().activeSession
      if (!userId || !session) return

      const ex = session.exercises[exerciseIndex]
      if (!ex || ex.tier !== 'T3') return

      const newExercises = [...session.exercises]
      const newSets = [...newExercises[exerciseIndex].sets]
      newSets[2] = { targetReps: 15, actualReps: reps, completed: true }
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets }

      const updated = { ...session, exercises: newExercises }
      await api.updateWorkout(userId, updated)
      set({ activeSession: updated })
    },

    nextExercise: () => set({ activeSession: get().activeSession }),

    finishWorkout: async () => {
      const userId = get().userId
      const session = get().activeSession
      if (!userId || !session) return []

      const { profile, lifts, t3Lifts } = get()
      if (!profile) return []

      const newLifts = new Map(lifts)
      const newT3Lifts = new Map(t3Lifts)
      const prsHit: { exerciseName: string; tier?: string; recordType: string }[] = []

      for (const ex of session.exercises) {
        if (ex.tier === 'T1') {
          const state = lifts.get(getLiftId(ex.liftName, 'T1'))
          if (state) {
            const allCompleted = ex.sets.every((s) => s.completed && (s.actualReps ?? 0) >= s.targetReps)
            const rounding = state.rounding ?? 5
            const result = computeT1Progression(state.currentWeight, state.currentStage, allCompleted, state.increment, rounding)
            const setsCompleted = ex.sets.map((s) => s.actualReps ?? 0)
            const events = createProgressionEvents(ex.liftName, 'T1', allCompleted, state.currentWeight, state.currentStage, result, session.id, setsCompleted, state.currentScheme)
            for (const ev of events) await api.addProgressionEvent(userId, ev)

            const updated: LiftState = {
              ...state,
              currentWeight: result.newWeight,
              currentStage: result.newStage,
              currentScheme: result.newScheme,
              history: [...state.history, { date: session.date, weight: ex.targetWeight, stage: state.currentStage, scheme: state.currentScheme, setsCompleted, completed: allCompleted }]
            }
            newLifts.set(getLiftId(ex.liftName, 'T1'), updated)
            await api.upsertLiftState(userId, getLiftId(ex.liftName, 'T1'), updated)

            const volume = ex.targetWeight * setsCompleted.reduce((a, b) => a + b, 0)
            const weightRecords = await api.getPersonalRecordsForLift(userId, ex.liftName)
            const bestWeight = weightRecords.filter((r) => r.recordType === 'weight').reduce((m, r) => Math.max(m, r.value), 0)
            const bestVol = weightRecords.filter((r) => r.recordType === 'volume').reduce((m, r) => Math.max(m, r.value), 0)
            if (ex.targetWeight > bestWeight) {
              await api.addPersonalRecord(userId, { exerciseName: ex.liftName, tier: 'T1', recordType: 'weight', value: ex.targetWeight, workoutId: session.id, achievedAt: Date.now() })
              prsHit.push({ exerciseName: ex.liftName, tier: 'T1', recordType: 'weight' })
            }
            if (volume > bestVol) {
              await api.addPersonalRecord(userId, { exerciseName: ex.liftName, tier: 'T1', recordType: 'volume', value: volume, workoutId: session.id, achievedAt: Date.now() })
              prsHit.push({ exerciseName: ex.liftName, tier: 'T1', recordType: 'volume' })
            }
          }
        } else if (ex.tier === 'T2') {
          const state = lifts.get(getLiftId(ex.liftName, 'T2'))
          if (state) {
            const allCompleted = ex.sets.every((s) => s.completed && (s.actualReps ?? 0) >= s.targetReps)
            const rounding = state.rounding ?? 5
            const result = computeT2Progression(state.currentWeight, state.currentStage, allCompleted, state.increment, rounding)
            const setsCompleted = ex.sets.map((s) => s.actualReps ?? 0)
            const events = createProgressionEvents(ex.liftName, 'T2', allCompleted, state.currentWeight, state.currentStage, result, session.id, setsCompleted, state.currentScheme)
            for (const ev of events) await api.addProgressionEvent(userId, ev)

            const updated: LiftState = {
              ...state,
              currentWeight: result.newWeight,
              currentStage: result.newStage,
              currentScheme: result.newScheme,
              history: [...state.history, { date: session.date, weight: ex.targetWeight, stage: state.currentStage, scheme: state.currentScheme, setsCompleted, completed: allCompleted }]
            }
            newLifts.set(getLiftId(ex.liftName, 'T2'), updated)
            await api.upsertLiftState(userId, getLiftId(ex.liftName, 'T2'), updated)

            const volume = ex.targetWeight * setsCompleted.reduce((a, b) => a + b, 0)
            const t2Key = ex.liftName + '-T2'
            const weightRecords = await api.getPersonalRecordsForLift(userId, t2Key)
            const bestWeight = weightRecords.filter((r) => r.recordType === 'weight').reduce((m, r) => Math.max(m, r.value), 0)
            const bestVol = weightRecords.filter((r) => r.recordType === 'volume').reduce((m, r) => Math.max(m, r.value), 0)
            if (ex.targetWeight > bestWeight) {
              await api.addPersonalRecord(userId, { exerciseName: t2Key, tier: 'T2', recordType: 'weight', value: ex.targetWeight, workoutId: session.id, achievedAt: Date.now() })
              prsHit.push({ exerciseName: ex.liftName, tier: 'T2', recordType: 'weight' })
            }
            if (volume > bestVol) {
              await api.addPersonalRecord(userId, { exerciseName: t2Key, tier: 'T2', recordType: 'volume', value: volume, workoutId: session.id, achievedAt: Date.now() })
              prsHit.push({ exerciseName: ex.liftName, tier: 'T2', recordType: 'volume' })
            }
          }
        } else if (ex.tier === 'T3') {
          const state = t3Lifts.get(ex.liftName)
          const amrapReps = ex.sets[2]?.actualReps ?? 0
          const amrapHit25 = amrapReps >= 25
          const increment = state?.increment ?? 5
          const rounding = 5
          const newWeight = amrapHit25 && state
            ? addWeight(state.currentWeight, increment, rounding)
            : (state?.currentWeight ?? ex.targetWeight)

          const updated: T3LiftState = {
            liftName: ex.liftName,
            currentWeight: newWeight,
            increment,
            history: [...(state?.history ?? []), { date: session.date, weight: ex.targetWeight, setsCompleted: ex.sets.map((s) => s.actualReps ?? 0), amrapHit25 }]
          }
          newT3Lifts.set(ex.liftName, updated)
          await api.upsertT3State(userId, ex.liftName, updated)
        }
      }

      const completedSession = { ...session, status: 'completed' as const, completedAt: Date.now() }
      await api.updateWorkout(userId, completedSession)
      await api.updateProfileMeta(userId, { lastWorkoutDay: session.day, lastWorkoutDate: session.date })

      set({ activeSession: null, lifts: newLifts, t3Lifts: newT3Lifts, lastWorkoutDay: session.day, lastWorkoutDate: session.date })
      return prsHit
    },

    getLiftState: (liftName, tier) => get().lifts.get(getLiftId(liftName, tier)),
    getT3State: (liftName) => get().t3Lifts.get(liftName),

    updateLiftOverride: async (liftName, tier, weight, stage) => {
      const userId = get().userId
      const state = get().lifts.get(getLiftId(liftName, tier))
      if (!userId || !state) return
      const updated = { ...state, currentWeight: weight, ...(stage !== undefined && { currentStage: stage as 1 | 2 | 3, currentScheme: tier === 'T1' ? getT1Scheme(stage) : getT2Scheme(stage) }) }
      await api.upsertLiftState(userId, getLiftId(liftName, tier), updated)
      set((s) => {
        const m = new Map(s.lifts)
        m.set(getLiftId(liftName, tier), updated)
        return { lifts: m }
      })
    },

    updateT3Override: async (liftName, weight) => {
      const userId = get().userId
      const state = get().t3Lifts.get(liftName)
      if (!userId) return
      const updated = { liftName, currentWeight: weight, history: state?.history ?? [] }
      await api.upsertT3State(userId, liftName, updated)
      set((s) => {
        const m = new Map(s.t3Lifts)
        m.set(liftName, updated)
        return { t3Lifts: m }
      })
    },

    updateT3Exercises: async (day, exercises) => {
      const userId = get().userId
      const profile = get().profile ?? DEFAULT_PROFILE
      if (!userId) return
      const updated = { ...profile, t3Exercises: { ...profile.t3Exercises, [day]: exercises } }
      await api.upsertProfile(userId, updated)
      set({ profile: updated })
    },

    exportData: async () => {
      const userId = get().userId
      if (!userId) return '{}'
      const [profile, lifts, t3Lifts, sessions] = await Promise.all([
        api.getProfile(userId),
        api.getLiftState(userId),
        api.getT3State(userId),
        api.getCompletedWorkouts(userId)
      ])
      const liftArr = Array.from(lifts.entries()).map(([id, s]) => ({ ...s, id }))
      const t3Arr = Array.from(t3Lifts.entries()).map(([id, s]) => ({ ...s, id }))
      return JSON.stringify({
        profile: profile ? [{ ...profile, id: 'default' }] : [],
        lifts: liftArr,
        t3Lifts: t3Arr,
        sessions,
        exportedAt: new Date().toISOString()
      })
    },

    importData: async (json) => {
      const userId = get().userId
      if (!userId) return
      const data = JSON.parse(json)
      if (data.profile?.[0]) {
        const p = data.profile[0]
        await api.upsertProfile(userId, {
          units: p.units,
          t3Exercises: p.t3Exercises,
          restTimerT1: p.restTimerT1,
          restTimerT2: p.restTimerT2,
          restTimerT3: p.restTimerT3,
          dayStructure: p.dayStructure,
          currentDay: p.currentDay,
          customExercises: p.customExercises
        })
      }
      if (data.lifts?.length) {
        for (const r of data.lifts) {
          const { id, ...rest } = r
          await api.upsertLiftState(userId, id, rest)
        }
      }
      if (data.t3Lifts?.length) {
        for (const r of data.t3Lifts) {
          const { id, ...rest } = r
          await api.upsertT3State(userId, rest.liftName, rest)
        }
      }
      await get().loadData()
    },

    resetAll: async () => {
      const userId = get().userId
      if (!userId) return
      const { data: workouts } = await supabase.from('workouts').select('id').eq('user_id', userId)
      for (const w of workouts ?? []) {
        await supabase.from('workouts').delete().eq('id', w.id)
      }
      await supabase.from('lift_state').delete().eq('user_id', userId)
      await supabase.from('t3_state').delete().eq('user_id', userId)
      await supabase.from('progression_events').delete().eq('user_id', userId)
      await supabase.from('bodyweight_log').delete().eq('user_id', userId)
      await supabase.from('personal_records').delete().eq('user_id', userId)
      await api.updateProfileMeta(userId, { setupComplete: false, lastWorkoutDay: undefined, lastWorkoutDate: undefined })
      set({ profile: null, lifts: new Map(), t3Lifts: new Map(), setupComplete: false, activeSession: null })
    },

    logBodyweight: async (weight) => {
      const userId = get().userId
      if (!userId) return
      const today = new Date().toISOString().slice(0, 10)
      await api.upsertBodyweight(userId, weight, today)
    },

    getProgressionEvents: async (liftName, tier) => {
      const userId = get().userId
      if (!userId) return []
      return api.getProgressionEvents(userId, liftName, tier)
    },

    getBodyweightLog: async () => {
      const userId = get().userId
      if (!userId) return []
      return api.getBodyweightLog(userId)
    },

    getPersonalRecords: async () => {
      const userId = get().userId
      if (!userId) return []
      const records = await api.getAllPersonalRecords(userId)
      const byKey = new Map<string, PersonalRecord>()
      for (const r of records) {
        const key = `${r.exerciseName}-${r.recordType}`
        if (!byKey.has(key)) byKey.set(key, r)
      }
      return Array.from(byKey.values())
    },

    getCompletedWorkouts: async () => {
      const userId = get().userId
      if (!userId) return []
      return api.getCompletedWorkouts(userId)
    },

    getWorkoutById: async (id) => {
      const userId = get().userId
      if (!userId) return null
      return api.getWorkoutById(userId, id)
    }
  }))
)
