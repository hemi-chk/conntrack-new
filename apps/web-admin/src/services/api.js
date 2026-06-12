import { createClient } from '@supabase/supabase-js'

// Supabase client for storage uploads (frontend) - Using Service Key to bypass Storage RLS temporarily
const supabase = createClient(
  'https://kfbhwmvaokazndizglkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYmh3bXZhb2them5kaXpnbGtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MTE2NywiZXhwIjoyMDkxMTU3MTY3fQ.QHgit2FrAs11Pb2yVJOgC0hflu1EvEE_AyjZTCDlbG4'
)

// Makes it easy to change base URL later (dev to production)
const BASE_URL = 'http://127.0.0.1:5000/api'

const getHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

// WHY: Reusable fetch function with error handling
const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers: getHeaders() })
    if (!response.ok) throw new Error('Network response was not ok')
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

const postData = async (endpoint, body) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    })
    if (!response.ok) throw new Error('Network response was not ok')
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

const putData = async (endpoint, body) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    })
    if (!response.ok) throw new Error('Network response was not ok')
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

const deleteData = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    if (response.status === 401) {
      localStorage.removeItem('token')
      window.location.reload()
      return
    }
    if (!response.ok) throw new Error('Network response was not ok')
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// WHY: Upload a file to Supabase Storage and return the public URL
export const uploadFile = async (bucket, file, folder = '') => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true })

    if (error) throw new Error(error.message)

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return urlData.publicUrl
  } catch (error) {
    console.error('Upload Error:', error)
    throw error
  }
}

export const verifyAdminPassword = async (password) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const response = await fetch(`${BASE_URL}/auth/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password })
  })
  return response.json()
}

// Admin API functions — each one per endpoint
export const adminAPI = {
  // Dashboard
  getStats: () => fetchData('/admin/stats'),

  // Orders
  getOrders: () => fetchData('/admin/orders'),

  // Drivers
  getDrivers: () => fetchData('/admin/drivers'),
  addDriver: (data) => postData('/admin/drivers', data),
  updateDriverStatus: (id, data) => putData(`/admin/drivers/${id}/status`, data),
  deleteDriver: (id) => deleteData(`/admin/drivers/${id}`),

  // Suppliers
  getSuppliers: () => fetchData('/admin/suppliers'),
  addSupplier: (data) => postData('/admin/suppliers', data),
  updateSupplierStatus: (id, data) => putData(`/admin/suppliers/${id}/status`, data),

  // Staff
  getStaff: (role) => fetchData(`/admin/staff${role ? `?role=${role}` : ''}`),
  addStaff: (data) => postData('/admin/staff', data),
  updateStaffStatus: (id, data) => putData(`/admin/staff/${id}/status`, data),
  deleteStaff: (id) => deleteData(`/admin/staff/${id}`),

  // Bids
  getBids: () => fetchData('/admin/bids'),

  // Issues
  getIssues: () => fetchData('/admin/issues'),

  // Auth
  verifyPassword: (password) => postData('/auth/verify-password', {
    email: JSON.parse(localStorage.getItem('user') || '{}')?.email,
    password
  }),
}