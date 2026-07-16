import { supabase } from '@conntrack/database'

const uploadToStorage = async (bucket, folder, file) => {
  const fileName = `${Date.now()}-${file.originalname}`
  const filePath = `${folder}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, { contentType: file.mimetype })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

// --- Dashboard Stats ---
// req.supplierId is resolved server-side from the verified token by
// resolveSupplierId middleware - never trust a client-supplied id here.

export const getDashboardStats = async (req, res) => {
  try {
    const { count: totalDrivers } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', req.supplierId)

    const { count: totalVehicles } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', req.supplierId)

    const { count: bidsSubmitted } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', req.supplierId)

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

// GET /api/supplier/profile - Fetch the caller's own supplier profile
export const getSupplierProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('supplier_id', req.supplierId)
      .maybeSingle() // Use maybeSingle to avoid error on zero results

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Supplier profile not found' })

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// PATCH /api/supplier/profile/logo - Upload/replace the caller's own logo
export const updateSupplierLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No logo file uploaded' })

    const supplier_logo = await uploadToStorage('supplier-logos', 'logos', req.file)

    const { data, error } = await supabase
      .from('suppliers')
      .update({ supplier_logo })
      .eq('supplier_id', req.supplierId)
      .select()

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Supplier not found' })

    res.json(data[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
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
// Every query below is scoped to req.supplierId - client-supplied
// supplier_id in query/body is ignored so one supplier can never
// read/write another supplier's fleet.

export const getVehicles = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('supplier_id', req.supplierId)
      .order('vehicle_number', { ascending: true })

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
      Vehicle_Insurance_Copy,
      Vehicle_Port_Pass_Copy
    } = req.body

    const insuranceFile = req.files?.insurance?.[0]
    const portPassFile = req.files?.port_pass?.[0]

    const [uploadedInsurance, uploadedPortPass] = await Promise.all([
      insuranceFile ? uploadToStorage('vehicle-documents', 'insurance', insuranceFile) : Promise.resolve(undefined),
      portPassFile ? uploadToStorage('vehicle-documents', 'port-passes', portPassFile) : Promise.resolve(undefined)
    ])

    const insertData = {
      vehicle_number,
      vehicle_type: type,
      availability_status,
      insurance_status: insurance_status || 'valid',
      insurance_expiry,
      port_pass_status: port_pass_status || 'valid',
      port_pass_expiry,
      condition_status: condition_status || 'good',
      supplier_id: req.supplierId,
      Vehicle_Insurance_Copy: uploadedInsurance || Vehicle_Insurance_Copy,
      Vehicle_Port_Pass_Copy: uploadedPortPass || Vehicle_Port_Pass_Copy
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
      Vehicle_Insurance_Copy,
      Vehicle_Port_Pass_Copy
    } = req.body

    const insuranceFile = req.files?.insurance?.[0]
    const portPassFile = req.files?.port_pass?.[0]

    const [uploadedInsurance, uploadedPortPass] = await Promise.all([
      insuranceFile ? uploadToStorage('vehicle-documents', 'insurance', insuranceFile) : Promise.resolve(undefined),
      portPassFile ? uploadToStorage('vehicle-documents', 'port-passes', portPassFile) : Promise.resolve(undefined)
    ])

    const updateData = {
      vehicle_number,
      vehicle_type: type,
      availability_status,
      insurance_status,
      insurance_expiry,
      port_pass_status,
      port_pass_expiry,
      condition_status,
      ...(uploadedInsurance || Vehicle_Insurance_Copy ? { Vehicle_Insurance_Copy: uploadedInsurance || Vehicle_Insurance_Copy } : {}),
      ...(uploadedPortPass || Vehicle_Port_Pass_Copy ? { Vehicle_Port_Pass_Copy: uploadedPortPass || Vehicle_Port_Pass_Copy } : {})
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('vehicle_number', id)
      .eq('supplier_id', req.supplierId)
      .select()

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

    const { data, error } = await supabase
      .from('vehicles')
      .delete()
      .eq('vehicle_number', id)
      .eq('supplier_id', req.supplierId)
      .select()

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Vehicle not found or unauthorized' })

    res.json({ message: 'Vehicle deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// --- Drivers ---
// Same scoping rule as Vehicles above - req.supplierId only.

export const getDrivers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('supplier_id', req.supplierId)
      .order('driver_id', { ascending: true })

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
      .insert([{ ...req.body, supplier_id: req.supplierId }])
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
    const { supplier_id, ...updateData } = req.body
    const { data, error } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('driver_id', id)
      .eq('supplier_id', req.supplierId)
      .select()

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Driver not found or unauthorized' })

    res.json(data[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('drivers')
      .delete()
      .eq('driver_id', id)
      .eq('supplier_id', req.supplierId)
      .select()

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Driver not found or unauthorized' })

    res.json({ message: 'Driver deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// --- Bids ---
// Same scoping rule - a supplier may only ever see/submit/edit/delete
// its own bids, never a competitor's.

export const getBids = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        bidding (
          *,
          orders (
            *,
            order_assignments (
              assignment_id,
              status,
              drivers (
                driver_id,
                first_name,
                last_name,
                contact_number,
                license_number
              ),
              vehicles (
                vehicle_id,
                vehicle_number,
                vehicle_type,
                availability_status
              )
            ),
            container_tracking (
              current_location,
              status,
              recorded_at
            )
          )
        ),
        drivers (
          first_name,
          last_name,
          emp_id,
          contact_number,
          license_expiry,
          license_class
        ),
        vehicles (
          vehicle_number,
          vehicle_type,
          condition_status,
          insurance_expiry,
          port_pass_expiry
        )
      `)
      .eq('supplier_id', req.supplierId)

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getOpenBiddings = async (req, res) => {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('bidding')
      .select(`
        *,
        orders (*)
      `)
      .eq('status', 'open')
      .lte('start_time', now)
      .gte('end_time', now)

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const submitBid = async (req, res) => {
  try {
    const { supplier_id, ...bidData } = req.body
    const { data, error } = await supabase
      .from('bids')
      .insert([{ ...bidData, supplier_id: req.supplierId }])
      .select()

    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateBid = async (req, res) => {
  try {
    const { id } = req.params
    const { supplier_id, ...updateData } = req.body
    const { data, error } = await supabase
      .from('bids')
      .update(updateData)
      .eq('bid_id', id)
      .eq('supplier_id', req.supplierId)
      .select()

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Bid not found or unauthorized' })

    res.json(data[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteBid = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('bids')
      .delete()
      .eq('bid_id', id)
      .eq('supplier_id', req.supplierId)
      .select()

    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Bid not found or unauthorized' })

    res.json({ message: 'Bid deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// --- Chat & Inspections ---
// NOTE: chat.controller.js / inspection.controller.js also define these
// handlers but aren't wired into supplier.routes.js - these are the
// versions actually in use.

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
    const { message, message_type } = req.body
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ chat_id: chatId, sender_id: req.user.id, message, message_type: message_type || 'text' }])
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
    const { vehicle_id, inspection_date, status, remarks } = req.body
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .insert([{ vehicle_id, inspection_date, status, remarks, inspected_by: req.user.id }])
      .select()
    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
