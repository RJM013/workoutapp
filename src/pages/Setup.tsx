import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { DEFAULT_DAY_STRUCTURE, DEFAULT_T3_EXERCISES, T3_LIBRARY, getExerciseDefinition } from '../data/exerciseRegistry'
import { calcT2FromT1 } from '../lib/weightUtils'
import type { WorkoutDay, DayStructure } from '../types'

const PHASE3_T1_EXERCISES = ['Smith Squat', 'Bench Press', 'Dumbbell OHP', 'Leg Press'] as const

const EQUIPMENT_NOTES: Record<string, string> = {
  'Smith Squat': 'Enter plate weight only — don\'t include the Smith bar',
  'Smith Bench Press': 'Enter plate weight only — don\'t include the Smith bar',
  'Smith OHP': 'Enter plate weight only — don\'t include the Smith bar',
  'Smith Row': 'Enter plate weight only — don\'t include the Smith bar',
  'Leg Press': 'Enter the plate weight loaded on the machine',
  'Hack Squat': 'Enter the plate weight loaded on the machine',
  'Dumbbell OHP': 'Enter per-hand weight (e.g. 15 = 30 lbs total)',
  'Dumbbell Bench Press': 'Enter per-hand weight (e.g. 15 = 30 lbs total)',
  'Dumbbell Row (Heavy)': 'Enter per-hand weight',
  'Bench Press': 'Enter total weight including the 45 lb bar',
  'Barbell Squat': 'Enter total weight including the bar',
  'Deadlift': 'Enter total weight including the bar',
  'Barbell OHP': 'Enter total weight including the bar',
  'Barbell Row': 'Enter total weight including the bar',
}

export default function Setup() {
  const navigate = useNavigate()
  const { completeSetup } = useStore()
  const [step, setStep] = useState(1)
  const [weights, setWeights] = useState<Record<string, number>>({
    'Smith Squat': 95,
    'Bench Press': 75,
    'Dumbbell OHP': 30,
    'Leg Press': 140
  })
  const [t3Selections, setT3Selections] = useState<Record<string, string[]>>({
    A1: [...DEFAULT_T3_EXERCISES.A1],
    B1: [...DEFAULT_T3_EXERCISES.B1],
    A2: [...DEFAULT_T3_EXERCISES.A2],
    B2: [...DEFAULT_T3_EXERCISES.B2]
  })

  const allT3Options = Object.values(T3_LIBRARY).flat()

  const handleWeightChange = (lift: string, value: number) => {
    setWeights((w) => ({ ...w, [lift]: Math.max(0, value) }))
  }

  const toggleT3 = (day: string, exercise: string) => {
    setT3Selections((s) => {
      const list = s[day] ?? []
      const has = list.includes(exercise)
      if (has) return { ...s, [day]: list.filter((e) => e !== exercise) }
      if (list.length >= 3) return s
      return { ...s, [day]: [...list, exercise] }
    })
  }

  const handleComplete = async () => {
    const dayStructure = DEFAULT_DAY_STRUCTURE as DayStructure
    await completeSetup(dayStructure, weights, t3Selections as Record<WorkoutDay, string[]>)
    navigate('/')
  }

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">GZCLP Setup</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        GZCLP is a 4-day lifting program that automatically adjusts your weights and rep schemes as you progress.
      </p>

      {step === 1 && (
        <>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Starting Weights (T1)</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            Pick a weight you could comfortably do for 8 reps. You&apos;ll start at 5x3 — it should feel easy. T2 will auto-calculate at 65%.
          </p>
          <div className="space-y-6">
            {PHASE3_T1_EXERCISES.map((lift) => {
              const def = getExerciseDefinition(lift)
              const rounding = def?.rounding ?? 5
              const totalWeight = weights[lift] ?? 0
              const t2Weight = calcT2FromT1(totalWeight, rounding)
              const isDumbbell = def?.equipment === 'Dumbbells'
              const inputValue = isDumbbell ? totalWeight / 2 : totalWeight
              return (
                <div key={lift} className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]">
                  <label className="block text-[var(--color-text-primary)] font-medium mb-2">{lift}</label>
                  <p className="text-[var(--color-text-muted)] text-xs mb-2">{EQUIPMENT_NOTES[lift] ?? 'Enter working weight'}</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={inputValue || ''}
                      onChange={(e) => handleWeightChange(lift, isDumbbell ? Number(e.target.value) * 2 : Number(e.target.value))}
                      placeholder={isDumbbell ? '15 (per hand)' : '0'}
                      className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] text-right text-lg border border-[var(--color-border-subtle)] focus:border-[var(--color-accent-active)] focus:ring-1 focus:ring-[var(--color-accent-active)] tabular-nums"
                      min={0}
                      step={isDumbbell ? 2.5 : 5}
                    />
                    <span className="text-[var(--color-text-secondary)] text-sm shrink-0 tabular-nums">
                      {isDumbbell && totalWeight > 0 ? `${totalWeight} lbs total (${totalWeight / 2} ea)` : totalWeight > 0 ? `${totalWeight} lbs` : ''}
                    </span>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-sm mt-2 tabular-nums">
                    T2 auto: {t2Weight} lbs
                  </p>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            className="mt-8 w-full py-4 rounded-xl bg-[var(--color-accent-active)] text-[#0D0D0D] font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Next: Select T3 Exercises
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">T3 Accessories</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">
            Pick 1–3 accessories per day. Cap at 3 per day. You can add more later in Settings.
          </p>
          {(['A1', 'B1', 'A2', 'B2'] as const).map((day) => (
            <div key={day} className="mb-6">
              <h3 className="text-[var(--color-text-secondary)] font-medium mb-2">Day {day}</h3>
              <div className="flex flex-wrap gap-2">
                {allT3Options.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => toggleT3(day, ex)}
                    disabled={(t3Selections[day] ?? []).length >= 3 && !(t3Selections[day] ?? []).includes(ex)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      (t3Selections[day] ?? []).includes(ex)
                        ? 'bg-[var(--color-accent-active)] text-[#0D0D0D]'
                        : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-raised)] border border-[var(--color-border-subtle)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-xl bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)] font-semibold border border-[var(--color-border-subtle)]"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-4 rounded-xl bg-[var(--color-accent-active)] text-[#0D0D0D] font-semibold hover:opacity-90 transition-opacity"
            >
              Let&apos;s Lift
            </button>
          </div>
        </>
      )}
    </div>
  )
}
