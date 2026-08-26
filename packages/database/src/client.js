import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!process.env.SUPABASE_SERVICE_KEY)

export const supabase = createClient(supabaseUrl, supabaseKey)