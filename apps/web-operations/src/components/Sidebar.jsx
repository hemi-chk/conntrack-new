import {
  LayoutDashboard,
  PlusSquare,
  Package,
  Building2,
  Truck,
  AlertCircle,
  Gavel,
  FileBarChart,
  ChevronRight,
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: PlusSquare, label: 'Create Order', path: '/create' },
  { icon: Package, label: 'Orders', path: '/orders' },
  { icon: Building2, label: 'Suppliers', path: '/suppliers' },
  { icon: Truck, label: 'Tracking', path: '/tracking' },
  { icon: AlertCircle, label: 'Issues', path: '/issues' },
  { icon: Gavel, label: 'Bidding', path: '/bidding' },
  { icon: FileBarChart, label: 'Reports', path: '/reports' },
]

function Sidebar({ isOpen, currentPath, onNavigate }) {
  return (
    <aside
      className={`fixed left-0 top-20 z-40 h-[calc(100vh-80px)] overflow-y-auto border-r border-slate-200 bg-white transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}
    >
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition ${
                currentPath === item.path
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>

              <ChevronRight
                size={14}
                className="opacity-0 transition group-hover:opacity-100"
              />
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar