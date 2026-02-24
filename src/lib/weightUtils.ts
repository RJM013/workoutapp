export function roundToNearest5(weight: number): number {
  return Math.floor(weight / 5) * 5
}

export function roundToNearest2_5(weight: number): number {
  return Math.floor(weight / 2.5) * 2.5
}

export function roundWeight(weight: number, units: 'lbs' | 'kg'): number {
  return units === 'lbs' ? roundToNearest5(weight) : roundToNearest2_5(weight)
}

export function getIncrement(liftName: string, units: 'lbs' | 'kg'): number {
  const lowerBody = ['Squat', 'Deadlift']
  const isLower = lowerBody.includes(liftName)
  return units === 'lbs' ? (isLower ? 10 : 5) : (isLower ? 5 : 2.5)
}
