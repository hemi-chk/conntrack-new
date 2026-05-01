import { supabase } from '../config/supabase.js'

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
    const { data, error } = await supabase
      .from('drivers')
      .insert(req.body)
      .select()

    if (error) throw error
    res.json(data)
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
        suppliers (company_name, contact_person, contact_number)
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
        drivers (first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}