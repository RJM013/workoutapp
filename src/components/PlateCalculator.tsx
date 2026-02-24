import { useState } from 'react'
import type { EquipmentType } from '../data/exerciseRegistry'

const DEFAULT_PLATES = [45, 35, 25, 10, 5, 2.5]
const BAR_WEIGHT_BARBELL = 45
const BAR_WEIGHT_PLATES_ONLY = 0

function getDefaultBarWeight(equipment?: EquipmentType): number {
  if (equipment === 'Smith' || equipment === 'Machine') return BAR_WEIGHT_PLATES_ONLY
  return BAR_WEIGHT_BARBELL
}

interface PlateCalculatorProps {
  targetWeight: number
  onClose: () => void
  equipment?: EquipmentType
}

export default function PlateCalculator({ targetWeight, onClose, equipment }: PlateCalculatorProps) {
  const [weight, setWeight] = useState(targetWeight)
  const [barWeight, setBarWeight] = useState(() => getDefaultBarWeight(equipment))

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
      <div className="relative w-full max-w-sm bg-[var(--color-bg-surface)] rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Plate Calculator</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-bg-surface-raised)] text-[var(--color-text-secondary)]">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[var(--color-text-secondary)] text-sm">Target weight</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] mt-1"
            />
          </div>
          <div>
            <label className="text-[var(--color-text-secondary)] text-sm">Bar weight</label>
            <input
              type="number"
              value={barWeight}
              onChange={(e) => setBarWeight(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] mt-1"
            />
          </div>
          <div className="p-4 rounded-xl bg-[var(--color-bg-surface-raised)]/50">
            <p className="text-[var(--color-text-secondary)] text-sm">Each side: {perSide} lbs</p>
            <p className="text-[var(--color-text-primary)] font-semibold mt-1">
              {plates.length ? plates.join(' + ') + ' lb' : 'Empty bar'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
