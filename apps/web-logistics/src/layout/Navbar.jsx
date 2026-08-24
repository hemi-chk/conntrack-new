import { useNavigate } from "react-router-dom";
import { Bell, Menu, Search, LogOut } from "lucide-react";
import { useState } from "react";

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 bg-[#EBF4FF] rounded-xl flex items-center justify-center mb-4">
            <LogOut size={22} className="text-[#052659]" />
          </div>
          <h2 className="text-lg font-bold text-[#021024] mb-1">Sign out?</h2>
          <p className="text-sm text-slate-500">Are you sure you want to log out of your logistics account?</p>
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#052659] text-white text-sm font-semibold hover:bg-[#5483B3] transition"
          >
            Yes, Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Navbar({ isOpen, onMenuClick }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Logistics"}')
  const userName = user.name || 'Logistics'
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const confirmLogout = () => {
    localStorage.clear();
    window.location.href = `${import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:5173'}?logout=true`;
  };

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <nav
        className={`fixed top-0 right-0 h-16 flex items-center justify-between px-5 z-50 transition-all duration-300 ${
          isOpen ? 'left-64' : 'left-0'
        }`}
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #C1E8FF',
          boxShadow: '0 1px 6px rgba(2,16,36,0.08)',
        }}
      >
        {/* Left — hamburger + logo when collapsed */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl transition-all duration-200"
            style={{ color: '#052659' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EBF4FF'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Menu size={20} />
          </button>

          {!isOpen && (
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #052659, #5483B3)' }}
              >
                <span className="text-white font-extrabold text-xs">C</span>
              </div>
              <span className="font-bold text-base tracking-tight" style={{ color: '#021024' }}>
                Con<span style={{ color: '#5483B3' }}>Track</span>
              </span>
            </div>
          )}
        </div>

        {/* Center — Search */}
        <div
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl w-72"
          style={{ background: '#EBF4FF' }}
        >
          <Search size={15} className="shrink-0 opacity-50" style={{ color: '#5483B3' }} />
          <input
            type="text"
            placeholder="Search orders..."
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: '#052659' }}
          />
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            className="relative p-2 rounded-xl transition-all duration-200"
            style={{ color: '#5483B3' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EBF4FF'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Bell size={19} />
            <span
              className="absolute top-[9px] right-[9px] w-2 h-2 rounded-full ring-[1.5px] ring-white"
              style={{ background: '#5483B3' }}
            />
          </button>

          {/* Divider */}
          <div className="w-px h-7 mx-2" style={{ background: '#C1E8FF' }} />

          {/* Profile */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2.5"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-tight" style={{ color: '#021024' }}>{userName}</p>
              <p className="text-[11px] leading-tight" style={{ color: '#5483B3' }}>Logistics Handler</p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0"
              style={{ background: 'linear-gradient(135deg, #052659 0%, #5483B3 100%)' }}
            >
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Sign out"
            className="ml-1 p-2 rounded-xl transition-all duration-200 text-red-400 hover:text-red-600"
            onMouseEnter={e => e.currentTarget.style.background = '#FFF0F0'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>
    </>
  );
}
