import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase.js'

let authSupabase
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  authSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
}

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token provided' })

  if (!authSupabase) {
     return res.status(500).json({ message: 'Supabase client not initialized' })
  }

  const { data, error } = await authSupabase.auth.getUser(token)
  if (error) return res.status(401).json({ message: 'Invalid or expired token' })

  req.user = data.user
  next()
}

export const authorizeRole = (...roles) => {
  return async (req, res, next) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle()

    if (error || !profile) {
      return res.status(403).json({ message: 'Profile not found or error accessing profile' })
    }

    if (!roles.includes(profile.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    req.user.role = profile.role
    next()
  }
}
