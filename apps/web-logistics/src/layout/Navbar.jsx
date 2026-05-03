import { useNavigate } from "react-router-dom";
import { Bell, User, Menu } from "lucide-react";
import logo from "@/assets/logo.png";

export default function Navbar({ onMenuClick }) {
    const navigate = useNavigate();

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
                        <p className="text-sm font-medium">Binuwara</p>
                        <p className="text-xs text-blue-200 flex items-center gap-1">
                            Logistics Handler
                        </p>
                    </div>
                </button>
            </div>

        </nav>
    );
}