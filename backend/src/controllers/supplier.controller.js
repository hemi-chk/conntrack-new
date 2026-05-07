import { supabase } from '../config/supabase.js'

// --- Dashboard Stats ---

export const getDashboardStats = async (req, res) => {
  try {
    // Aggregating counts from different tables
    const { count: totalDrivers } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })

    const { count: totalVehicles } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })

    const { count: bidsSubmitted } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })

    res.json({
      activeJobs: 0,
      totalDrivers: totalDrivers || 0,
      availableDrivers: totalDrivers || 0, // Simplified for now
      totalVehicles: totalVehicles || 0,
      availableVehicles: totalVehicles || 0, // Simplified for now
      bidsSubmitted: bidsSubmitted || 0,
      recentActivity: []
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// --- Main Supplier Data ---

// GET /api/supplier/:id - Fetch a single supplier profile
export const getSupplierProfile = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('supplier_id', id)
      .maybeSingle() // Use maybeSingle to avoid error on zero results
    
    if (error) throw error
    if (!data) return res.status(404).json({ error: `Supplier profile with ID ${id} not found` })
    
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// GET /api/supplier/ - Fetch all supplier data
export const getSupplierData = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// POST /api/supplier/ - Create a new supplier record
export const createSupplierRecord = async (req, res) => {
  try {
    const { 
      supplier_name, 
      registration_number, 
      contact_person, 
      contact_number, 
      email, 
      address 
    } = req.body

    const insertData = {
      company_name: supplier_name,
      registration_number: registration_number || 'REG-PENDING', // Fallback for safety
      contact_person,
      contact_number,
      email,
      address
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert([insertData])
      .select()
    
    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// --- Vehicles ---

export const getVehicles = async (req, res) => {
  try {
    const { supplier_id } = req.query
    let query = supabase
      .from('vehicles')
      .select('*')
    
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
    }

    const { data, error } = await query.order('vehicle_number', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const addVehicle = async (req, res) => {
  try {
    const { 
      vehicle_number, 
      type, 
      availability_status, 
      insurance_status,
      insurance_expiry, 
      port_pass_status,
      port_pass_expiry,
      condition_status,
      supplier_id
    } = req.body
    
    const insertData = {
      vehicle_number,
      vehicle_type: type,
      availability_status,
      insurance_status: insurance_status || 'valid',
      insurance_expiry,
      port_pass_status: port_pass_status || 'valid',
      port_pass_expiry,
      condition_status: condition_status || 'good',
      supplier_id
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert([insertData])
      .select()

    if (error) throw error
    res.status(201).json(data[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params
    const { 
      vehicle_number, 
      type, 
      availability_status, 
      insurance_status,
      insurance_expiry, 
      port_pass_status,
      port_pass_expiry,
      condition_status,
      supplier_id
    } = req.body

    const updateData = {
      vehicle_number,
      vehicle_type: type,
      availability_status,
      insurance_status,
      insurance_expiry,
      port_pass_status,
      port_pass_expiry,
      condition_status
    }

    let query = supabase
      .from('vehicles')
      .update(updateData)
      .eq('vehicle_number', id)
    
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
    }

    const { data, error } = await query.select()

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Vehicle not found or unauthorized' })
    
    res.json(data[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params
    const { supplier_id } = req.query

    let query = supabase
      .from('vehicles')
      .delete()
      .eq('vehicle_number', id)
    
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
    }

    const { error } = await query

    if (error) throw error
    res.json({ message: 'Vehicle deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// --- Drivers ---

export const getDrivers = async (req, res) => {
  try {
    const { supplier_id } = req.query;
    
    let query = supabase
      .from('drivers')
      .select('*')
      .order('driver_id', { ascending: true })

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }

    const { data, error } = await query;

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const addDriver = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .insert([req.body])
      .select()

    if (error) throw error
    res.status(201).json(data[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('drivers')
      .update(req.body)
      .eq('driver_id', id)
      .select()

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Driver not found' })
    
    res.json(data[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('driver_id', id)

    if (error) throw error
    res.json({ message: 'Driver deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// --- Bids ---

export const getBids = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const submitBid = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .insert([req.body])
      .select()
    
    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// --- Chat & Inspections (Leader's Update) ---

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params
    const { sender_id, message, message_type } = req.body
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ chat_id: chatId, sender_id, message, message_type: message_type || 'text' }])
      .select()
    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getVehicleInspections = async (req, res) => {
  try {
    const { vehicleId } = req.params
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('inspection_date', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const addInspectionRecord = async (req, res) => {
  try {
    const { vehicle_id, inspection_date, status, remarks, inspected_by } = req.body
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .insert([{ vehicle_id, inspection_date, status, remarks, inspected_by }])
      .select()
    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
