import Dexie, { type Table } from 'dexie'
import type { UserProfile, LiftState, T3LiftState, WorkoutSession, ProgressionEvent, BodyweightLog, PersonalRecord } from '../types'

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
  progressionEvents!: Table<ProgressionEvent, string>
  bodyweightLog!: Table<BodyweightLog, string>
  personalRecords!: Table<PersonalRecord, string>

  constructor() {
    super('GZCLPDatabase')
    this.version(1).stores({
      profile: 'id',
      lifts: 'id',
      t3Lifts: 'id',
      sessions: 'id, date, status',
      meta: 'key'
    })
    this.version(2).stores({
      profile: 'id',
      lifts: 'id',
      t3Lifts: 'id',
      sessions: 'id, date, status',
      meta: 'key',
      progressionEvents: 'id, liftName, createdAt',
      bodyweightLog: 'id, loggedAt',
      personalRecords: 'id, exerciseName, recordType'
    })
  }
}

export const db = new GZCLPDatabase()

export const META_KEYS = {
  SETUP_COMPLETE: 'setupComplete',
  LAST_WORKOUT_DAY: 'lastWorkoutDay',
  LAST_WORKOUT_DATE: 'lastWorkoutDate'
} as const
