import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import RestTimer from '../components/RestTimer'
import ExerciseInfoModal from '../components/ExerciseInfoModal'
import PlateCalculator from '../components/PlateCalculator'
import WarmUpSection from '../components/WarmUpSection'
import { computeT1Progression, computeT2Progression } from '../lib/progression'
import type { WorkoutExercise } from '../types'

function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Workout() {
  const navigate = useNavigate()
  const { activeSession, profile, completeSet, completeT3Amrap, finishWorkout } = useStore()
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [restActive, setRestActive] = useState(false)
  const [restDuration, setRestDuration] = useState(180)
  const [editingSet, setEditingSet] = useState<{ ex: number; set: number } | null>(null)
  const [editReps, setEditReps] = useState('')
  const [showExerciseInfo, setShowExerciseInfo] = useState(false)
  const [showPlateCalc, setShowPlateCalc] = useState(false)
  const [elapsed, setElapsed] = useState(0)

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
      const r = computeT1Progression(ex.targetWeight, state.currentStage, completed, state.increment)
      return completed ? `✅ ${r.message}` : `❌ ${r.message}`
    }
    if (ex.tier === 'T2') {
      const state = useStore.getState().getLiftState(ex.liftName, 'T2')
      if (!state) return null
      const r = computeT2Progression(ex.targetWeight, state.currentStage, completed, state.increment)
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
    if (ex.tier === 'T2') return profile?.restTimerT2 ?? 150
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
    setEditingSet(null)
    setEditReps('')
  }

  const handleNext = async () => {
    setRestActive(false)
    if (isLastExercise) {
      const prs = await finishWorkout()
      navigate('/summary', { state: { session, prs } })
    } else {
      setExerciseIndex((i) => i + 1)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 pb-40">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <p className="text-slate-400 text-sm">Day {session.day} • Exercise {exerciseIndex + 1} of {session.exercises.length}</p>
          <span className="text-slate-500 text-sm tabular-nums">{formatDuration(elapsed)}</span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100">{ex?.liftName ?? ''}</h1>
          <button
            onClick={() => setShowExerciseInfo(true)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            aria-label="Exercise info"
          >
            ⓘ
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-3xl font-bold text-blue-400">
            {ex?.targetWeight} {profile?.units}
          </p>
          <button
            onClick={() => setShowPlateCalc(true)}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs"
          >
            Plates
          </button>
        </div>
        <p className="text-slate-400">{ex?.targetScheme}</p>
        {ex?.tier === 'T1' && (
          <WarmUpSection
            workingWeight={ex.targetWeight}
            scheme={ex.targetScheme}
            units={profile?.units}
          />
        )}
      </div>

      {ex && (
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {ex.sets.map((set, setIdx) => (
            <button
              key={setIdx}
              onClick={() => handleSetTap(setIdx)}
              className={`min-w-[64px] min-h-[64px] rounded-xl flex flex-col items-center justify-center text-lg font-semibold transition-all ${
                set.completed
                  ? set.actualReps !== null && set.actualReps < set.targetReps
                    ? 'bg-amber-600/80 text-white'
                    : 'bg-emerald-600/80 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span>{set.targetReps}{ex.tier === 'T3' && setIdx === 2 ? '+' : ''}</span>
              {set.completed && (
                <span className="text-sm opacity-90">{set.actualReps ?? set.targetReps}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {allSetsDone && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800 border border-slate-700">
          <p className="text-emerald-400 font-medium">✓ Exercise complete</p>
          {progressionMessage && (
            <p className="mt-2 text-slate-300 text-sm">{progressionMessage}</p>
          )}
          <button
            onClick={handleNext}
            className="mt-4 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            {isLastExercise ? 'Finish Workout' : 'Next Exercise'}
          </button>
        </div>
      )}

      <RestTimer
        duration={restDuration}
        active={restActive}
        onComplete={() => setRestActive(false)}
        onSkip={() => setRestActive(false)}
      />

      {showExerciseInfo && ex && (
        <ExerciseInfoModal exerciseName={ex.liftName} onClose={() => setShowExerciseInfo(false)} />
      )}
      {showPlateCalc && ex && (
        <PlateCalculator targetWeight={ex.targetWeight} onClose={() => setShowPlateCalc(false)} />
      )}
      {editingSet !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-20 p-6">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              {session.exercises[editingSet.ex]?.tier === 'T3' && editingSet.set === 2
                ? 'AMRAP reps'
                : 'Actual reps'}
            </h3>
            <input
              type="number"
              value={editReps}
              onChange={(e) => setEditReps(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-slate-100 text-xl text-center mb-4"
              autoFocus
              min={0}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingSet(null); setEditReps('') }}
                className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEditReps}
                className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
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
