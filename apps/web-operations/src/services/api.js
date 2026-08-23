import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kfbhwmvaokazndizglkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYmh3bXZhb2them5kaXpnbGtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODExNjcsImV4cCI6MjA5MTE1NzE2N30.gsqwtU29K75k0g_ZzeC3X00iijw3QFWcRIMesaLBlvA'
)

export const uploadFile = async (bucket, file, folder = '') => {
  if (!file) return null

  const fileExt = file.name.split('.').pop()
  const fileName = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)

  return data.publicUrl
}