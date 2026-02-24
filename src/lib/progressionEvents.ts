import type { ProgressionEvent } from '../types'
import type { T1ProgressionResult, T2ProgressionResult } from './progression'

export function createProgressionEvents(
  liftName: string,
  tier: 'T1' | 'T2',
  completed: boolean,
  fromWeight: number,
  fromStage: number,
  result: T1ProgressionResult | T2ProgressionResult,
  workoutId: string,
  setsCompleted: number[],
  scheme: string
): ProgressionEvent[] {
  const events: ProgressionEvent[] = []
  const now = Date.now()

  if (completed) {
    events.push({
      id: crypto.randomUUID(),
      liftName,
      tier,
      eventType: 'weight_increased',
      fromWeight,
      toWeight: result.newWeight,
      fromStage,
      toStage: result.newStage,
      details: { setsCompleted, scheme },
      workoutId,
      createdAt: now
    })
  } else {
    events.push({
      id: crypto.randomUUID(),
      liftName,
      tier,
      eventType: 'session_failed',
      fromWeight,
      toWeight: fromWeight,
      fromStage,
      toStage: fromStage,
      details: { setsCompleted, scheme },
      workoutId,
      createdAt: now
    })

    if (fromStage < 3) {
      events.push({
        id: crypto.randomUUID(),
        liftName,
        tier,
        eventType: 'stage_advanced',
        fromWeight,
        toWeight: fromWeight,
        fromStage,
        toStage: result.newStage,
        details: {
          setsCompleted,
          scheme,
          nextScheme: result.newScheme,
          message: `Got ${setsCompleted.join(',')} — needed ${scheme}`
        },
        workoutId,
        createdAt: now
      })
    } else {
      const resetWeight = result.newWeight
      const formula = `${fromWeight} × 0.85 = ${(fromWeight * 0.85).toFixed(2)} → ${resetWeight} lbs`
      events.push({
        id: crypto.randomUUID(),
        liftName,
        tier,
        eventType: 'reset',
        fromWeight,
        toWeight: resetWeight,
        fromStage: 3,
        toStage: 1,
        details: {
          setsCompleted,
          scheme,
          formula,
          failedWeight: fromWeight
        },
        workoutId,
        createdAt: now
      })
    }
  }

  return events
}
