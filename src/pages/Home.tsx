import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { DAY_STRUCTURE, MAIN_LIFTS } from '../types'
import LiftOverviewCard from '../components/LiftOverviewCard'
import { db } from '../lib/db'
import type { WorkoutSession } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const { profile, lifts, getNextWorkoutDay, startWorkout, lastWorkoutDate, getT3State } = useStore()
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([])
  const [bodyweight, setBodyweight] = useState('')
  const [consecutiveDays, setConsecutiveDays] = useState(0)

  const nextDay = getNextWorkoutDay()
  const today = new Date().toISOString().slice(0, 10)
  const isRestDay = lastWorkoutDate === today
  const { t1, t2 } = DAY_STRUCTURE[nextDay]
  const t3Names = profile?.t3Exercises[nextDay] ?? []
  const t1State = lifts.get(`${t1}-T1`)
  const t2State = lifts.get(`${t2}-T2`)

  useEffect(() => {
    db.sessions
      .where('status')
      .equals('completed')
      .toArray()
      .then((s) => s.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10))
      .then(setRecentSessions)
  }, [lastWorkoutDate])

  useEffect(() => {
    if (!lastWorkoutDate) return
    db.sessions
      .where('status')
      .equals('completed')
      .toArray()
      .then((s) => {
        const dateSet = new Set(s.map((w) => w.date))
        let count = 0
        let checkDate = lastWorkoutDate
        while (dateSet.has(checkDate)) {
          count++
          const next = new Date(checkDate + 'T12:00:00')
          next.setDate(next.getDate() - 1)
          checkDate = next.toISOString().slice(0, 10)
        }
        setConsecutiveDays(count)
      })
  }, [lastWorkoutDate])

  const handleStart = async () => {
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
        <h1 className="text-xl font-bold text-slate-100">GZCLP</h1>
        <div className="flex gap-4">
          <Link to="/stats" className="text-slate-400 hover:text-slate-200">Stats</Link>
          <Link to="/history" className="text-slate-400 hover:text-slate-200">History</Link>
          <Link to="/settings" className="text-slate-400 hover:text-slate-200">Settings</Link>
        </div>
      </header>

      {/* Next Workout Preview */}
      <div className="mb-6">
        {isRestDay ? (
          <p className="text-slate-400 text-sm">Rest Day</p>
        ) : (
          <p className="text-slate-400 text-sm">Next workout</p>
        )}
        <h2 className="text-3xl font-bold text-slate-100 mb-4">
          {isRestDay ? `Next: Day ${nextDay}` : `Day ${nextDay}`}
        </h2>
        <div className="bg-slate-800/50 rounded-xl p-6 mb-4">
          <ul className="space-y-3">
            <li className="flex justify-between items-center">
              <span className="text-slate-200">T1: {t1}</span>
              <span className="text-xl font-bold text-blue-400">
                {t1State?.currentWeight ?? '—'} {profile?.units} ({t1State?.currentScheme ?? '—'})
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-slate-200">T2: {t2}</span>
              <span className="text-xl font-bold text-blue-400">
                {t2State?.currentWeight ?? '—'} {profile?.units} ({t2State?.currentScheme ?? '—'})
              </span>
            </li>
            {t3Names.map((name) => (
              <li key={name} className="flex justify-between items-center">
                <span className="text-slate-400">T3: {name}</span>
                <span className="text-slate-400">{(getT3State(name)?.currentWeight ?? 0)} {profile?.units}</span>
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
          className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-100"
          step="0.1"
        />
        <button
          onClick={handleLogBodyweight}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
        >
          Log
        </button>
      </div>

      {/* Lift Overview Cards */}
      <div className="mb-6">
        <h3 className="text-slate-200 font-semibold mb-3">Lift Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          {MAIN_LIFTS.map((lift) => (
            <LiftOverviewCard key={lift} liftName={lift} />
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div>
        <h3 className="text-slate-200 font-semibold mb-3">Recent Activity</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recentSessions.map((s) => (
            <Link
              key={s.id}
              to="/history"
              className="block p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 text-sm"
            >
              <span className="text-slate-400">{s.date}</span>
              <span className="ml-2 font-medium text-slate-200">Day {s.day}:</span>
              {s.exercises.slice(0, 2).map((ex) => {
                const ok = ex.sets.every((set) => set.completed && (set.actualReps ?? 0) >= set.targetReps)
                return (
                  <span key={ex.liftName} className="ml-2 text-slate-300">
                    {ex.liftName} {ex.targetWeight}×{ex.targetScheme} {ok ? '✅' : '❌'}
                  </span>
                )
              })}
            </Link>
          ))}
        </div>
        {recentSessions.length === 0 && (
          <p className="text-slate-500 text-sm">No workouts yet</p>
        )}
      </div>
    </div>
  )
}
