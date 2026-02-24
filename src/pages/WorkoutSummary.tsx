import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { computeT1Progression, computeT2Progression } from '../lib/progression'
import { hapticWorkoutComplete, hapticPR, hapticTap } from '../lib/haptic'
import type { WorkoutExercise } from '../types'

export default function WorkoutSummary() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, getLiftState } = useStore()
  const { session, prs, xpEarned } = (location.state as { session?: { day: string; date: string; exercises: WorkoutExercise[] }; prs?: { exerciseName: string; tier?: string; recordType: string }[]; xpEarned?: number }) ?? {}

  useEffect(() => {
    if (session) {
      hapticWorkoutComplete()
      if (prs && prs.length > 0) hapticPR()
    }
  }, [session, prs])

  const handleDone = () => {
    hapticTap()
    navigate('/')
  }

  if (!session) {
    navigate('/')
    return null
  }

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Workout Complete — Day {session.day}</h1>
      <p className="text-[var(--color-text-secondary)] text-sm mb-2">{session.date}</p>
      {xpEarned != null && xpEarned > 0 && (
        <p className="text-[var(--color-accent-active)] text-sm font-medium mb-4">+{xpEarned} XP</p>
      )}
      {prs && prs.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-900/30 border border-amber-600/50">
          <p className="text-amber-400 font-semibold">🏆 New PR{prs.length > 1 ? 's' : ''}!</p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            {prs.map((p) => `${p.exerciseName} ${p.recordType}`).join(', ')}
          </p>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {session.exercises.map((ex) => {
          if (ex.tier === 'T1') {
            const state = getLiftState(ex.liftName, 'T1')
            const completed = ex.sets.every((s) => s.completed && (s.actualReps ?? 0) >= s.targetReps)
            const rounding = state?.rounding ?? 5
            const result = state
              ? computeT1Progression(ex.targetWeight, state.currentStage, completed, state.increment, rounding)
              : null
            return (
              <div key={ex.liftName} className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50">
                <h3 className="font-semibold text-[var(--color-text-primary)]">{ex.liftName} (T1)</h3>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                  {ex.targetWeight} {profile?.units} × {ex.targetScheme} — {completed ? 'All sets completed ✅' : 'Missed reps ❌'}
                </p>
                {result && (
                  <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                    → Next session: {result.newWeight} {profile?.units} ({result.newScheme}) — {result.message}
                  </p>
                )}
              </div>
            )
          }
          if (ex.tier === 'T2') {
            const state = getLiftState(ex.liftName, 'T2')
            const completed = ex.sets.every((s) => s.completed && (s.actualReps ?? 0) >= s.targetReps)
            const rounding = state?.rounding ?? 5
            const result = state
              ? computeT2Progression(ex.targetWeight, state.currentStage, completed, state.increment, rounding)
              : null
            return (
              <div key={ex.liftName} className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50">
                <h3 className="font-semibold text-[var(--color-text-primary)]">{ex.liftName} (T2)</h3>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                  {ex.targetWeight} {profile?.units} × {ex.targetScheme} — {completed ? 'All sets completed ✅' : 'Missed reps ❌'}
                </p>
                {result && (
                  <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                    → Next session: {result.newWeight} {profile?.units} ({result.newScheme}) — {result.message}
                  </p>
                )}
              </div>
            )
          }
          const amrap = ex.sets[2]?.actualReps ?? 0
          const hit25 = amrap >= 25
          const t3State = useStore.getState().getT3State(ex.liftName)
          const nextWeight = hit25 && t3State ? t3State.currentWeight : ex.targetWeight
          return (
            <div key={ex.liftName} className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50">
              <h3 className="font-semibold text-[var(--color-text-primary)]">{ex.liftName} (T3)</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                {ex.targetWeight} {profile?.units} × {ex.sets.map((s) => s.actualReps ?? s.targetReps).join(', ')} (AMRAP)
                {hit25 && ' 🎉'}
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                → Next session: {hit25 ? `${nextWeight} ${profile?.units} — AMRAP threshold reached!` : `same weight — hit 25 on AMRAP to increase`}
              </p>
            </div>
          )
        })}
      </div>

      <button
        onClick={handleDone}
        className="w-full py-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl"
      >
        Done
      </button>
    </div>
  )
}
