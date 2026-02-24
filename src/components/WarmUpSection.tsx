import { useState } from 'react'

const BAR_WEIGHT = 45

interface WarmUpSectionProps {
  workingWeight: number
  scheme: string
  units?: string
}

export default function WarmUpSection({ workingWeight, scheme, units = 'lbs' }: WarmUpSectionProps) {
  const [expanded, setExpanded] = useState(false)

  const warmUps = (() => {
    const w = Math.max(workingWeight, BAR_WEIGHT)
    const p50 = Math.round((w * 0.5) / 5) * 5
    const p75 = Math.round((w * 0.75) / 5) * 5
    const p90 = Math.round((w * 0.9) / 5) * 5
    return [
      { weight: BAR_WEIGHT, reps: 10, label: 'Bar' },
      { weight: p50, reps: 5, label: '~50%' },
      { weight: p75, reps: 3, label: '~75%' },
      { weight: p90, reps: 1, label: '~90%' }
    ]
  })()

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-slate-400 text-sm hover:text-slate-300 flex items-center gap-2"
      >
        {expanded ? '▼' : '▶'} Warm-up sets
      </button>
      {expanded && (
        <div className="mt-2 p-4 rounded-xl bg-slate-800/50 text-sm">
          <p className="text-slate-400 mb-2">Working weight: {workingWeight} {units} ({scheme})</p>
          <ul className="space-y-1 text-slate-300">
            {warmUps.map((w, i) => (
              <li key={i}>
                {i + 1}. {w.weight} {units} × {w.reps} reps {w.label}
              </li>
            ))}
          </ul>
          <p className="text-slate-500 text-xs mt-2">→ Begin working sets: {workingWeight} {units} × {scheme}</p>
        </div>
      )}
    </div>
  )
}
