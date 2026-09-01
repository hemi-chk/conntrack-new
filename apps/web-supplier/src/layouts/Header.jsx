import { Bell, User, Menu, Sun, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useTheme } from '../context/ThemeContext'

export function Header({ onMenuClick }) {
  const { profileData } = useProfile();
  const { theme, toggleTheme } = useTheme();

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

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="relative p-2 rounded-lg transition-all duration-300 hover:bg-blue-700 group"
        >
          {theme === 'dark' ? (
            <Sun
              size={22}
              className="transition-transform duration-300 group-hover:rotate-12 text-yellow-300"
            />
          ) : (
            <Moon
              size={22}
              className="transition-transform duration-300 group-hover:-rotate-12"
            />
          )}
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg transition hover:bg-blue-700">
          <Bell size={22} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full"></span>
        </button>

        {/* Profile Link */}
        <Link to="/profile" className="flex gap-2 items-center px-3 py-2 bg-blue-700 rounded-lg transition-colors hover:bg-blue-600">
          {profileData?.supplier_logo ? (
            <img 
              src={profileData.supplier_logo} 
              alt="Supplier Logo" 
              className="w-8 h-8 rounded-full border border-white object-cover bg-white" 
            />
          ) : (
            <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full">
              <User size={16} className="text-primary" />
            </div>
          )}
          <span className="text-sm font-medium">
            {profileData?.company_name ? profileData.company_name : "Supplier"}
          </span>
        </Link>
      </div>

    </nav>
  )
}