import { supabase } from '../config/supabase.js'

// GET ORDERS
export const getOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_id', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const {
      order_reference,
      order_type,
      cargo_type,
      cargo_weight,
      pickup_country,
      pickup_state,
      destination_country,
      destination_state,
      pickup_date,
      expected_arrival,
      vehicle_type,
      container_no,
      special_instructions
    } = req.body

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          order_reference: order_reference || 'Test Order',
          order_date: new Date().toISOString().split('T')[0],
          order_type,
          cargo_type,
          cargo_weight,
          pickup_country,
          pickup_state,
          destination_country,
          destination_state,
          pickup_date,
          expected_arrival,
          vehicle_type,
          container_no,
          special_instructions,
          current_status: 'created'
        }
      ])
      .select()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}