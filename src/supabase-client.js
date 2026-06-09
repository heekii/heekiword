import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth functions
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

// Learning records
export async function saveLearningRecord(userId, record) {
  const { data, error } = await supabase
    .from('learning_records')
    .insert([{ user_id: userId, ...record, created_at: new Date().toISOString() }])
  return { data, error }
}

export async function getLearningRecords(userId) {
  const { data, error } = await supabase
    .from('learning_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}
