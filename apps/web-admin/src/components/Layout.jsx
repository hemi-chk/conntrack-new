import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function Layout({ children, currentPath, onNavigate, darkMode, onToggleDark }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0f0f1a]' : 'bg-[#DBEAFE]'}`}>
      <Navbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        darkMode={darkMode}
        onToggleDark={onToggleDark}
      />
      <Sidebar
        isOpen={sidebarOpen}
        currentPath={currentPath}
        onNavigate={onNavigate}
        darkMode={darkMode}
      />
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout