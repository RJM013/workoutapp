import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { db } from '../lib/db'
import type { WorkoutSession } from '../types'

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useStore()
  const [session, setSession] = useState<WorkoutSession | null>(null)

  useEffect(() => {
    if (!id) return
    db.sessions.get(id).then((s) => setSession(s ?? null))
  }, [id])

  if (!session) return null

  const duration = session.completedAt && session.startTime
    ? Math.round((session.completedAt - session.startTime) / 60000)
    : null

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <Link to="/history" className="text-slate-400 hover:text-slate-200">← Back</Link>
        <h1 className="text-xl font-bold text-slate-100">Workout Detail</h1>
        <div className="w-14" />
      </header>

      <div className="mb-6">
        <p className="font-semibold text-slate-100">Day {session.day}</p>
        <p className="text-slate-400 text-sm">{session.date}</p>
        {duration != null && <p className="text-slate-500 text-sm">Duration: {duration} min</p>}
        {session.notes && <p className="text-slate-400 text-sm mt-2">{session.notes}</p>}
      </div>

      <div className="space-y-4">
        {session.exercises.map((ex) => (
          <div key={ex.liftName} className="p-4 rounded-xl bg-slate-800/50">
            <h3 className="font-semibold text-slate-200">{ex.liftName} ({ex.tier})</h3>
            <p className="text-slate-400 text-sm">
              {ex.targetWeight} {profile?.units} × {ex.targetScheme}
            </p>
            <p className="text-slate-300 text-sm mt-1">
              Sets: {ex.sets.map((s) => s.actualReps ?? s.targetReps).join(', ')}
              {ex.sets.every((s) => s.completed && (s.actualReps ?? 0) >= s.targetReps) ? ' ✅' : ' ❌'}
            </p>
            {ex.notes && <p className="text-slate-500 text-xs mt-1">{ex.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
