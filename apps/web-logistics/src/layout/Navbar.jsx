import { useState } from "react";
import { Bell, User, Menu, LogOut, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.png";

export default function Navbar({ onMenuClick }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        console.log("Logging out...");
        // Add your logout logic here (e.g., clearing tokens, redirecting)
    };

    return (
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
                    <span className="hidden md:block text-sm font-semibold tracking-wide">
                        ConnTrack
                    </span>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-lg hover:bg-blue-700 transition focus:outline-none">
                    <Bell size={22} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Profile Dropdown Menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-3 bg-blue-700 hover:bg-blue-600 rounded-lg px-3 py-2 transition focus:outline-none"
                    >
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <User size={16} className="text-[#1E40AF]" />
                        </div>

                        <div className="hidden sm:block text-left leading-tight">
                            <p className="text-sm font-medium">Binuwara</p>
                            <p className="text-xs text-blue-200 flex items-center gap-1">
                                Logistics Handler <ChevronDown size={12} />
                            </p>
                        </div>
                    </button>

                    {/* Dropdown Content */}
                    {isMenuOpen && (
                        <>
                            {/* Transparent overlay to close menu when clicking outside */}
                            <div
                                className="fixed inset-0 z-[-1]"
                                onClick={() => setIsMenuOpen(false)}
                            ></div>

                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-semibold"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

        </nav>
    );
}