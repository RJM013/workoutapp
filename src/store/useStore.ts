import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { db, META_KEYS } from '../lib/db'
import { pullFromSupabase, pushToSupabase } from '../lib/supabaseSync'
import type { WorkoutDay, UserProfile, LiftState, T3LiftState, WorkoutSession, ProgressionEvent, PersonalRecord } from '../types'
import { DAY_STRUCTURE } from '../types'
import { getIncrement } from '../lib/weightUtils'
import { computeT1Progression, computeT2Progression, getSetsFromScheme, getT1Scheme, getT2Scheme } from '../lib/progression'
import { createProgressionEvents } from '../lib/progressionEvents'

const DEFAULT_PROFILE: UserProfile = {
  units: 'lbs',
  t3Exercises: {
    A1: ['Lat Pulldown', 'Face Pull'],
    B1: ['Dumbbell Row', 'Bicep Curl'],
    A2: ['Lat Pulldown', 'Cable Crunch'],
    B2: ['Dumbbell Row', 'Lateral Raise']
  },
  restTimerT1: 180,
  restTimerT2: 150,
  restTimerT3: 75
}

function getLiftId(liftName: string, tier: 'T1' | 'T2') {
  return `${liftName}-${tier}`
}

interface AppState {
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
  completeSetup: (startingWeights: Record<string, number>, t3Exercises?: Record<WorkoutDay, string[]>) => Promise<void>
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
}

