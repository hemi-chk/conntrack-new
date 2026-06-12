import { Bell, Menu, Sun, Moon, Search, LogOut } from 'lucide-react'

function Navbar({ onMenuClick, darkMode, onToggleDark }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'H'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    window.location.reload()
  }

  return (
    <nav className={`h-16 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 ${
      darkMode ? 'bg-[#1a1a2e] border-b border-[#2d2d44]' : 'bg-white border-b border-slate-100'
    } shadow-sm`}>

      {/* Left — Logo + Menu */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-xl transition ${
            darkMode ? 'hover:bg-[#2d2d44] text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-[#1E293B]'}`}>
            Con<span className="text-[#1E40AF]">Track</span>
          </span>
        </div>
      </div>

      {/* Center — Search */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl w-80 ${
        darkMode ? 'bg-[#2d2d44] text-slate-300' : 'bg-slate-50 text-slate-400'
      }`}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Search orders, drivers, suppliers..."
          className="bg-transparent text-sm outline-none w-full placeholder-slate-400"
        />
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className={`p-2 rounded-xl transition ${
            darkMode ? 'hover:bg-[#2d2d44] text-yellow-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button className={`p-2 rounded-xl transition relative ${
          darkMode ? 'hover:bg-[#2d2d44] text-slate-300' : 'hover:bg-slate-100 text-slate-600'
        }`}>
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className={`flex items-center gap-3 ml-2 pl-3 border-l ${
          darkMode ? 'border-[#2d2d44]' : 'border-slate-100'
        }`}>
          <div className="text-right hidden sm:block">
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-[#1E293B]'}`}>
              {user.name || 'Hemindi'}
            </p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-br from-[#1E40AF] to-blue-400 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={`p-2 rounded-xl transition ${
            darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'
          }`}
        >
          <LogOut size={20} />
        </button>

      </div>
    </nav>
  )
}

export default Navbar