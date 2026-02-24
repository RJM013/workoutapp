import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { db } from '../lib/db'
import type { WorkoutSession } from '../types'

export default function History() {
  const { profile } = useStore()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])

  useEffect(() => {
    db.sessions
      .where('status')
      .equals('completed')
      .toArray()
      .then((sessions) => sessions.sort((a, b) => b.date.localeCompare(a.date)))
      .then(setSessions)
  }, [])

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-8">
        <Link to="/" className="text-slate-400 hover:text-slate-200">← Back</Link>
        <h1 className="text-xl font-bold text-slate-100">History</h1>
        <div className="w-14" />
      </header>

      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-100">Day {s.day}</p>
                <p className="text-slate-400 text-sm">{s.date}</p>
              </div>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {s.exercises.map((ex) => (
                <li key={ex.liftName}>
                  {ex.liftName}: {ex.targetWeight} {profile?.units} × {ex.targetScheme}
                  {ex.sets.every((set) => set.completed && (set.actualReps ?? 0) >= set.targetReps)
                    ? ' ✓'
                    : ''}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <p className="text-slate-500 text-center py-12">No workouts yet</p>
      )}
    </div>
  )
}