export const useStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
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
        await pullFromSupabase()
        const [profileRecord, liftRecords, t3Records, setupMeta, lastDayMeta, lastDateMeta] = await Promise.all([
          db.profile.get('default'),
          db.lifts.toArray(),
          db.t3Lifts.toArray(),
          db.meta.get(META_KEYS.SETUP_COMPLETE),
          db.meta.get(META_KEYS.LAST_WORKOUT_DAY),
          db.meta.get(META_KEYS.LAST_WORKOUT_DATE)
        ])

        const profile = profileRecord ? { ...profileRecord, id: undefined } as UserProfile : DEFAULT_PROFILE
        const lifts = new Map<string, LiftState>()
        for (const r of liftRecords) {
          const { id, ...rest } = r
          lifts.set(id, rest as LiftState)
        }
        const t3Lifts = new Map<string, T3LiftState>()
        for (const r of t3Records) {
          const { id, ...rest } = r
          t3Lifts.set(id, rest as T3LiftState)
        }

        const activeSession = await db.sessions.where('status').equals('in_progress').first()

        set({
          profile,
          lifts,
          t3Lifts,
          setupComplete: !!setupMeta?.value,
          activeSession: activeSession ?? null,
          lastWorkoutDay: (lastDayMeta?.value as WorkoutDay) ?? null,
          lastWorkoutDate: (lastDateMeta?.value as string) ?? null,
          isLoading: false
        })
      } catch (e) {
        console.error('Load failed', e)
        set({ isLoading: false })
      }
    },

    saveProfile: async (profile) => {
      await db.profile.put({ ...profile, id: 'default' })
      set({ profile })
      pushToSupabase().catch(() => {})
    },

    completeSetup: async (startingWeights, t3Exercises) => {
      const profile = get().profile ?? DEFAULT_PROFILE
      const finalProfile = t3Exercises
        ? { ...profile, t3Exercises }
        : profile
      const lifts = new Map<string, LiftState>()

      for (const [liftName, weight] of Object.entries(startingWeights)) {
        const increment = getIncrement(liftName, finalProfile.units)
        const t2Weight = Math.floor(weight * 0.65 / 5) * 5
        lifts.set(getLiftId(liftName, 'T1'), {
          liftName,
          tier: 'T1',
          currentWeight: weight,
          currentStage: 1,
          currentScheme: '5x3',
          increment,
          history: []
        })
        lifts.set(getLiftId(liftName, 'T2'), {
          liftName,
          tier: 'T2',
          currentWeight: t2Weight,
          currentStage: 1,
          currentScheme: '3x10',
          increment,
          history: []
        })
      }

      const newT3Lifts = new Map(get().t3Lifts)
      for (const day of ['A1', 'B1', 'A2', 'B2'] as WorkoutDay[]) {
        for (const name of finalProfile.t3Exercises[day]) {
          const id = name
          if (!newT3Lifts.has(id)) {
            const t3State = { liftName: name, currentWeight: 0, history: [] }
            await db.t3Lifts.put({ ...t3State, id })
            newT3Lifts.set(id, t3State)
          }
        }
      }

      for (const [id, state] of lifts) {
        await db.lifts.put({ ...state, id })
      }
      await db.profile.put({ ...finalProfile, id: 'default' })
      await db.meta.put({ key: META_KEYS.SETUP_COMPLETE, value: true })
      await db.meta.put({ key: META_KEYS.LAST_WORKOUT_DAY, value: 'A1' })
      await db.meta.put({ key: META_KEYS.LAST_WORKOUT_DATE, value: '' })

      set({ lifts, t3Lifts: newT3Lifts, profile: finalProfile, setupComplete: true })
      pushToSupabase().catch(() => {})
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
      const { profile, lifts, t3Lifts, getNextWorkoutDay } = get()
      if (!profile) throw new Error('No profile')

      const nextDay = getNextWorkoutDay()
      const today = new Date().toISOString().slice(0, 10)

      const { t1, t2 } = DAY_STRUCTURE[nextDay]
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
          sets: getSetsFromScheme(scheme).map((targetReps) => ({
            targetReps,
            actualReps: null,
            completed: false
          }))
        })
      }
      if (t2State) {
        const scheme = t2State.currentScheme
        exercises.push({
          liftName: t2State.liftName,
          tier: 'T2' as const,
          targetWeight: t2State.currentWeight,
          targetScheme: scheme,
          sets: getSetsFromScheme(scheme).map((targetReps) => ({
            targetReps,
            actualReps: null,
            completed: false
          }))
        })
      }
      for (const name of t3Names) {
        const state = t3Lifts.get(name)
        const weight = state?.currentWeight ?? 0
        exercises.push({
          liftName: name,
          tier: 'T3' as const,
          targetWeight: weight,
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

      await db.sessions.add(session)
      set({ activeSession: session })
      pushToSupabase().catch(() => {})
      return session
    },

    completeSet: async (exerciseIndex, setIndex, actualReps) => {
      const session = get().activeSession
      if (!session) return

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
      await db.sessions.put(updated)
      set({ activeSession: updated })
      pushToSupabase().catch(() => {})
    },

    completeT3Amrap: async (exerciseIndex, reps) => {
      const session = get().activeSession
      if (!session) return

      const ex = session.exercises[exerciseIndex]
      if (!ex || ex.tier !== 'T3') return

      const newExercises = [...session.exercises]
      const newSets = [...newExercises[exerciseIndex].sets]
      newSets[2] = { targetReps: 15, actualReps: reps, completed: true }
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets }

      const updated = { ...session, exercises: newExercises }
      await db.sessions.put(updated)
      set({ activeSession: updated })
      pushToSupabase().catch(() => {})
    },

    nextExercise: () => {
      set({ activeSession: get().activeSession })
    },

    finishWorkout: async () => {
      const session = get().activeSession
      if (!session) return []

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
            const result = computeT1Progression(
              state.currentWeight,
              state.currentStage,
              allCompleted,
              state.increment
            )
            const setsCompleted = ex.sets.map((s) => s.actualReps ?? 0)
            const events = createProgressionEvents(
              ex.liftName,
              'T1',
              allCompleted,
              state.currentWeight,
              state.currentStage,
              result,
              session.id,
              setsCompleted,
              state.currentScheme
            )
            for (const ev of events) await db.progressionEvents.add(ev)

            const updated: LiftState = {
              ...state,
              currentWeight: result.newWeight,
              currentStage: result.newStage,
              currentScheme: result.newScheme,
              history: [
                ...state.history,
                {
                  date: session.date,
                  weight: ex.targetWeight,
                  stage: state.currentStage,
                  scheme: state.currentScheme,
                  setsCompleted,
                  completed: allCompleted
                }
              ]
            }
            newLifts.set(getLiftId(ex.liftName, 'T1'), updated)
            await db.lifts.put({ ...updated, id: getLiftId(ex.liftName, 'T1') })

            const volume = ex.targetWeight * setsCompleted.reduce((a, b) => a + b, 0)
            const weightRecords = (await db.personalRecords.where('exerciseName').equals(ex.liftName).toArray())
              .filter((r) => r.recordType === 'weight')
            const volRecords = (await db.personalRecords.where('exerciseName').equals(ex.liftName).toArray())
              .filter((r) => r.recordType === 'volume')
            const bestWeight = weightRecords.length ? Math.max(...weightRecords.map((r) => r.value)) : 0
            const bestVol = volRecords.length ? Math.max(...volRecords.map((r) => r.value)) : 0
            if (ex.targetWeight > bestWeight) {
              await db.personalRecords.add({
                id: crypto.randomUUID(),
                exerciseName: ex.liftName,
                tier: 'T1',
                recordType: 'weight',
                value: ex.targetWeight,
                workoutId: session.id,
                achievedAt: Date.now()
              })
              prsHit.push({ exerciseName: ex.liftName, tier: 'T1', recordType: 'weight' })
            }
            if (volume > bestVol) {
              await db.personalRecords.add({
                id: crypto.randomUUID(),
                exerciseName: ex.liftName,
                tier: 'T1',
                recordType: 'volume',
                value: volume,
                workoutId: session.id,
                achievedAt: Date.now()
              })
              prsHit.push({ exerciseName: ex.liftName, tier: 'T1', recordType: 'volume' })
            }
          }
        } else if (ex.tier === 'T2') {
          const state = lifts.get(getLiftId(ex.liftName, 'T2'))
          if (state) {
            const allCompleted = ex.sets.every((s) => s.completed && (s.actualReps ?? 0) >= s.targetReps)
            const result = computeT2Progression(
              state.currentWeight,
              state.currentStage,
              allCompleted,
              state.increment
            )
            const setsCompleted = ex.sets.map((s) => s.actualReps ?? 0)
            const events = createProgressionEvents(
              ex.liftName,
              'T2',
              allCompleted,
              state.currentWeight,
              state.currentStage,
              result,
              session.id,
              setsCompleted,
              state.currentScheme
            )
            for (const ev of events) await db.progressionEvents.add(ev)

            const updated: LiftState = {
              ...state,
              currentWeight: result.newWeight,
              currentStage: result.newStage,
              currentScheme: result.newScheme,
              history: [
                ...state.history,
                {
                  date: session.date,
                  weight: ex.targetWeight,
                  stage: state.currentStage,
                  scheme: state.currentScheme,
                  setsCompleted,
                  completed: allCompleted
                }
              ]
            }
            newLifts.set(getLiftId(ex.liftName, 'T2'), updated)
            await db.lifts.put({ ...updated, id: getLiftId(ex.liftName, 'T2') })

            const volume = ex.targetWeight * setsCompleted.reduce((a, b) => a + b, 0)
            const t2Key = ex.liftName + '-T2'
            const weightRecords = (await db.personalRecords.where('exerciseName').equals(t2Key).toArray())
              .filter((r) => r.recordType === 'weight')
            const volRecords = (await db.personalRecords.where('exerciseName').equals(t2Key).toArray())
              .filter((r) => r.recordType === 'volume')
            const bestWeight = weightRecords.length ? Math.max(...weightRecords.map((r) => r.value)) : 0
            const bestVol = volRecords.length ? Math.max(...volRecords.map((r) => r.value)) : 0
            if (ex.targetWeight > bestWeight) {
              await db.personalRecords.add({
                id: crypto.randomUUID(),
                exerciseName: ex.liftName + '-T2',
                tier: 'T2',
                recordType: 'weight',
                value: ex.targetWeight,
                workoutId: session.id,
                achievedAt: Date.now()
              })
              prsHit.push({ exerciseName: ex.liftName, tier: 'T2', recordType: 'weight' })
            }
            if (volume > bestVol) {
              await db.personalRecords.add({
                id: crypto.randomUUID(),
                exerciseName: ex.liftName + '-T2',
                tier: 'T2',
                recordType: 'volume',
                value: volume,
                workoutId: session.id,
                achievedAt: Date.now()
              })
              prsHit.push({ exerciseName: ex.liftName, tier: 'T2', recordType: 'volume' })
            }
          }
        } else if (ex.tier === 'T3') {
          const state = t3Lifts.get(ex.liftName)
          const amrapReps = ex.sets[2]?.actualReps ?? 0
          const amrapHit25 = amrapReps >= 25
          const newWeight = amrapHit25 && state ? state.currentWeight + 5 : (state?.currentWeight ?? ex.targetWeight)

          const updated: T3LiftState = {
            liftName: ex.liftName,
            currentWeight: newWeight,
            history: [
              ...(state?.history ?? []),
              {
                date: session.date,
                weight: ex.targetWeight,
                setsCompleted: ex.sets.map((s) => s.actualReps ?? 0),
                amrapHit25
              }
            ]
          }
          newT3Lifts.set(ex.liftName, updated)
          await db.t3Lifts.put({ ...updated, id: ex.liftName })
        }
      }

      const completedSession = {
        ...session,
        status: 'completed' as const,
        completedAt: Date.now()
      }
      await db.sessions.put(completedSession)
      await db.meta.put({ key: META_KEYS.LAST_WORKOUT_DAY, value: session.day })
      await db.meta.put({ key: META_KEYS.LAST_WORKOUT_DATE, value: session.date })

      set({
        activeSession: null,
        lifts: newLifts,
        t3Lifts: newT3Lifts,
        lastWorkoutDay: session.day,
        lastWorkoutDate: session.date
      })
      pushToSupabase().catch(() => {})
      return prsHit
    },

    getLiftState: (liftName, tier) => get().lifts.get(getLiftId(liftName, tier)),
    getT3State: (liftName) => get().t3Lifts.get(liftName),

    updateLiftOverride: async (liftName, tier, weight, stage) => {
      const state = get().lifts.get(getLiftId(liftName, tier))
      if (!state) return
      const updated = {
        ...state,
        currentWeight: weight,
        ...(stage !== undefined && { currentStage: stage as 1 | 2 | 3, currentScheme: tier === 'T1' ? getT1Scheme(stage) : getT2Scheme(stage) })
      }
      await db.lifts.put({ ...updated, id: getLiftId(liftName, tier) })
      set((s) => {
        const m = new Map(s.lifts)
        m.set(getLiftId(liftName, tier), updated)
        return { lifts: m }
      })
      pushToSupabase().catch(() => {})
    },

    updateT3Override: async (liftName, weight) => {
      const state = get().t3Lifts.get(liftName)
      const updated = { liftName, currentWeight: weight, history: state?.history ?? [] }
      await db.t3Lifts.put({ ...updated, id: liftName })
      set((s) => {
        const m = new Map(s.t3Lifts)
        m.set(liftName, updated)
        return { t3Lifts: m }
      })
      pushToSupabase().catch(() => {})
    },

    updateT3Exercises: async (day, exercises) => {
      const profile = get().profile ?? DEFAULT_PROFILE
      const updated = { ...profile, t3Exercises: { ...profile.t3Exercises, [day]: exercises } }
      await db.profile.put({ ...updated, id: 'default' })
      set({ profile: updated })
      pushToSupabase().catch(() => {})
    },

    exportData: async () => {
      const [profile, lifts, t3Lifts, sessions, progressionEvents, bodyweightLog, personalRecords] = await Promise.all([
        db.profile.toArray(),
        db.lifts.toArray(),
        db.t3Lifts.toArray(),
        db.sessions.toArray(),
        db.progressionEvents?.toArray().catch(() => []) ?? [],
        db.bodyweightLog?.toArray().catch(() => []) ?? [],
        db.personalRecords?.toArray().catch(() => []) ?? []
      ])
      return JSON.stringify({
        profile,
        lifts,
        t3Lifts,
        sessions,
        progressionEvents: progressionEvents || [],
        bodyweightLog: bodyweightLog || [],
        personalRecords: personalRecords || [],
        exportedAt: new Date().toISOString()
      })
    },

    importData: async (json) => {
      const data = JSON.parse(json)
      if (data.profile) await db.profile.bulkPut(data.profile)
      if (data.lifts) await db.lifts.bulkPut(data.lifts)
      if (data.t3Lifts) await db.t3Lifts.bulkPut(data.t3Lifts)
      if (data.sessions) await db.sessions.bulkPut(data.sessions)
      if (data.progressionEvents?.length) await db.progressionEvents.bulkPut(data.progressionEvents)
      if (data.bodyweightLog?.length) await db.bodyweightLog.bulkPut(data.bodyweightLog)
      if (data.personalRecords?.length) await db.personalRecords.bulkPut(data.personalRecords)
      await get().loadData()
      pushToSupabase().catch(() => {})
    },

    resetAll: async () => {
      await db.profile.clear()
      await db.lifts.clear()
      await db.t3Lifts.clear()
      await db.sessions.clear()
      await db.meta.clear()
      if (db.progressionEvents) await db.progressionEvents.clear()
      if (db.bodyweightLog) await db.bodyweightLog.clear()
      if (db.personalRecords) await db.personalRecords.clear()
      set({
        profile: null,
        lifts: new Map(),
        t3Lifts: new Map(),
        setupComplete: false,
        activeSession: null
      })
    },

    logBodyweight: async (weight) => {
      const today = new Date().toISOString().slice(0, 10)
      await db.bodyweightLog.put({ id: today, weight, loggedAt: today })
      pushToSupabase().catch(() => {})
    },

    getProgressionEvents: async (liftName, tier) => {
      const all = await db.progressionEvents
        .where('liftName')
        .equals(liftName)
        .toArray()
      return all
        .filter((e) => e.tier === tier)
        .sort((a, b) => b.createdAt - a.createdAt)
    },

    getBodyweightLog: async () => {
      const logs = await db.bodyweightLog.orderBy('loggedAt').reverse().limit(90).toArray()
      return logs.map((l) => ({ weight: l.weight, loggedAt: l.loggedAt }))
    },

    getPersonalRecords: async () => {
      const records = await db.personalRecords.orderBy('achievedAt').reverse().toArray()
      const byKey = new Map<string, PersonalRecord>()
      for (const r of records) {
        const key = `${r.exerciseName}-${r.recordType}`
        if (!byKey.has(key)) byKey.set(key, r)
      }
      return Array.from(byKey.values())
    }
  }))
)
