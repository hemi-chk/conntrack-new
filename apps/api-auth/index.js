import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@conntrack/api-core'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Separate anon-key client for user-facing auth operations
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

app.use(cors())
app.use(express.json())

app.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('Login error:', error.message)
      return res.status(401).json({ message: error.message })
    }

    if (!data || !data.user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return res.status(500).json({ message: 'Error fetching user profile', error: profileError.message })
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this user' })
    }

    res.json({
      token: data.session.access_token,
      role: profile.role,
      user: {
        name: `${profile.first_name} ${profile.last_name}`,
        email: data.user.email
      }
    })

  } catch (err) {
    console.error('Server error during login:', err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

app.post('/verify-password', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ valid: false, message: 'Email and password required' })
  try {
    const { error } = await supabaseAuth.auth.signInWithPassword({ email, password })
    if (error) return res.status(401).json({ valid: false, message: 'Incorrect password' })
    res.json({ valid: true })
  } catch (err) {
    res.status(500).json({ valid: false, message: 'Server error' })
  }
})

app.post('/logout', async (req, res) => {
  await supabaseAuth.auth.signOut()
  res.json({ message: 'Logged out successfully' })
})

app.get('/health', (req, res) => {
  res.json({ service: 'auth', status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`)
})
