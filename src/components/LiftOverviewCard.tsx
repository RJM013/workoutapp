import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'

interface LiftOverviewCardProps {
  liftName: string
}

function getCardBorderColor(stage: number): string {
  if (stage === 1) return 'border-emerald-500/50'
  return 'border-amber-500/50'
}

export default function LiftOverviewCard({ liftName }: LiftOverviewCardProps) {
  const { profile, lifts, lastWorkoutDate } = useStore()
  const t1 = lifts.get(`${liftName}-T1`)
  const t2 = lifts.get(`${liftName}-T2`)

  const startWeight = t1?.history[0]?.weight ?? t1?.currentWeight ?? 0
  const gain = t1 ? t1.currentWeight - startWeight : 0

  const lastSession = t1?.history[t1.history.length - 1]
  const lastDate = lastSession?.date ?? lastWorkoutDate

  const streak = (() => {
    if (!t1?.history.length) return 0
    let count = 0
    for (let i = t1.history.length - 1; i >= 0; i--) {
      if (t1.history[i].completed) count++
      else break
    }
    return count
  })()

  const borderColor = getCardBorderColor(t1?.currentStage ?? 1)

  return (
    <Link
      to={`/lift/${encodeURIComponent(liftName)}`}
      className={`block rounded-xl p-4 bg-slate-800/50 border-2 ${borderColor} hover:bg-slate-800/70 transition-colors`}
    >
      <h3 className="font-bold text-slate-100 uppercase text-sm mb-2">{liftName}</h3>
      <div className="space-y-1 text-sm">
        {t1 && (
          <p className="text-slate-300">
            T1: {t1.currentWeight} {profile?.units} — Stage {t1.currentStage} ({t1.currentScheme})
          </p>
        )}
        {t2 && (
          <p className="text-slate-300">
            T2: {t2.currentWeight} {profile?.units} — Stage {t2.currentStage} ({t2.currentScheme})
          </p>
        )}
        {gain > 0 && (
          <p className="text-emerald-400 text-xs">▲ +{gain} {profile?.units} since start</p>
        )}
        {lastDate && (
          <p className="text-slate-500 text-xs">
            Last session: {lastDate} {lastSession?.completed ? '✅' : '❌'}
          </p>
        )}
        {streak > 0 && (
          <p className="text-slate-500 text-xs">Streak: {streak} sessions without fail</p>
        )}
      </div>
    </Link>
  )
}
