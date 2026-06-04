import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

router.get('/orders', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

router.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

export default router