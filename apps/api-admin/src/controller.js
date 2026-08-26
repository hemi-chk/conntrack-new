import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { supabase } from '@conntrack/api-core'

// =============================================
// FILE UPLOAD
// WHY: Storage uploads must happen server-side so the service-role
// key never reaches the browser
// =============================================
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const { bucket, folder = '' } = req.body
    if (!bucket) return res.status(400).json({ error: 'bucket is required' })

    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    res.json({ url: data.publicUrl })
  } catch (error) {
    console.error('Upload Error:', error)
    res.status(500).json({ error: error.message })
  }
}

// =============================================
// DASHBOARD STATS
// WHY: Admin dashboard needs real counts
// =============================================
export const getDashboardStats = async (req, res) => {
  try {
    const [orders, activeBids, drivers, suppliers] = await Promise.all([
      supabase.from('orders').select('current_status'),
      supabase.from('bids').select('bid_status').eq('bid_status', 'under_review'),
      supabase.from('drivers').select('status'),
      supabase.from('suppliers').select('status'),
    ])

    const stats = {
      total_orders: orders.data?.length || 0,
      active_orders: orders.data?.filter(o => o.current_status === 'in_transit').length || 0,
      completed_orders: orders.data?.filter(o => o.current_status === 'completed').length || 0,
      active_bids: activeBids.data?.length || 0,
      total_drivers: drivers.data?.length || 0,
      active_drivers: drivers.data?.filter(d => d.status === 'active').length || 0,
      total_suppliers: suppliers.data?.length || 0,
      active_suppliers: suppliers.data?.filter(s => s.status === 'active').length || 0,
    }

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// =============================================
// ORDERS
// =============================================
export const getAllOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (customer_name, email, phone)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// =============================================
// DRIVERS
// =============================================
export const getAllDrivers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        suppliers (company_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const addDriver = async (req, res) => {
  try {
    // Every driver needs a password to log in - generate one now rather than
    // leaving password_hash null, which used to let anyone log in as them
    // with any password at all.
    const tempPassword = crypto.randomBytes(6).toString('base64url')
    const password_hash = await bcrypt.hash(tempPassword, 10)

    const { data, error } = await supabase
      .from('drivers')
      .insert({ ...req.body, password_hash })
      .select()

    if (error) throw error
    res.json({ driver: data, tempPassword })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, deactivation_reason } = req.body

    const { data, error } = await supabase
      .from('drivers')
      .update({ status, deactivation_reason, updated_at: new Date() })
      .eq('driver_id', id)
      .select()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
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
    res.json({ message: 'Driver removed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// =============================================
// SUPPLIERS
// =============================================
export const getAllSuppliers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const addSupplier = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(req.body)
      .select()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateSupplierStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, deactivation_reason } = req.body

    const { data, error } = await supabase
      .from('suppliers')
      .update({ status, deactivation_reason, updated_at: new Date() })
      .eq('supplier_id', id)
      .select()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// =============================================
// STAFF (Operations & Logistics)
// =============================================
export const getAllStaff = async (req, res) => {
  try {
    const { role } = req.query

    let query = supabase.from('profiles').select('*')
    if (role) query = query.eq('role', role)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const addStaff = async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, contact_number, position, employee_id, national_id, address, temp_only } = req.body

    const authEmail = temp_only
      ? `tmp.${employee_id || Date.now()}.${Math.random().toString(36).slice(2, 8)}@pending.internal`
      : email
    const authPassword = temp_only
      ? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      : password

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password: authPassword,
      email_confirm: true,
    })
    if (authError) throw authError

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        role,
        first_name,
        last_name,
        contact_number,
        position,
        employee_id,
        national_id,
        address,
        status: 'active',
        is_temp_account: !!temp_only,
      })
      .select()

    if (error) {
      // Roll back the auth user so this email isn't permanently blocked by an orphaned account
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw error
    }
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const grantAccess = async (req, res) => {
  try {
    const { profile_id, email, password } = req.body

    const { error: authError } = await supabase.auth.admin.updateUserById(profile_id, {
      email,
      password,
      email_confirm: true,
    })
    if (authError) throw authError

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_temp_account: false, updated_at: new Date() })
      .eq('id', profile_id)
      .select()
    if (error) throw error

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const grantSupplierAccess = async (req, res) => {
  try {
    const { supplier_id, email, password } = req.body

    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('company_name, contact_person, contact_number')
      .eq('supplier_id', supplier_id)
      .single()
    if (supplierError) throw supplierError

    const [first_name, ...rest] = (supplier.contact_person || supplier.company_name || 'Supplier').trim().split(' ')
    const last_name = rest.join(' ') || supplier.company_name || 'Contact'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) throw authError

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'supplier',
        status: 'active',
        is_temp_account: false,
        employee_id: String(supplier_id),
        first_name,
        last_name,
        contact_number: supplier.contact_number || 'N/A',
        position: 'Supplier Contact',
        national_id: 'N/A',
        address: 'N/A',
      })
      .select()
    if (error) {
      // Roll back the auth user so this email isn't permanently blocked by an orphaned account
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw error
    }

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const { data, error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.json({ message: 'Staff member removed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// =============================================
// BIDS
// =============================================
export const getAllBids = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        orders (order_reference, order_type, cargo_type),
        suppliers (supplier_id, supplier_reference, company_name, registration_number, tin_number, contact_person, contact_number, email, address, company_overview, experience_years, hcv_count, lcv_count, status)
      `)
      .order('submitted_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// =============================================
// ISSUES
// =============================================
export const getAllIssues = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        orders (order_reference),
        suppliers (company_name),
        drivers (first_name, last_name),
        reporter:profiles!reported_by (first_name, last_name, role)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
