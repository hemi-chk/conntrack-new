import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// =========================================================
// LOGISTICS APP BOOTSTRAP
// ---------------------------------------------------------
// This guard ensures only authenticated logistics users can access the app.
// It reads the token + role from the central auth flow and redirects any
// invalid or non-logistics sessions before the UI mounts.
// =========================================================
(function handleAuth() {
  const urlParams = new URLSearchParams(window.location.search)
  const tokenParam = urlParams.get('token')
  const refreshTokenParam = urlParams.get('refresh_token')
  const roleParam = urlParams.get('role')
  const userParam = urlParams.get('user')

  if (tokenParam && roleParam) {
    localStorage.setItem('token', tokenParam)
    if (refreshTokenParam) {
      localStorage.setItem('refresh_token', refreshTokenParam)
    }
    localStorage.setItem('role', roleParam)
    if (userParam) {
      localStorage.setItem('user', userParam)
    }
    // Clean up query parameters
    window.history.replaceState(null, '', window.location.pathname)
  }

  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token || role !== 'logistics') {
    // Clear potentially invalid credentials
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    // Redirect to central login portal
    window.location.href = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:5173'
    return
  }

  // Mount the React Application
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})()
