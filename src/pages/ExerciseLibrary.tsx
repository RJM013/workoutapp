import { useState } from 'react'
import { Link } from 'react-router-dom'
import ExerciseInfoModal from '../components/ExerciseInfoModal'
import { EXERCISE_INSTRUCTIONS } from '../data/exerciseInstructions'

export default function ExerciseLibrary() {
  const [selected, setSelected] = useState<string | null>(null)
  const exercises = Object.keys(EXERCISE_INSTRUCTIONS)

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <Link to="/settings" className="text-slate-400 hover:text-slate-200">← Back</Link>
        <h1 className="text-xl font-bold text-slate-100">Exercise Library</h1>
        <div className="w-14" />
      </header>

      <div className="space-y-2">
        {exercises.map((name) => (
          <button
            key={name}
            onClick={() => setSelected(name)}
            className="w-full p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 text-left flex justify-between items-center"
          >
            <span className="text-slate-200 font-medium">{name}</span>
            <span className="text-slate-500">ⓘ</span>
          </button>
        ))}
      </div>

      {selected && (
        <ExerciseInfoModal exerciseName={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
