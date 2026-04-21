import { Bell, User, Menu } from 'lucide-react'

export function Header({ onMenuClick }) {
  return (
    <nav className="h-20 bg-primary text-white flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 shadow-lg">
      
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Menu size={22} />
        </button>
        {/* Placeholder text if logo is missing */}
        <div className="font-bold text-xl tracking-wide">ConTrack</div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-blue-700 transition relative">
          <Bell size={22} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 bg-blue-700 rounded-lg px-3 py-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <User size={16} className="text-primary" />
          </div>
          <span className="text-sm font-medium">Supplier</span>
        </div>
      </div>

    </nav>
  )
}