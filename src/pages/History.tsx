import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { DEFAULT_DAY_STRUCTURE } from '../data/exerciseRegistry'
import type { WorkoutSession, DayStructure } from '../types'

type ViewMode = 'calendar' | 'lifts'

export default function History() {
  const { profile, getCompletedWorkouts, lifts } = useStore()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')

  useEffect(() => {
    getCompletedWorkouts().then(setSessions)
  }, [getCompletedWorkouts])

  const dayStructure = (profile?.dayStructure ?? DEFAULT_DAY_STRUCTURE) as DayStructure
  const allT1Exercises = Array.from(new Set([
    dayStructure.A1.t1, dayStructure.B1.t1, dayStructure.A2.t1, dayStructure.B2.t1
  ]))

  const sessionsByDate = new Map(sessions.map((s) => [s.date, s]))

  const getWorkoutStatus = (date: string): 'completed' | 'failed' | null => {
    const s = sessionsByDate.get(date)
    if (!s) return null
    if (s.status === 'abandoned') return 'failed'
    const hadFailure = s.exercises.some((ex) =>
      ex.tier !== 'T3' && ex.sets.some((set) =>
        set.completed && set.actualReps !== null && set.actualReps < set.targetReps
      )
    )
    return hadFailure ? 'failed' : 'completed'
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <Link to="/" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">← Back</Link>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">History</h1>
        <div className="w-14" />
      </header>

      <div className="flex rounded-xl bg-[var(--color-bg-surface)] p-1 mb-6 border border-[var(--color-border-subtle)]">
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'calendar'
              ? 'bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setViewMode('lifts')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'lifts'
              ? 'bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          Lifts
        </button>
      </div>

      {viewMode === 'calendar' && (
        <>
          <div className="mb-4">
            <h2 className="text-[var(--color-text-secondary)] text-sm font-medium uppercase tracking-wider">
              {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-6">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
              <div key={d} className="text-center text-[var(--color-text-muted)] text-xs py-1">
                {d}
              </div>
            ))}
            {calendarDays.map((d, i) => {
              if (d === null) return <div key={`empty-${i}`} />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const status = getWorkoutStatus(dateStr)
              const session = sessionsByDate.get(dateStr)
              const hasWorkout = !!session
              const content = (
                <div
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm tabular-nums relative ${
                    hasWorkout
                      ? status === 'completed'
                        ? 'bg-[var(--color-accent-success)]/20 text-[var(--color-accent-success)]'
                        : 'bg-[var(--color-accent-fail)]/20 text-[var(--color-accent-fail)]'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {d}
                  {hasWorkout && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </div>
              )
              return hasWorkout ? (
                <Link key={d} to={`/history/${session!.id}`}>
                  {content}
                </Link>
              ) : (
                <div key={d}>{content}</div>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs text-[var(--color-text-muted)] mb-6">
            <span><span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent-success)]/50 mr-1" />Completed</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent-fail)]/50 mr-1" />Had failures</span>
          </div>
          <div className="space-y-3">
            <h3 className="text-[var(--color-text-secondary)] font-medium">Recent</h3>
            {sessions.slice(0, 10).map((s) => (
              <Link
                key={s.id}
                to={`/history/${s.id}`}
                className="block bg-[var(--color-bg-surface)] rounded-xl p-4 border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface-raised)]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">Day {s.day}</p>
                    <p className="text-[var(--color-text-secondary)] text-sm">{s.date}</p>
                  </div>
                  <span className={
                    s.exercises.some((ex) => ex.tier !== 'T3' && ex.sets.some((set) =>
                      set.completed && set.actualReps !== null && set.actualReps < set.targetReps
                    )) ? 'text-[var(--color-accent-fail)]' : 'text-[var(--color-accent-success)]'
                  }>
                    {s.exercises.some((ex) => ex.tier !== 'T3' && ex.sets.some((set) =>
                      set.completed && set.actualReps !== null && set.actualReps < set.targetReps
                    )) ? '❌' : '✅'}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {s.exercises.slice(0, 3).map((ex) => (
                    <li key={ex.liftName}>
                      {ex.liftName}: {ex.targetWeight} {profile?.units} × {ex.targetScheme}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </>
      )}

      {viewMode === 'lifts' && (
        <div className="grid grid-cols-2 gap-3">
          {allT1Exercises.map((liftName) => {
            const t1 = lifts.get(`${liftName}-T1`)
            const t2 = lifts.get(`${liftName}-T2`)
            return (
              <Link
                key={liftName}
                to={`/lift/${encodeURIComponent(liftName)}`}
                className="block p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface-raised)]"
              >
                <h3 className="font-semibold text-[var(--color-text-primary)] text-sm uppercase">{liftName} T1</h3>
                <p className="text-[var(--color-text-muted)] text-xs mt-1">
                  {t1 ? `Stage ${t1.currentStage} · ${t1.currentScheme}` : '—'}
                </p>
                <p className="text-lg font-bold text-[var(--color-accent-active)] tabular-nums mt-1">
                  {t1?.currentWeight ?? '—'} {profile?.units}
                </p>
                {t1 && (
                  <p className="text-[var(--color-accent-success)] text-xs mt-1">↑ +{t1.increment} {profile?.units}/session</p>
                )}
                {t2 && (
                  <>
                    <h3 className="font-semibold text-[var(--color-text-primary)] text-sm uppercase mt-3">T2</h3>
                    <p className="text-[var(--color-text-muted)] text-xs">{t2.currentScheme} · {t2.currentWeight} {profile?.units}</p>
                  </>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {sessions.length === 0 && viewMode === 'lifts' && allT1Exercises.length === 0 && (
        <p className="text-[var(--color-text-muted)] text-center py-12">Complete setup to see your lifts</p>
      )}
    </div>
  )
}
