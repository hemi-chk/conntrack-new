import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Unified Auth Guard & Session Synchronization
(function handleAuth() {
  const urlParams = new URLSearchParams(window.location.search)
  const tokenParam = urlParams.get('token')
  const roleParam = urlParams.get('role')
  const userParam = urlParams.get('user')

  if (tokenParam && roleParam) {
    localStorage.setItem('token', tokenParam)
    localStorage.setItem('role', roleParam)
    if (userParam) {
      localStorage.setItem('user', userParam)
    }
    // Clean up query parameters
    window.history.replaceState(null, '', window.location.pathname)
  }

  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token || role !== 'operations') {
    // Clear potentially invalid credentials
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    // Redirect to central login portal
    window.location.href = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:5173'
    return
  }

  // Global fetch interceptor to append Authorization: Bearer <token>
  const originalFetch = window.fetch
  window.fetch = async (url, options = {}) => {
    const activeToken = localStorage.getItem('token')
    const urlStr = url.toString()
    if (activeToken && (urlStr.includes(`${import.meta.env.VITE_API_URL}/api`) || urlStr.includes('http://localhost:5000/api') || urlStr.includes('http://127.0.0.1:5000/api'))) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${activeToken}`
      }
    }
    return originalFetch(url, options)
  }

  // Mount the React Application
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})()
