import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#EBF4FF]">
      <Sidebar
        isOpen={sidebarOpen}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
      <Navbar
        isOpen={sidebarOpen}
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
