import { Bell, User, Menu, LogOut } from 'lucide-react'
import { useState } from 'react'

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <LogOut size={22} className="text-[#1E40AF]" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Sign out?</h2>
          <p className="text-sm text-slate-500">Are you sure you want to log out of your operations account?</p>
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1E40AF] text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Yes, Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

function Navbar({ onMenuClick }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Operations"}')
  const userName = user.name || 'Operations'

  const confirmLogout = () => {
    localStorage.clear()
    window.location.href = 'http://127.0.0.1:5173?logout=true'
  }

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between bg-[#1E40AF] px-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 transition hover:bg-blue-700"
          >
            <Menu size={22} />
          </button>

          <h1 className="text-lg font-bold tracking-wide">
            ConTrack
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 transition hover:bg-blue-700">
            <Bell size={22} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-400"></span>
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <User size={16} className="text-[#1E40AF]" />
            </div>
            <span className="text-sm font-medium">{userName}</span>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-700 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>
    </>
  )
}

export default Navbar
