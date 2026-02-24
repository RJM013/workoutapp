import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { DEFAULT_DAY_STRUCTURE, getExerciseDefinition } from '../data/exerciseRegistry'
import { hapticTap } from '../lib/haptic'
import LiftOverviewCard from '../components/LiftOverviewCard'
import type { WorkoutSession, DayStructure } from '../types'

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000)
  const weekNum = Math.floor(days / 7)
  return `${d.getFullYear()}-W${weekNum}`
}

function getConsecutiveWeeksWith4Workouts(sessions: WorkoutSession[]): number {
  const byWeek = new Map<string, number>()
  for (const s of sessions) {
    const k = getWeekKey(s.date)
    byWeek.set(k, (byWeek.get(k) ?? 0) + 1)
  }
  let streak = 0
  const now = new Date()
  for (let i = 0; i < 52; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const k = getWeekKey(d.toISOString().slice(0, 10))
    const count = byWeek.get(k) ?? 0
    if (count < 4) break
    streak++
  }
  return streak
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, lifts, getNextWorkoutDay, startWorkout, lastWorkoutDate, getT3State, getCompletedWorkouts, getPersonalRecords } = useStore()
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([])
  const [bodyweight, setBodyweight] = useState('')
  const [consecutiveDays, setConsecutiveDays] = useState(0)
  const [consecutiveWeeks, setConsecutiveWeeks] = useState(0)
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0)
  const [badges, setBadges] = useState<string[]>([])

  const nextDay = getNextWorkoutDay()
  const today = new Date().toISOString().slice(0, 10)
  const isRestDay = lastWorkoutDate === today
  const dayStructure = (profile?.dayStructure ?? DEFAULT_DAY_STRUCTURE) as DayStructure
  const { t1, t2 } = dayStructure[nextDay]
  const t3Names = profile?.t3Exercises[nextDay] ?? []
  const t1State = lifts.get(`${t1}-T1`)
  const t2State = lifts.get(`${t2}-T2`)

  useEffect(() => {
    getCompletedWorkouts().then((s) => setRecentSessions(s.slice(0, 10)))
  }, [lastWorkoutDate, getCompletedWorkouts])

  useEffect(() => {
    getCompletedWorkouts().then((s) => {
      const dateSet = new Set(s.map((w) => w.date))
      let count = 0
      const checkDate = lastWorkoutDate
      if (checkDate) {
        let d = checkDate
        while (dateSet.has(d)) {
          count++
          const next = new Date(d + 'T12:00:00')
          next.setDate(next.getDate() - 1)
          d = next.toISOString().slice(0, 10)
        }
      }
      setConsecutiveDays(count)
      setConsecutiveWeeks(getConsecutiveWeeksWith4Workouts(s))
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      const weekStr = weekStart.toISOString().slice(0, 10)
      setWeeklyWorkouts(s.filter((w) => w.date >= weekStr).length)
      getPersonalRecords().then((prs) => {
        const earned: string[] = []
        if (prs.length >= 1) earned.push('First PR')
        if (prs.length >= 10) earned.push('10 PRs')
        if (getConsecutiveWeeksWith4Workouts(s) >= 4) earned.push('4-week streak')
        if (s.length >= 100) earned.push('100 workouts')
        setBadges(earned)
      })
    })
  }, [lastWorkoutDate, getCompletedWorkouts, getPersonalRecords])

  const handleStart = async () => {
    hapticTap()
    await startWorkout()
    navigate('/workout')
  }

  const handleLogBodyweight = async () => {
    const w = parseFloat(bodyweight)
    if (isNaN(w) || w <= 0) return
    await useStore.getState().logBodyweight(w)
    setBodyweight('')
  }

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">GZCLP</h1>
          {(profile?.level ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-[var(--color-accent-active)]/20 text-[var(--color-accent-active)] text-sm font-semibold">
              Level {profile?.level ?? 1}
            </span>
          )}
        </div>
        <div className="flex gap-4">
          <Link to="/stats" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Stats</Link>
          <Link to="/history" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">History</Link>
          <Link to="/settings" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Settings</Link>
        </div>
      </header>

      {/* Next Workout Preview */}
      <div className="mb-6">
        {isRestDay ? (
          <p className="text-[var(--color-text-secondary)] text-sm">Rest Day</p>
        ) : (
          <p className="text-[var(--color-text-secondary)] text-sm">Next workout</p>
        )}
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
          {isRestDay ? `Next: Day ${nextDay}` : `Day ${nextDay}`}
        </h2>
        <div className="bg-[var(--color-bg-surface)]/50 rounded-xl p-6 mb-4">
          <ul className="space-y-3">
            <li className="flex justify-between items-center">
              <span className="text-[var(--color-text-primary)] flex items-center gap-2">
                T1: {t1}
                {getExerciseDefinition(t1)?.equipment && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)]">
                    {getExerciseDefinition(t1)?.equipment}
                  </span>
                )}
              </span>
              <span className="text-xl font-bold text-[var(--color-accent-info)]">
                {t1State?.currentWeight ?? '—'} {profile?.units} ({t1State?.currentScheme ?? '—'})
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-[var(--color-text-primary)] flex items-center gap-2">
                T2: {t2}
                {getExerciseDefinition(t2)?.equipment && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-surface-raised)] text-[var(--color-text-muted)]">
                    {getExerciseDefinition(t2)?.equipment}
                  </span>
                )}
              </span>
              <span className="text-xl font-bold text-[var(--color-accent-info)]">
                {t2State?.currentWeight ?? '—'} {profile?.units} ({t2State?.currentScheme ?? '—'})
              </span>
            </li>
            {t3Names.map((name) => (
              <li key={name} className="flex justify-between items-center">
                <span className="text-[var(--color-text-secondary)]">T3: {name}</span>
                <span className="text-[var(--color-text-secondary)]">{(getT3State(name)?.currentWeight ?? 0)} {profile?.units}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleStart}
          className="w-full py-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl active:scale-[0.98] transition-transform"
        >
          Start Workout
        </button>
      </div>

      {/* Weekly Goal Progress Ring */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="var(--color-bg-surface-raised)"
              strokeWidth="6"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="var(--color-accent-success)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={2 * Math.PI * 24 * (1 - Math.min(weeklyWorkouts / 4, 1))}
              className="transition-[stroke-dashoffset] duration-300"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--color-text-primary)]">
            {weeklyWorkouts}/4
          </span>
        </div>
        <div>
          <p className="text-[var(--color-text-primary)] font-medium">This week</p>
          <p className="text-[var(--color-text-muted)] text-sm">4 workouts = goal</p>
        </div>
      </div>

      {/* Streak */}
      {consecutiveWeeks > 0 && (
        <p className="text-[var(--color-accent-success)] text-sm mb-2">
          {consecutiveWeeks} week{consecutiveWeeks !== 1 ? 's' : ''} streak (4+ workouts/week)
        </p>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {badges.map((b) => (
            <span
              key={b}
              className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Rest Day Recommendation */}
      {consecutiveDays >= 2 && (
        <p className="text-amber-400/90 text-sm mb-4">
          You&apos;ve lifted {consecutiveDays + 1} days in a row — consider a rest day for recovery.
        </p>
      )}

      {/* Body Weight Entry */}
      <div className="mb-6 flex gap-2">
        <input
          type="number"
          placeholder="Log body weight"
          value={bodyweight}
          onChange={(e) => setBodyweight(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]"
          step="0.1"
        />
        <button
          onClick={handleLogBodyweight}
          className="px-4 py-2 rounded-lg bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-bg-surface-overlay)] text-[var(--color-text-primary)]"
        >
          Log
        </button>
      </div>

      {/* Lift Overview Cards */}
      <div className="mb-6">
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-3">Lift Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          {Array.from(new Set([dayStructure.A1.t1, dayStructure.B1.t1, dayStructure.A2.t1, dayStructure.B2.t1])).map((lift) => (
            <LiftOverviewCard key={lift} liftName={lift} />
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div>
        <h3 className="text-[var(--color-text-primary)] font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recentSessions.map((s) => (
            <Link
              key={s.id}
              to={`/history/${s.id}`}
              className="block p-3 rounded-lg bg-[var(--color-bg-surface)]/50 hover:bg-[var(--color-bg-surface)]/70 text-sm"
            >
              <span className="text-[var(--color-text-secondary)]">{s.date}</span>
              <span className="ml-2 font-medium text-[var(--color-text-primary)]">Day {s.day}:</span>
              {s.exercises.slice(0, 2).map((ex) => {
                const ok = ex.sets.every((set) => set.completed && (set.actualReps ?? 0) >= set.targetReps)
                return (
                  <span key={ex.liftName} className="ml-2 text-[var(--color-text-secondary)]">
                    {ex.liftName} {ex.targetWeight}×{ex.targetScheme} {ok ? '✅' : '❌'}
                  </span>
                )
              })}
            </Link>
          ))}
        </div>
        {recentSessions.length === 0 && (
          <p className="text-[var(--color-text-muted)] text-sm">No workouts yet</p>
        )}
      </div>
    </div>
  )
}
