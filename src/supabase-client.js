import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Device ID 생성 및 저장
export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('deviceId')
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('deviceId', deviceId)
  }
  return deviceId
}

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

// Anonymous Auth
export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously()
  return { data, error }
}

// Google OAuth
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  return { data, error }
}

// Learning records - with device ID support
export async function saveLearningRecord(record, deviceId = null) {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('learning_records')
    .insert([{
      user_id: user?.id || null,
      device_id: deviceId,
      type: record.type,
      word: record.word,
      course: record.course,
      success: record.success,
      created_at: new Date().toISOString()
    }])
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

// Device 데이터를 User로 병합
export async function mergeDeviceDataToUser(deviceId) {
  const user = await getCurrentUser()
  if (!user || !deviceId) return

  // device_id 기반 기록을 모두 user_id로 업데이트
  const { error } = await supabase
    .from('learning_records')
    .update({ device_id: null })
    .eq('device_id', deviceId)
    .is('user_id', null)

  return error
}
