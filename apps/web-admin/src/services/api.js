import { createClient } from '@supabase/supabase-js'

// Anon-key client used only to refresh expired sessions
const authClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const clearSessionAndReload = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('role')
  localStorage.removeItem('user')
  window.location.reload()
}

// Makes it easy to change base URL later (dev to production)
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`

const getHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

// WHY: Reusable fetch function with error handling
const fetchData = async (endpoint, _retry = true) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers: getHeaders() })

    if (response.status === 401) {
      if (_retry) {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken })
          if (!error && data?.session) {
            localStorage.setItem('token', data.session.access_token)
            localStorage.setItem('refresh_token', data.session.refresh_token)
            return fetchData(endpoint, false)
          }
        }
      }
      clearSessionAndReload()
      return
    }

    if (!response.ok) throw new Error('Network response was not ok')
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

const postData = async (endpoint, body) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || data.error || `Server error (${response.status})`)
  }
  return data
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

// WHY: Upload a file via the backend (server holds the service-role key, never the browser)
export const uploadFile = async (bucket, file, folder = '') => {
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('bucket', bucket)
    form.append('folder', folder)

    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/admin/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: form
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Upload failed')
    return data.url
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
  grantAccess: (data) => postData('/admin/staff/grant-access', data),
  grantSupplierAccess: (data) => postData('/admin/staff/grant-supplier-access', data),

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