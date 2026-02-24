import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import RestTimer from '../components/RestTimer'
import ExerciseInfoModal from '../components/ExerciseInfoModal'
import PlateCalculator from '../components/PlateCalculator'
import WarmUpSection from '../components/WarmUpSection'
import { getExerciseDefinition } from '../data/exerciseRegistry'
import { computeT1Progression, computeT2Progression } from '../lib/progression'
import { formatWeightForDisplay } from '../lib/weightUtils'
import { hapticSetComplete, hapticExerciseComplete } from '../lib/haptic'
import type { WorkoutExercise } from '../types'

function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Workout() {
  const navigate = useNavigate()
  const { activeSession, profile, completeSet, completeT3Amrap, finishWorkout, abandonWorkout } = useStore()
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [restActive, setRestActive] = useState(false)
  const [restDuration, setRestDuration] = useState(180)
  const [editingSet, setEditingSet] = useState<{ ex: number; set: number } | null>(null)
  const [editReps, setEditReps] = useState('')
  const [showExerciseInfo, setShowExerciseInfo] = useState(false)
  const [showPlateCalc, setShowPlateCalc] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const hapticEnabled = typeof localStorage !== 'undefined' && localStorage.getItem('hapticEnabled') !== 'false'

  useEffect(() => {
    if (!activeSession) return
    const start = activeSession.startTime
    const tick = () => setElapsed(Date.now() - start)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeSession])

  const session = activeSession
  if (!session) return null

  const ex = session.exercises[exerciseIndex] as WorkoutExercise | undefined
  const isLastExercise = exerciseIndex >= session.exercises.length - 1
  const allSetsDone = ex?.sets.every((s) => s.completed) ?? false

  const progressionMessage = (() => {
    if (!ex || !allSetsDone) return null
    const completed = ex.sets.every((s) => s.completed && (s.actualReps ?? 0) >= s.targetReps)
    if (ex.tier === 'T1') {
      const state = useStore.getState().getLiftState(ex.liftName, 'T1')
      if (!state) return null
      const rounding = state.rounding ?? 5
      const r = computeT1Progression(ex.targetWeight, state.currentStage, completed, state.increment, rounding)
      return completed ? `✅ ${r.message}` : `❌ ${r.message}`
    }
    if (ex.tier === 'T2') {
      const state = useStore.getState().getLiftState(ex.liftName, 'T2')
      if (!state) return null
      const rounding = state.rounding ?? 5
      const r = computeT2Progression(ex.targetWeight, state.currentStage, completed, state.increment, rounding)
      return completed ? `✅ ${r.message}` : `❌ ${r.message}`
    }
    if (ex.tier === 'T3') {
      const amrap = ex.sets[2]?.actualReps ?? 0
      return amrap >= 25 ? '✅ Hit 25+ — adding 5 lbs next session' : 'Keep going — hit 25 to increase weight'
    }
    return null
  })()

  const getRestDuration = useCallback(() => {
    if (!ex) return 180
    if (ex.tier === 'T1') return profile?.restTimerT1 ?? 180
    if (ex.tier === 'T2') return profile?.restTimerT2 ?? 120
    return profile?.restTimerT3 ?? 75
  }, [ex, profile])

  const handleSetTap = async (setIdx: number) => {
    if (!ex) return
    if (ex.tier === 'T3' && setIdx === 2) {
      setEditingSet({ ex: exerciseIndex, set: setIdx })
      setEditReps(String(ex.sets[2].targetReps))
      return
    }
    const targetReps = ex.sets[setIdx].targetReps
    if (ex.sets[setIdx].completed) {
      setEditingSet({ ex: exerciseIndex, set: setIdx })
      setEditReps(String(ex.sets[setIdx].actualReps ?? targetReps))
      return
    }
    await completeSet(exerciseIndex, setIdx)
    hapticSetComplete()
    setRestDuration(getRestDuration())
    setRestActive(true)
  }

  const handleEditReps = async () => {
    if (editingSet === null) return
    const reps = parseInt(editReps, 10)
    if (isNaN(reps) || reps < 0) return
    const { ex: exIdx, set: setIdx } = editingSet
    const exercise = session.exercises[exIdx]
    if (exercise?.tier === 'T3' && setIdx === 2) {
      await completeT3Amrap(exIdx, reps)
    } else {
      await completeSet(exIdx, setIdx, reps)
    }
    hapticSetComplete()
    setEditingSet(null)
    setEditReps('')
  }

  const handleNext = async () => {
    hapticExerciseComplete()
    setRestActive(false)
    if (isLastExercise) {
      const { prs, xpEarned } = await finishWorkout()
      navigate('/summary', { state: { session, prs, xpEarned } })
    } else {
      setExerciseIndex((i) => i + 1)
    }
  }

  const nextEx = !isLastExercise ? session.exercises[exerciseIndex + 1] : null
  const def = ex ? getExerciseDefinition(ex.liftName) : null
  const equipment = def?.equipment ?? 'Barbell'

  const today = new Date().toISOString().slice(0, 10)
  const isResuming = session.date !== today

  return (
    <div className="max-w-lg mx-auto p-6 pb-40">
      {isResuming && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] text-sm">
          Resuming workout from {session.date}
        </div>
      )}
      <div className="mb-6 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <p className="text-[var(--color-text-secondary)] text-sm">Day {session.day} • Exercise {exerciseIndex + 1} of {session.exercises.length}</p>
            <span className="text-[var(--color-text-muted)] text-sm tabular-nums">{formatDuration(elapsed)}</span>
          </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">{ex?.liftName ?? ''}</h1>
          <button
            onClick={() => setShowExerciseInfo(true)}
            className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-raised)]"
            aria-label="Exercise info"
          >
            ⓘ
          </button>
        </div>
        {(ex?.tier === 'T1' || ex?.tier === 'T2') && (
          <p className="text-[var(--color-text-muted)] text-xs mt-1">
            {ex.tier} · Stage {useStore.getState().getLiftState(ex.liftName, ex.tier)?.currentStage ?? 1}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <p className="text-[48px] font-bold text-[var(--color-accent-active)] tabular-nums leading-none" style={{ fontSize: 48 }}>
            {ex ? formatWeightForDisplay(ex.targetWeight, equipment, profile?.units ?? 'lbs') : ''}
          </p>
          <button
            onClick={() => setShowPlateCalc(true)}
            className="p-1.5 rounded-lg bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-overlay)] text-[var(--color-text-secondary)] text-xs border border-[var(--color-border-subtle)]"
          >
            Plates
          </button>
        </div>
        <p className="text-2xl font-semibold text-[var(--color-text-secondary)] tracking-wider tabular-nums" style={{ letterSpacing: '0.05em' }}>{ex?.targetScheme}</p>
        {ex?.tier === 'T1' && (
          <WarmUpSection
            workingWeight={ex.targetWeight}
            scheme={ex.targetScheme}
            units={profile?.units}
          />
        )}
        </div>
        <button
          onClick={() => setShowAbandonConfirm(true)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-fail)] text-xs shrink-0"
        >
          Abandon
        </button>
      </div>

      {ex && (
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {ex.sets.map((set, setIdx) => {
            const isAmrap = ex.tier === 'T3' && setIdx === 2
            const isFailed = set.completed && set.actualReps !== null && set.actualReps < set.targetReps
            const isComplete = set.completed && !isFailed
            return (
              <button
                key={setIdx}
                onClick={() => handleSetTap(setIdx)}
                className={`w-14 h-14 min-w-[56px] min-h-[56px] rounded-full flex flex-col items-center justify-center text-base font-semibold transition-all border-2 ${
                  isComplete
                    ? 'bg-[var(--color-accent-success)]/20 border-[var(--color-accent-success)] text-[var(--color-accent-success)]'
                    : isFailed
                      ? 'bg-[var(--color-accent-fail)]/20 border-[var(--color-accent-fail)] text-[var(--color-accent-fail)]'
                      : 'bg-[var(--color-bg-surface)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-active)]'
                }`}
              >
                <span className="tabular-nums">{set.targetReps}{isAmrap ? '+' : ''}</span>
                {set.completed && (
                  <span className="text-xs opacity-90 tabular-nums">{set.actualReps ?? set.targetReps}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {ex?.tier === 'T3' && (
        <p className="text-center text-[var(--color-text-muted)] text-sm mb-4">Hit 25 on AMRAP to level up!</p>
      )}

      {nextEx && (
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Next: {nextEx.liftName} · {nextEx.targetScheme}
        </p>
      )}

      {allSetsDone && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-accent-success)] font-medium">✓ Exercise complete</p>
          {progressionMessage && (
            <p className="mt-2 text-[var(--color-text-primary)] text-sm">{progressionMessage}</p>
          )}
          <button
            onClick={handleNext}
            className="mt-4 w-full py-4 rounded-xl bg-[var(--color-accent-active)] text-[#0D0D0D] font-semibold hover:opacity-90 transition-opacity"
          >
            {isLastExercise ? 'Finish Workout' : 'Next Exercise →'}
          </button>
        </div>
      )}

      <RestTimer
        duration={restDuration}
        active={restActive}
        onComplete={() => setRestActive(false)}
        onSkip={() => setRestActive(false)}
        hapticOnComplete={hapticEnabled}
      />

      {showExerciseInfo && ex && (
        <ExerciseInfoModal exerciseName={ex.liftName} onClose={() => setShowExerciseInfo(false)} />
      )}
      {showPlateCalc && ex && (
        <PlateCalculator targetWeight={ex.targetWeight} onClose={() => setShowPlateCalc(false)} equipment={def?.equipment} />
      )}
      {showAbandonConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-20 p-6">
          <div className="bg-[var(--color-bg-surface-overlay)] rounded-xl p-6 w-full max-w-sm border border-[var(--color-border-subtle)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Abandon workout?</h3>
            <p className="text-[var(--color-text-muted)] text-sm mb-4">Progress will not be saved. You can start a fresh workout from Home.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbandonConfirm(false)}
                className="flex-1 py-3 rounded-lg bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await abandonWorkout()
                  setShowAbandonConfirm(false)
                  navigate('/')
                }}
                className="flex-1 py-3 rounded-lg bg-[var(--color-accent-fail)] text-white font-semibold"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
      {editingSet !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-20 p-6">
          <div className="bg-[var(--color-bg-surface-overlay)] rounded-xl p-6 w-full max-w-sm border border-[var(--color-border-subtle)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              {session.exercises[editingSet.ex]?.tier === 'T3' && editingSet.set === 2
                ? 'AMRAP reps — Hit 25 to level up!'
                : 'Actual reps'}
            </h3>
            {session.exercises[editingSet.ex]?.tier === 'T3' && editingSet.set === 2 ? (
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setEditReps(String(Math.max(0, parseInt(editReps, 10) - 1)))}
                  className="w-14 h-14 rounded-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-2xl font-bold hover:border-[var(--color-accent-active)]"
                >
                  −
                </button>
                <input
                  type="number"
                  value={editReps}
                  onChange={(e) => setEditReps(e.target.value)}
                  className="w-24 px-4 py-3 rounded-lg bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] text-2xl text-center tabular-nums border border-[var(--color-border-subtle)]"
                  min={0}
                />
                <button
                  onClick={() => setEditReps(String(parseInt(editReps, 10) + 1 || 0))}
                  className="w-14 h-14 rounded-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-2xl font-bold hover:border-[var(--color-accent-active)]"
                >
                  +
                </button>
              </div>
            ) : (
              <input
                type="number"
                value={editReps}
                onChange={(e) => setEditReps(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] text-xl text-center mb-4 tabular-nums border border-[var(--color-border-subtle)]"
                autoFocus
                min={0}
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingSet(null); setEditReps('') }}
                className="flex-1 py-3 rounded-lg bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={handleEditReps}
                className="flex-1 py-3 rounded-lg bg-[var(--color-accent-active)] text-[#0D0D0D] font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
