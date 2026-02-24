import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { DAY_STRUCTURE } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const { profile, lifts, getNextWorkoutDay, startWorkout } = useStore()
  const nextDay = getNextWorkoutDay()
  const { t1, t2 } = DAY_STRUCTURE[nextDay]
  const t3Names = profile?.t3Exercises[nextDay] ?? []

  const t1State = lifts.get(`${t1}-T1`)
  const t2State = lifts.get(`${t2}-T2`)

  const handleStart = async () => {
    await startWorkout()
    navigate('/workout')
  }

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold text-slate-100">GZCLP</h1>
        <div className="flex gap-4">
          <Link to="/history" className="text-slate-400 hover:text-slate-200">History</Link>
          <Link to="/settings" className="text-slate-400 hover:text-slate-200">Settings</Link>
        </div>
      </header>

      <div className="mb-8">
        <p className="text-slate-400 text-sm">Next workout</p>
        <h2 className="text-3xl font-bold text-slate-100">Day {nextDay}</h2>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 mb-8">
        <h3 className="text-slate-400 text-sm mb-4">Today&apos;s exercises</h3>
        <ul className="space-y-3">
          <li className="flex justify-between items-center">
            <span className="text-slate-200">T1: {t1}</span>
            <span className="text-xl font-bold text-blue-400">
              {t1State?.currentWeight ?? '—'} {profile?.units ?? 'lbs'}
            </span>
          </li>
          <li className="flex justify-between items-center">
            <span className="text-slate-200">T2: {t2}</span>
            <span className="text-xl font-bold text-blue-400">
              {t2State?.currentWeight ?? '—'} {profile?.units ?? 'lbs'}
            </span>
          </li>
          {t3Names.map((name) => (
            <li key={name} className="text-slate-400">T3: {name}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleStart}
        className="w-full py-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl active:scale-[0.98] transition-transform"
      >
        Start Workout
      </button>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {['Squat', 'Bench Press', 'OHP', 'Deadlift'].map((lift) => {
          const t1 = lifts.get(`${lift}-T1`)
          return (
            <div key={lift} className="bg-slate-800/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm">{lift}</p>
              <p className="text-lg font-semibold text-slate-100">{t1?.currentWeight ?? '—'} {profile?.units}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
