import { Bell, Menu, Sun, Moon, Search, LogOut } from 'lucide-react'

function Navbar({ isOpen, onMenuClick, darkMode, onToggleDark }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'H'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    window.location.reload()
  }

  return (
    <nav
      className={`fixed top-0 right-0 h-16 flex items-center justify-between px-5 z-50 transition-all duration-300 ${
        isOpen ? 'left-64' : 'left-0'
      } ${
        darkMode
          ? 'bg-[#0F172A] border-b border-[#1E293B]'
          : 'bg-white border-b border-slate-200'
      }`}
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Left — hamburger + logo when sidebar is closed */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className={`p-2 rounded-xl transition-all duration-200 ${
            darkMode
              ? 'hover:bg-[#1E293B] text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
          }`}
        >
          <Menu size={20} />
        </button>

        {!isOpen && (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563EB, #60A5FA)' }}
            >
              <span className="text-white font-extrabold text-xs">C</span>
            </div>
            <span className={`font-bold text-base tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Con<span className="text-blue-500">Track</span>
            </span>
          </div>
        )}
      </div>

      {/* Center — Search */}
      <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl w-72 ${
        darkMode ? 'bg-[#1E293B] text-slate-300' : 'bg-slate-100 text-slate-500'
      }`}>
        <Search size={15} className="shrink-0 opacity-50" />
        <input
          type="text"
          placeholder="Search orders, drivers, suppliers..."
          className="bg-transparent text-sm outline-none w-full placeholder-slate-400"
        />
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1">

        {/* Theme toggle */}
        <button
          onClick={onToggleDark}
          className={`p-2 rounded-xl transition-all duration-200 ${
            darkMode
              ? 'hover:bg-[#1E293B] text-amber-400'
              : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
          }`}
        >
          {darkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Notifications */}
        <button className={`relative p-2 rounded-xl transition-all duration-200 ${
          darkMode ? 'hover:bg-[#1E293B] text-slate-400' : 'hover:bg-slate-100 text-slate-500'
        }`}>
          <Bell size={19} />
          <span className="absolute top-[9px] right-[9px] w-2 h-2 bg-red-500 rounded-full ring-[1.5px] ring-white" />
        </button>

        {/* Divider */}
        <div className={`w-px h-7 mx-2 ${darkMode ? 'bg-[#1E293B]' : 'bg-slate-200'}`} />

        {/* Profile */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className={`text-sm font-semibold leading-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {user.name || 'Hemindi'}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">Administrator</p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)' }}
          >
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className={`ml-1 p-2 rounded-xl transition-all duration-200 ${
            darkMode
              ? 'hover:bg-red-900/20 text-red-400'
              : 'hover:bg-red-50 text-red-400 hover:text-red-600'
          }`}
        >
          <LogOut size={18} />
        </button>

      </div>
    </nav>
  )
}

export default Navbar
