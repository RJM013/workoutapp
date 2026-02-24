import { useState } from 'react'

const DEFAULT_PLATES = [45, 35, 25, 10, 5, 2.5]
const BAR_WEIGHT = 45

interface PlateCalculatorProps {
  targetWeight: number
  onClose: () => void
}

export default function PlateCalculator({ targetWeight, onClose }: PlateCalculatorProps) {
  const [weight, setWeight] = useState(targetWeight)
  const [barWeight, setBarWeight] = useState(BAR_WEIGHT)

  const perSide = Math.max(0, (weight - barWeight) / 2)
  const plates: number[] = []
  let remaining = perSide
  const sorted = [...DEFAULT_PLATES].sort((a, b) => b - a)
  for (const p of sorted) {
    while (remaining >= p) {
      plates.push(p)
      remaining -= p
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm bg-slate-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-100">Plate Calculator</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-sm">Target weight</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-100 mt-1"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm">Bar weight</label>
            <input
              type="number"
              value={barWeight}
              onChange={(e) => setBarWeight(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-100 mt-1"
            />
          </div>
          <div className="p-4 rounded-xl bg-slate-700/50">
            <p className="text-slate-400 text-sm">Each side: {perSide} lbs</p>
            <p className="text-slate-100 font-semibold mt-1">
              {plates.length ? plates.join(' + ') + ' lb' : 'Empty bar'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
