import { Bell, User, Menu, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Header({ onMenuClick }) {
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Supplier"}')
  const userName = user.name || 'Supplier'

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = 'http://127.0.0.1:5173?logout=true'
  }

  return (
    <nav className="flex fixed top-0 right-0 left-0 z-50 justify-between items-center px-6 h-20 text-white shadow-lg bg-primary">

      {/* Left side */}
      <div className="flex gap-4 items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg transition hover:bg-blue-700"
        >
          <Menu size={22} />
        </button>
        {/* Logo */}
        <div className="flex gap-2 items-center">
          <img
            src="/logo.png"
            alt="ConnTrack"
            className="object-contain w-auto h-14"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex gap-4 items-center">
        <button className="relative p-2 rounded-lg transition hover:bg-blue-700">
          <Bell size={22} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full"></span>
        </button>
        <Link to="/profile" className="flex gap-2 items-center px-3 py-2 bg-blue-700 rounded-lg transition-colors hover:bg-blue-600">
          <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full">
            <User size={16} className="text-primary" />
          </div>
          <span className="text-sm font-medium">{userName}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex gap-2 items-center px-3 py-2 bg-red-600 rounded-lg transition-colors hover:bg-red-700 text-sm font-medium focus:outline-none"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

    </nav>
  )
}