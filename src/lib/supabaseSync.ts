import { supabase } from './supabase'
import { db } from './db'
import type { ProfileRecord, LiftRecord, T3LiftRecord } from './db'
import type { WorkoutSession } from '../types'

async function ensureAuth(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id) return session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.warn('Supabase auth failed:', error.message)
    return null
  }
  return data.user?.id ?? null
}

export async function pullFromSupabase(): Promise<boolean> {
  const userId = await ensureAuth()
  if (!userId) return false

  const { data, error } = await supabase
    .from('user_data')
    .select('data, updated_at')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return true
    console.warn('Supabase pull failed:', error.message)
    return false
  }
  if (!data?.data) return true

  const payload = data.data as {
    profile?: unknown[]
    lifts?: unknown[]
    t3Lifts?: unknown[]
    sessions?: unknown[]
    meta?: { key: string; value: unknown }[]
  }

  try {
    if (payload.profile?.length) await db.profile.bulkPut(payload.profile as ProfileRecord[])
    if (payload.lifts?.length) await db.lifts.bulkPut(payload.lifts as LiftRecord[])
    if (payload.t3Lifts?.length) await db.t3Lifts.bulkPut(payload.t3Lifts as T3LiftRecord[])
    if (payload.sessions?.length) await db.sessions.bulkPut(payload.sessions as WorkoutSession[])
    if (payload.meta?.length) await db.meta.bulkPut(payload.meta as { key: string; value: unknown }[])
    return true
  } catch (e) {
    console.warn('Supabase pull merge failed:', e)
    return false
  }
}

export async function pushToSupabase(): Promise<boolean> {
  const userId = await ensureAuth()
  if (!userId) return false

  const [profile, lifts, t3Lifts, sessions, meta] = await Promise.all([
    db.profile.toArray(),
    db.lifts.toArray(),
    db.t3Lifts.toArray(),
    db.sessions.toArray(),
    db.meta.toArray()
  ])

  const payload = { profile, lifts, t3Lifts, sessions, meta }

  const { error } = await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, data: payload, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.warn('Supabase push failed:', error.message)
    return false
  }
  return true
}
