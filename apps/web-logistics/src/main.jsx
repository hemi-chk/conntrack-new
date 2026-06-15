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

  if (!token || role !== 'logistics') {
    // Clear potentially invalid credentials
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    // Redirect to central login portal
    window.location.href = 'http://127.0.0.1:5173'
    return
  }

  // Mount the React Application
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})()
