import { Bell, User, Menu, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <LogOut size={22} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Sign out?</h2>
          <p className="text-sm text-slate-500">Are you sure you want to log out of your supplier account?</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Yes, Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export function Header({ onMenuClick }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Supplier"}')
  const userName = user.name || 'Supplier'
  const { profileData } = useProfile()

  const confirmLogout = () => {
    localStorage.clear()
    const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:5173'
    window.location.href = `${adminUrl}?logout=true`
  }

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

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
            <div className="overflow-hidden flex justify-center items-center w-8 h-8 bg-white rounded-full">
              {profileData?.supplier_logo ? (
                <img src={profileData.supplier_logo} alt="" className="object-cover w-full h-full" />
              ) : (
                <User size={16} className="text-primary" />
              )}
            </div>
            <span className="text-sm font-medium">{userName}</span>
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex gap-2 items-center px-3 py-2 bg-red-600 rounded-lg transition-colors hover:bg-red-700 text-sm font-medium focus:outline-none"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

      </nav>
    </>
  )
}
