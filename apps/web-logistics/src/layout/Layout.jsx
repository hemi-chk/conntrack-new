import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

// =========================================================
// LOGISTICS LAYOUT
// ---------------------------------------------------------
// This shell keeps the sidebar, navbar, and routed pages together for the
// logistics portal. It also owns the logistics-only dark mode state.
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('logistics-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('logistics-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <div className="min-h-screen bg-[#EBF4FF] dark:bg-[#021024]">
      <Sidebar
        isOpen={sidebarOpen}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
      <Navbar
        isOpen={sidebarOpen}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
