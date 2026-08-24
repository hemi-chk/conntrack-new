import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function Layout({ children, currentPath, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-[#EBF4FF]">
      <Sidebar
        isOpen={sidebarOpen}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
      <Navbar
        isOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(o => !o)}
      />
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default Layout
