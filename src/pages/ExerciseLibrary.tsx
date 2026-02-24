import { useState } from 'react'
import { Link } from 'react-router-dom'
import ExerciseInfoModal from '../components/ExerciseInfoModal'
import { T1_T2_EXERCISES, T3_LIBRARY } from '../data/exerciseRegistry'
import { EXERCISE_INSTRUCTIONS } from '../data/exerciseInstructions'

const allExerciseNames = Array.from(new Set([
  ...Object.keys(EXERCISE_INSTRUCTIONS),
  ...T1_T2_EXERCISES.map((e) => e.name),
  ...Object.values(T3_LIBRARY).flat()
])).sort((a, b) => a.localeCompare(b))

export default function ExerciseLibrary() {
  const [selected, setSelected] = useState<string | null>(null)
  const exercises = allExerciseNames

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <Link to="/settings" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Back</Link>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Exercise Library</h1>
        <div className="w-14" />
      </header>

      <div className="space-y-2">
        {exercises.map((name) => (
          <button
            key={name}
            onClick={() => setSelected(name)}
            className="w-full p-4 rounded-xl bg-[var(--color-bg-surface)]/50 hover:bg-[var(--color-bg-surface)]/70 text-left flex justify-between items-center"
          >
            <span className="text-[var(--color-text-primary)] font-medium">{name}</span>
            <span className="text-[var(--color-text-muted)]">ⓘ</span>
          </button>
        ))}
      </div>

      {selected && (
        <ExerciseInfoModal exerciseName={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
