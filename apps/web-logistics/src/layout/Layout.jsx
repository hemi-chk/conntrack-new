import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        isOpen={sidebarOpen}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
      <main className={`
        pt-20 transition-all duration-300
        ${sidebarOpen ? 'ml-64' : 'ml-0'}
      `}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout