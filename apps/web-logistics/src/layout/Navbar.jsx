import { useNavigate } from "react-router-dom";
import { Bell, User, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <LogOut size={22} className="text-[#1E40AF]" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Sign out?</h2>
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1E40AF] text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Yes, Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Navbar({ onMenuClick }) {
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{"name":"Logistics"}')
    const userName = user.name || 'Logistics'

    const confirmLogout = () => {
        localStorage.clear();
        window.location.href = 'http://127.0.0.1:5173?logout=true';
    };

    return (
        <>
            {showLogoutModal && (
                <LogoutModal
                    onConfirm={confirmLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}

            <nav className="h-20 bg-[#1E40AF] text-white flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 shadow-md">

                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg hover:bg-blue-700 transition focus:outline-none"
                    >
                        <Menu size={22} />
                    </button>

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <img
                            src={logo}
                            alt="ConnTrack"
                            className="h-9 w-auto object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    <button className="relative p-2 rounded-lg hover:bg-blue-700 transition focus:outline-none">
                        <Bell size={22} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* Profile Button */}
                    <button
                        onClick={() => navigate("/profile")}
                        className="flex items-center gap-3 bg-blue-700 hover:bg-blue-600 rounded-lg px-3 py-2 transition focus:outline-none"
                    >
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <User size={16} className="text-[#1E40AF]" />
                        </div>

                        <div className="hidden sm:block text-left leading-tight">
                            <p className="text-sm font-medium">{userName}</p>
                            <p className="text-xs text-blue-200 flex items-center gap-1">
                                Logistics Handler
                            </p>
                        </div>
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 rounded-lg px-3 py-2 transition focus:outline-none text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>

            </nav>
        </>
    );
}
