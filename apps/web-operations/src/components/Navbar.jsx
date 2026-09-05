import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Sun,
} from 'lucide-react'

import { useState } from 'react'

function LogoutModal({
  onConfirm,
  onCancel,
  darkMode,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className={`mx-4 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl transition-colors duration-300 ${
          darkMode
            ? 'bg-[#052659]'
            : 'bg-white'
        }`}
      >
        <div className="p-6">
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
              darkMode
                ? 'bg-[#021024]'
                : 'bg-[#EBF4FF]'
            }`}
          >
            <LogOut
              size={22}
              className={
                darkMode
                  ? 'text-[#7DA0CA]'
                  : 'text-[#052659]'
              }
            />
          </div>

          <h2
            className={`mb-1 text-lg font-bold ${
              darkMode
                ? 'text-white'
                : 'text-[#021024]'
            }`}
          >
            Sign out?
          </h2>

          <p
            className={`text-sm ${
              darkMode
                ? 'text-[#7DA0CA]'
                : 'text-slate-500'
            }`}
          >
            Are you sure you want to log out of your operations account?
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              darkMode
                ? 'border-[#5483B3]/40 text-[#C1E8FF] hover:bg-[#021024]'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#052659] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5483B3]"
          >
            Yes, Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

function Navbar({
  isOpen,
  onMenuClick,
  onLogout,
  darkMode,
  onToggleDark,
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  let storedUser = {}

  try {
    storedUser = JSON.parse(
      localStorage.getItem('user') || '{}'
    )
  } catch {
    storedUser = {}
  }

  const userName =
    storedUser.name ||
    storedUser.full_name ||
    storedUser.username ||
    'Ramaza'

  const userRole =
    storedUser.role ||
    'Operations'

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const confirmLogout = () => {
    setShowLogoutModal(false)

    if (onLogout) {
      onLogout()
      return
    }

    localStorage.clear()

    const adminUrl =
      import.meta.env.VITE_ADMIN_URL ||
      'http://127.0.0.1:5173'

    window.location.href =
      `${adminUrl}?logout=true`
  }

  const hoverBackground = darkMode
    ? '#052659'
    : '#EBF4FF'

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() =>
            setShowLogoutModal(false)
          }
          darkMode={darkMode}
        />
      )}

      <nav
        className={`fixed top-0 right-0 z-50 flex h-16 items-center justify-between px-5 transition-all duration-300 ${
          isOpen
            ? 'left-64'
            : 'left-0'
        }`}
        style={{
          background: darkMode
            ? '#021024'
            : '#ffffff',
          borderBottom: darkMode
            ? '1px solid #052659'
            : '1px solid #C1E8FF',
          boxShadow:
            '0 1px 6px rgba(2,16,36,0.08)',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className="rounded-xl p-2 transition-all duration-200"
            style={{
              color: darkMode
                ? '#7DA0CA'
                : '#052659',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                hoverBackground
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                'transparent'
            }}
          >
            <Menu size={20} />
          </button>

          {!isOpen && (
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #052659, #5483B3)',
                }}
              >
                <span className="text-xs font-extrabold text-white">
                  C
                </span>
              </div>

              <span
                className="text-base font-bold tracking-tight"
                style={{
                  color: darkMode
                    ? '#ffffff'
                    : '#021024',
                }}
              >
                Con
                <span style={{ color: '#5483B3' }}>
                  Track
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">

          {/* Dark / Light Mode */}
          <button
            type="button"
            onClick={onToggleDark}
            aria-label={
              darkMode
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            title={
              darkMode
                ? 'Light mode'
                : 'Dark mode'
            }
            className="rounded-xl p-2 transition-all duration-200"
            style={{
              color: darkMode
                ? '#7DA0CA'
                : '#5483B3',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                hoverBackground
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                'transparent'
            }}
          >
            {darkMode
              ? <Sun size={19} />
              : <Moon size={19} />
            }
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl p-2 transition-all duration-200"
            style={{
              color: darkMode
                ? '#7DA0CA'
                : '#5483B3',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                hoverBackground
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                'transparent'
            }}
          >
            <Bell size={19} />

            <span
              className={`absolute right-[9px] top-[9px] h-2 w-2 rounded-full ring-[1.5px] ${
                darkMode
                  ? 'ring-[#021024]'
                  : 'ring-white'
              }`}
              style={{
                background: '#5483B3',
              }}
            />
          </button>

          {/* Divider */}
          <div
            className="mx-2 h-7 w-px"
            style={{
              background: darkMode
                ? '#052659'
                : '#C1E8FF',
            }}
          />

          {/* User */}
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p
                className="text-sm font-semibold leading-tight"
                style={{
                  color: darkMode
                    ? '#ffffff'
                    : '#021024',
                }}
              >
                {userName}
              </p>

              <p
                className="text-[11px] leading-tight"
                style={{
                  color: darkMode
                    ? '#7DA0CA'
                    : '#5483B3',
                }}
              >
                {userRole}
              </p>
            </div>

            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md"
              style={{
                background:
                  'linear-gradient(135deg, #052659 0%, #5483B3 100%)',
              }}
            >
              <span className="text-sm font-bold text-white">
                {initials || 'R'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() =>
              setShowLogoutModal(true)
            }
            title="Sign out"
            aria-label="Sign out"
            className="ml-1 rounded-xl p-2 text-red-400 transition-all duration-200 hover:text-red-600"
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                darkMode
                  ? 'rgba(239,68,68,0.10)'
                  : '#FFF0F0'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                'transparent'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>
    </>
  )
}

export default Navbar