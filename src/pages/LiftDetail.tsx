import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../store/useStore'
import type { ProgressionEvent } from '../types'

const EVENT_ICONS: Record<string, string> = {
  weight_increased: '▲',
  session_completed: '✅',
  session_failed: '❌',
  stage_advanced: '→',
  reset: '⟳',
  manual_override: '↻'
}

export default function LiftDetail() {
  const { liftName } = useParams<{ liftName: string }>()
  const decoded = liftName ? decodeURIComponent(liftName) : ''
  const { profile, lifts, getProgressionEvents } = useStore()
  const [events, setEvents] = useState<ProgressionEvent[]>([])
  const [eventsT2, setEventsT2] = useState<ProgressionEvent[]>([])

  const t1 = lifts.get(`${decoded}-T1`)
  const t2 = lifts.get(`${decoded}-T2`)

  useEffect(() => {
    if (!decoded) return
    getProgressionEvents(decoded, 'T1').then(setEvents)
    getProgressionEvents(decoded, 'T2').then(setEventsT2)
  }, [decoded, getProgressionEvents])

  const chartData = (() => {
    const points: { date: string; t1?: number; t2?: number; fail?: number }[] = []
    const seen = new Set<string>()
    for (const e of [...events, ...eventsT2].sort((a, b) => a.createdAt - b.createdAt)) {
      const d = new Date(e.createdAt).toISOString().slice(0, 10)
      if (seen.has(d)) continue
      seen.add(d)
      const pt: { date: string; t1?: number; t2?: number; fail?: number } = { date: d }
      const t1Ev = events.find((ev) => ev.createdAt === e.createdAt && ev.tier === 'T1')
      const t2Ev = eventsT2.find((ev) => ev.createdAt === e.createdAt && ev.tier === 'T2')
      if (t1Ev?.toWeight != null) pt.t1 = t1Ev.toWeight
      if (t2Ev?.toWeight != null) pt.t2 = t2Ev.toWeight
      if (t1Ev?.eventType === 'session_failed' || t1Ev?.eventType === 'reset') pt.fail = t1Ev.fromWeight
      if (t2Ev?.eventType === 'session_failed' || t2Ev?.eventType === 'reset') pt.fail = t2Ev?.fromWeight
      points.push(pt)
    }
    const hist = t1?.history ?? []
    for (const h of hist) {
      if (!seen.has(h.date)) {
        seen.add(h.date)
        points.push({ date: h.date, t1: h.weight })
      }
    }
    const hist2 = t2?.history ?? []
    for (const h of hist2) {
      const existing = points.find((p) => p.date === h.date)
      if (existing) existing.t2 = h.weight
      else {
        points.push({ date: h.date, t2: h.weight })
      }
    }
    return points.sort((a, b) => a.date.localeCompare(b.date))
  })()

  const allTimeBestT1 = t1?.history
    ? Math.max(...t1.history.map((h) => h.weight), t1.currentWeight)
    : t1?.currentWeight ?? 0
  const allTimeBestT2 = t2?.history
    ? Math.max(...t2.history.map((h) => h.weight), t2.currentWeight)
    : t2?.currentWeight ?? 0

  const sessionHistory = (() => {
    const sessions: { date: string; tier: string; weight: number; scheme: string; reps: string; outcome: string }[] = []
    for (const h of t1?.history ?? []) {
      sessions.push({
        date: h.date,
        tier: 'T1',
        weight: h.weight,
        scheme: h.scheme,
        reps: h.setsCompleted.join(', '),
        outcome: h.completed ? '✅' : '❌'
      })
    }
    for (const h of t2?.history ?? []) {
      sessions.push({
        date: h.date,
        tier: 'T2',
        weight: h.weight,
        scheme: h.scheme,
        reps: h.setsCompleted.join(', '),
        outcome: h.completed ? '✅' : '❌'
      })
    }
    return sessions.sort((a, b) => b.date.localeCompare(a.date))
  })()

  if (!decoded) return null

  return (
    <div className="max-w-lg mx-auto p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <Link to="/" className="text-slate-400 hover:text-slate-200">← Back</Link>
        <h1 className="text-xl font-bold text-slate-100">{decoded}</h1>
        <div className="w-14" />
      </header>

      <div className="mb-6 p-4 rounded-xl bg-slate-800/50">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">T1</span>
          <span className="text-slate-100 font-semibold">{t1?.currentWeight ?? '—'} {profile?.units} ({t1?.currentScheme ?? '—'})</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">T2</span>
          <span className="text-slate-100 font-semibold">{t2?.currentWeight ?? '—'} {profile?.units} ({t2?.currentScheme ?? '—'})</span>
        </div>
        <p className="text-slate-500 text-xs mt-2">All-time best T1: {allTimeBestT1} {profile?.units} · T2: {allTimeBestT2} {profile?.units}</p>
      </div>

      {chartData.length > 0 && (
        <div className="mb-6 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="t1" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="T1" />
              <Line type="monotone" dataKey="t2" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="T2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-slate-200 font-semibold mb-2">T1 Progression</h3>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className={t1?.currentStage === 1 ? 'bg-emerald-600/50 px-2 py-1 rounded' : 'bg-slate-700 text-slate-400 px-2 py-1 rounded'}>5x3</span>
          <span>→</span>
          <span className={t1?.currentStage === 2 ? 'bg-amber-600/50 px-2 py-1 rounded' : 'bg-slate-700 text-slate-400 px-2 py-1 rounded'}>6x2</span>
          <span>→</span>
          <span className={t1?.currentStage === 3 ? 'bg-amber-600/50 px-2 py-1 rounded' : 'bg-slate-700 text-slate-400 px-2 py-1 rounded'}>10x1</span>
          <span>→</span>
          <span className="bg-slate-700 text-slate-400 px-2 py-1 rounded">Reset</span>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          You are here: Stage {t1?.currentStage ?? 1} at {t1?.currentWeight ?? '—'} {profile?.units}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-slate-200 font-semibold mb-2">Progression History</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {[...events, ...eventsT2]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 20)
            .map((e) => (
              <div key={e.id} className="text-sm border-b border-slate-700 pb-2">
                <span className="text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</span>
                <span className="ml-2">{EVENT_ICONS[e.eventType] ?? '•'}</span>
                <span className="ml-2 text-slate-200">
                  {e.toWeight ?? e.fromWeight} {profile?.units} ({e.details?.scheme as string ?? ''})
                </span>
                <span className="ml-2 text-slate-500">
                  {e.eventType === 'weight_increased' && 'Added weight after completing'}
                  {e.eventType === 'session_failed' && `Failed (${(e.details?.setsCompleted as number[])?.join(',') ?? ''})`}
                  {e.eventType === 'stage_advanced' && `Stage advance: ${String(e.details?.nextScheme ?? '')}`}
                  {e.eventType === 'reset' && `RESET: ${String(e.details?.formula ?? '')}`}
                </span>
                {e.details?.formula != null && (
                  <p className="text-slate-500 text-xs mt-1 ml-6">{String(e.details.formula)}</p>
                )}
              </div>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-slate-200 font-semibold mb-2">Session History</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sessionHistory.map((s, i) => (
            <div key={i} className="flex justify-between text-sm text-slate-300">
              <span>{s.date}</span>
              <span>{s.tier} {s.weight}×{s.scheme}</span>
              <span>{s.reps}</span>
              <span>{s.outcome}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
