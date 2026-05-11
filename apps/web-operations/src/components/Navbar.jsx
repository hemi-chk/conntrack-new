import { Bell, User, Menu } from 'lucide-react'

function Navbar({ onMenuClick }) {
  return (
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

          <span className="text-sm font-medium">Ramaza</span>
        </div>
      </div>
    </nav>
  )
}

export default Navbar