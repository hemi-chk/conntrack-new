import { 
  LayoutDashboard,
  Truck,
  CheckSquare,
  Package,
  MapPin,
  Settings,
  ChevronRight,
  User as UserIcon
} from 'lucide-react'
import { Link } from 'react-router-dom'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CheckSquare, label: 'Biddings', path: '/biddings' },
  { icon: Truck, label: 'Vehicle Management', path: '/vehicles' },
  { icon: UserIcon, label: 'Driver Management', path: '/drivers' },
  { icon: Package, label: 'Assigned Jobs', path: '/assigned-jobs' },
  { icon: MapPin, label: 'Tracking View', path: '/tracking' },
  { icon: CheckSquare, label: 'My Bids', path: '/my-bids' },
  { icon: Settings, label: 'Profile', path: '/profile' }
]

export function Sidebar({ isOpen, currentPath }) {
  return (
    <aside className={`fixed left-0 top-20 h-[calc(100vh-80px)] bg-white border-r border-slate-200 transition-all duration-300 z-40 overflow-hidden ${isOpen ? 'w-64' : 'w-0'}`}>
      <div className="p-4 border-b border-slate-100 mb-1">
        <div className="flex flex-col">
          <span className="text-xl font-bold text-primary truncate">
            Hayleys Logistics
          </span>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest -mt-0.5">
            Portal
          </span>
        </div>
      </div>
      <div className="p-3">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition group ${currentPath === item.path ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}