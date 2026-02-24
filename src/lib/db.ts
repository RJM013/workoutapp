import Dexie, { type Table } from 'dexie'
import type { UserProfile, LiftState, T3LiftState, WorkoutSession } from '../types'

export interface ProfileRecord extends UserProfile {
  id: string
}

export interface LiftRecord extends LiftState {
  id: string
}

export interface T3LiftRecord extends T3LiftState {
  id: string
}

export class GZCLPDatabase extends Dexie {
  profile!: Table<ProfileRecord, string>
  lifts!: Table<LiftRecord, string>
  t3Lifts!: Table<T3LiftRecord, string>
  sessions!: Table<WorkoutSession, string>
  meta!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('GZCLPDatabase')
    this.version(1).stores({
      profile: 'id',
      lifts: 'id',
      t3Lifts: 'id',
      sessions: 'id, date, status',
      meta: 'key'
    })
  }
}

export const db = new GZCLPDatabase()

export const META_KEYS = {
  SETUP_COMPLETE: 'setupComplete',
  LAST_WORKOUT_DAY: 'lastWorkoutDay',
  LAST_WORKOUT_DATE: 'lastWorkoutDate'
} as const
