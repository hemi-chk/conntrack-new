import { Bell, LogOut, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../lib/notifications";

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      const nextNotifications = await getNotifications();
      setNotifications(nextNotifications);
    };

    const loadProfile = async () => {
      try {
        const { data } = await api.get('/logistics/profile');
        setProfile(data);
      } catch (error) {
        console.warn('Could not load profile for navbar:', error);
        const savedUser = JSON.parse(localStorage.getItem('user') || '{"name":"Logistics"}');
        setProfile({
          first_name: savedUser.first_name || savedUser.name?.split(' ')[0] || 'Logistics',
          last_name: savedUser.last_name || savedUser.name?.split(' ').slice(1).join(' ') || '',
          position: 'Logistics Handler',
        });
      }
    };

    loadNotifications();
    loadProfile();
  }, []);

  const userName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Logistics'
    : 'Logistics';
  const initials = userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'L';

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const confirmLogout = () => {
    localStorage.clear();
    window.location.href = `${import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:5173'}?logout=true`;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      const nextNotifications = await markNotificationAsRead(notification.id);
      setNotifications(nextNotifications);
    }

    setShowNotifications(false);

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleViewAll = () => {
    setShowNotifications(false);
    navigate('/notifications');
  };

  const handleMarkAllAsRead = async () => {
    const nextNotifications = await markAllNotificationsAsRead();
    setNotifications(nextNotifications);
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

        {/* Right — Actions */}
        <div className="flex items-center gap-1 relative">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-xl transition-all duration-200"
              style={{ color: '#5483B3' }}
              onMouseEnter={e => e.currentTarget.style.background = '#EBF4FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#052659] text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Notifications</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {unreadCount} unread
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-5 text-center text-sm text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left border-b border-slate-100 px-4 py-3 hover:bg-slate-50 transition ${
                          !notification.read ? 'bg-blue-50/50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            {notification.priority === 'critical' ? '!' : notification.type === 'issue' ? 'I' : notification.type === 'tracking' ? 'T' : 'N'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-900 truncate">{notification.title}</p>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-[#052659]" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mt-2">
                              {new Date(notification.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-bold text-[#052659] hover:text-[#5483B3]"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={handleViewAll}
                    className="text-xs font-bold text-[#052659] hover:text-[#5483B3]"
                  >
                    View all
                  </button>
                </div>
              </div>
            )}
          </div>

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
