import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../store/useStore'
import { MAIN_LIFTS } from '../types'

function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

export default function Stats() {
  const { profile, lifts, lastWorkoutDate, getBodyweightLog, getCompletedWorkouts } = useStore()
  const [sessions, setSessions] = useState<{ date: string; duration?: number; volume: number }[]>([])
  const [bodyweight, setBodyweight] = useState<{ weight: number; loggedAt: string }[]>([])
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0)
  const [monthlyWorkouts, setMonthlyWorkouts] = useState(0)

  useEffect(() => {
    getCompletedWorkouts().then((s) => {
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const weekStr = weekStart.toISOString().slice(0, 10)
        const monthStr = monthStart.toISOString().slice(0, 10)
        setWeeklyWorkouts(s.filter((x) => x.date >= weekStr).length)
        setMonthlyWorkouts(s.filter((x) => x.date >= monthStr).length)
        return s.slice(0, 30).map((x) => {
          let volume = 0
          for (const ex of x.exercises) {
            for (const set of ex.sets) {
              const reps = set.actualReps ?? 0
              volume += ex.targetWeight * reps
            }
          }
          const duration = x.completedAt && x.startTime ? (x.completedAt - x.startTime) / 60000 : undefined
          return { date: x.date, duration, volume }
        })
      })
      .then(setSessions)
  }, [getCompletedWorkouts])

  useEffect(() => {
    getBodyweightLog().then(setBodyweight)
  }, [getBodyweightLog])

  const totalVolumeAllTime = sessions.reduce((a, b) => a + b.volume, 0)
  const totalVolumeThisWeek = sessions
    .filter((s) => {
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      return s.date >= weekStart.toISOString().slice(0, 10)
    })
    .reduce((a, b) => a + b.volume, 0)
  const totalVolumeThisMonth = sessions
    .filter((s) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return s.date >= monthStart.toISOString().slice(0, 10)
    })
    .reduce((a, b) => a + b.volume, 0)

  const avgDuration = (() => {
    const withDur = sessions.filter((s) => s.duration != null) as { duration: number }[]
    if (!withDur.length) return null
    return withDur.reduce((a, b) => a + b.duration, 0) / withDur.length
  })()

  const estimated1RM: { lift: string; value: number }[] = []
  for (const lift of MAIN_LIFTS) {
    const t1 = lifts.get(`${lift}-T1`)
    if (t1) {
      const scheme = t1.currentScheme
      const reps = Number(scheme.split('x')[1]) || 3
      const est = epley1RM(t1.currentWeight, reps)
      estimated1RM.push({ lift, value: Math.round(est) })
    }
  }

  const bodyweightAvg7d = bodyweight.length >= 7
    ? bodyweight.slice(0, 7).reduce((a, b) => a + b.weight, 0) / 7
    : null

  const daysSinceLastWorkout = lastWorkoutDate
    ? Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / 86400000)
    : null

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <Link to="/" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Back</Link>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Stats</h1>
        <div className="w-14" />
      </header>

      <div className="space-y-6">
        <section className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50">
          <h2 className="text-[var(--color-text-primary)] font-semibold mb-3">Volume</h2>
          <div className="space-y-2 text-sm">
            <p className="text-[var(--color-text-secondary)]">All time: {totalVolumeAllTime.toLocaleString()} {profile?.units}×reps</p>
            <p className="text-[var(--color-text-secondary)]">This week: {totalVolumeThisWeek.toLocaleString()}</p>
            <p className="text-[var(--color-text-secondary)]">This month: {totalVolumeThisMonth.toLocaleString()}</p>
          </div>
        </section>

        <section className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50">
          <h2 className="text-[var(--color-text-primary)] font-semibold mb-3">Workouts</h2>
          <div className="space-y-2 text-sm">
            <p className="text-[var(--color-text-secondary)]">This week: {weeklyWorkouts}/4</p>
            <p className="text-[var(--color-text-secondary)]">This month: {monthlyWorkouts}</p>
            {avgDuration != null && (
              <p className="text-[var(--color-text-secondary)]">Avg duration: {Math.round(avgDuration)} min</p>
            )}
          </div>
        </section>

        <section className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50">
          <h2 className="text-[var(--color-text-primary)] font-semibold mb-3">Estimated 1RM</h2>
          <div className="space-y-1 text-sm">
            {estimated1RM.map((r) => (
              <p key={r.lift} className="text-[var(--color-text-secondary)]">{r.lift}: {r.value} {profile?.units}</p>
            ))}
          </div>
        </section>

        {bodyweight.length > 0 && (
          <section className="p-4 rounded-xl bg-[var(--color-bg-surface)]/50">
            <h2 className="text-[var(--color-text-primary)] font-semibold mb-3">Body Weight</h2>
            {bodyweightAvg7d != null && (
              <p className="text-[var(--color-text-secondary)] text-sm mb-2">7-day avg: {bodyweightAvg7d.toFixed(1)} {profile?.units}</p>
            )}
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...bodyweight].reverse().map((b) => ({ date: b.loggedAt, weight: b.weight }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {daysSinceLastWorkout != null && daysSinceLastWorkout > 2 && (
          <p className="text-[var(--color-text-muted)] text-sm">Days since last workout: {daysSinceLastWorkout}</p>
        )}
      </div>
    </div>
  )
}
