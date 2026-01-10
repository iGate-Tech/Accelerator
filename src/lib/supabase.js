import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Get current user error:', error)
    return null
  }
  return data.user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  if (error) throw error
  return {
    user: data.user,
    session: data.session,
    needsConfirmation: !data.session // If no session, email confirmation required
  }
}

export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

// Database helper functions
export const fromSupabase = (table) => supabase.from(table)

export const insertIntoSupabase = async (table, data) => {
  const { data: result, error } = await supabase.from(table).insert(data).select()
  if (error) throw error
  return result
}

export const updateInSupabase = async (table, id, data) => {
  const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select()
  if (error) throw error
  return result
}

export const deleteFromSupabase = async (table, id) => {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export const selectFromSupabase = async (table, query = {}) => {
  let queryBuilder = supabase.from(table).select(query.select || '*')

  if (query.eq) {
    Object.entries(query.eq).forEach(([key, value]) => {
      queryBuilder = queryBuilder.eq(key, value)
    })
  }

  if (query.gt) {
    Object.entries(query.gt).forEach(([key, value]) => {
      queryBuilder = queryBuilder.gt(key, value)
    })
  }

  if (query.order) {
    queryBuilder = queryBuilder.order(query.order.column, { ascending: query.order.ascending })
  }

  if (query.limit) {
    queryBuilder = queryBuilder.limit(query.limit)
  }

  const { data, error } = await queryBuilder
  if (error) throw error
  return data
}