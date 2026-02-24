import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://ysrioiyrgunppmqdwdsx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_s8IF8vepSlg-Nw1XEhRqbw_EJ-cUJ-a'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
