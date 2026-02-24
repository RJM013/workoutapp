export function roundToNearest5(weight: number): number {
  return Math.floor(weight / 5) * 5
}

export function roundToNearest2_5(weight: number): number {
  return Math.floor(weight / 2.5) * 2.5
}

export function roundWeight(weight: number, units: 'lbs' | 'kg'): number {
  return units === 'lbs' ? roundToNearest5(weight) : roundToNearest2_5(weight)
}

/** Add weight — round to NEAREST increment (Phase 3) */
export function addWeight(current: number, increment: number, rounding: number): number {
  const raw = current + increment
  return Math.round(raw / rounding) * rounding
}

/** Reset weight — round DOWN to nearest rounding (Phase 3) */
export function resetWeight(failedWeight: number, rounding: number): number {
  return Math.floor((failedWeight * 0.85) / rounding) * rounding
}

/** T2 auto-calc from T1 — round to NEAREST (Phase 3) */
export function calcT2FromT1(t1Weight: number, rounding: number): number {
  return Math.round((t1Weight * 0.65) / rounding) * rounding
}

export function getIncrement(liftName: string, units: 'lbs' | 'kg'): number {
  const lowerBody = ['Squat', 'Deadlift']
  const isLower = lowerBody.includes(liftName)
  return units === 'lbs' ? (isLower ? 10 : 5) : (isLower ? 5 : 2.5)
}

/** Phase 3: Format weight for display by equipment type */
export function formatWeightForDisplay(
  weight: number,
  equipment: string,
  units: 'lbs' | 'kg'
): string {
  if (weight <= 0) return `0 ${units}`
  const suffix = ` ${units}`
  if (equipment === 'Dumbbells') {
    const perHand = weight / 2
    return `${weight}${suffix} (${perHand} ea)`
  }
  return `${weight}${suffix}`
}
