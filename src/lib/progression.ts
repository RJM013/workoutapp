import type { T1Scheme, T2Scheme } from '../types'
import { roundToNearest5 } from './weightUtils'

const T1_SCHEMES: T1Scheme[] = ['5x3', '6x2', '10x1']
const T2_SCHEMES: T2Scheme[] = ['3x10', '3x8', '3x6']

export function getT1Scheme(stage: number): T1Scheme {
  return T1_SCHEMES[stage - 1] ?? '5x3'
}

export function getT2Scheme(stage: number): T2Scheme {
  return T2_SCHEMES[stage - 1] ?? '3x10'
}

export function getSetsFromScheme(scheme: string): number[] {
  const [sets, reps] = scheme.split('x').map(Number)
  return Array(sets).fill(reps)
}

export interface T1ProgressionResult {
  newWeight: number
  newStage: 1 | 2 | 3
  newScheme: T1Scheme
  message: string
}

export function computeT1Progression(
  currentWeight: number,
  currentStage: 1 | 2 | 3,
  completed: boolean,
  increment: number
): T1ProgressionResult {
  if (completed) {
    return {
      newWeight: currentWeight + increment,
      newStage: currentStage,
      newScheme: getT1Scheme(currentStage),
      message: `Adding ${increment} lbs next session`
    }
  }
  if (currentStage < 3) {
    const nextStage = (currentStage + 1) as 1 | 2 | 3
    return {
      newWeight: currentWeight,
      newStage: nextStage,
      newScheme: getT1Scheme(nextStage),
      message: `Moving to ${getT1Scheme(nextStage)} next session`
    }
  }
  const resetWeight = roundToNearest5(currentWeight * 0.85)
  return {
    newWeight: resetWeight,
    newStage: 1,
    newScheme: '5x3',
    message: `Reset to 85% → ${resetWeight} lbs at 5x3`
  }
}

export interface T2ProgressionResult {
  newWeight: number
  newStage: 1 | 2 | 3
  newScheme: T2Scheme
  message: string
}

export function computeT2Progression(
  currentWeight: number,
  currentStage: 1 | 2 | 3,
  completed: boolean,
  increment: number
): T2ProgressionResult {
  if (completed) {
    return {
      newWeight: currentWeight + increment,
      newStage: currentStage,
      newScheme: getT2Scheme(currentStage),
      message: `Adding ${increment} lbs next session`
    }
  }
  if (currentStage < 3) {
    const nextStage = (currentStage + 1) as 1 | 2 | 3
    return {
      newWeight: currentWeight,
      newStage: nextStage,
      newScheme: getT2Scheme(nextStage),
      message: `Moving to ${getT2Scheme(nextStage)} next session`
    }
  }
  const resetWeight = roundToNearest5(currentWeight * 0.85)
  return {
    newWeight: resetWeight,
    newStage: 1,
    newScheme: '3x10',
    message: `Reset to 85% → ${resetWeight} lbs at 3x10`
  }
}
