import {
  LayoutDashboard,
  PlusSquare,
  Package,
  Truck,
  AlertCircle,
  Gavel,
  ChevronRight,
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: PlusSquare, label: 'Create Order', path: '/create' },
  { icon: Package, label: 'Orders', path: '/orders' },
  { icon: Gavel, label: 'Bidding', path: '/bidding' },
  { icon: Truck, label: 'Tracking', path: '/tracking' },
  { icon: AlertCircle, label: 'Issues', path: '/issues' },
]

function NavItem({ item, isActive, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(item.path)}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
        isActive ? 'text-white' : 'text-[#7DA0CA] hover:text-white'
      }`}
      style={{ background: isActive ? '#052659' : 'transparent' }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(5,38,89,0.55)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full" style={{ background: '#5483B3' }} />
      )}
      <item.icon size={17} style={{ color: isActive ? '#7DA0CA' : undefined }} />
      <span className="whitespace-nowrap">{item.label}</span>
      {isActive && <ChevronRight size={13} className="ml-auto" style={{ color: '#7DA0CA', opacity: 0.6 }} />}
    </button>
  )
}

function Sidebar({ isOpen, currentPath, onNavigate }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col overflow-hidden transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      }`}
      style={{ background: '#021024' }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center px-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(84,131,179,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #052659 0%, #5483B3 100%)' }}
          >
            <span className="text-white font-extrabold text-sm">C</span>
          </div>
          <span className="font-bold text-[17px] text-white tracking-tight whitespace-nowrap">
            Con<span style={{ color: '#7DA0CA' }}>Track</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col justify-center overflow-y-auto overflow-x-hidden px-3 py-4 space-y-0.5">
        {menuItems.map(item => (
          <NavItem
            key={item.path}
            item={item}
            isActive={currentPath === item.path}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-3 pb-4 shrink-0"
        style={{ borderTop: '1px solid rgba(84,131,179,0.15)' }}
      >
        <div className="mt-3 px-3 py-2.5 rounded-xl" style={{ background: '#052659' }}>
          <p className="text-xs font-semibold whitespace-nowrap" style={{ color: '#7DA0CA' }}>ConTrack v1.0.0</p>
          <p className="text-[11px] mt-0.5 whitespace-nowrap" style={{ color: '#5483B3' }}>Operations Portal</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
