
import {
  LayoutDashboard, Truck, Building2, ClipboardList,
  Users, Package, FileText, CheckSquare, Settings,
  ChevronRight, TrendingUp, Globe, BarChart2
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', section: null },
  { icon: Package, label: 'Orders', path: '/orders', section: 'Operations' },
  { icon: CheckSquare, label: 'Bids', path: '/bids', section: 'Operations' },
  { icon: Truck, label: 'Drivers', path: '/drivers', section: 'Fleet' },
  { icon: Building2, label: 'Suppliers', path: '/suppliers', section: 'Fleet' },
  { icon: ClipboardList, label: 'Operations', path: '/operations', section: 'Team' },
  { icon: Users, label: 'Logistics', path: '/logistics', section: 'Team' },
  { icon: FileText, label: 'Documents', path: '/documents', section: 'System' },
  { icon: Settings, label: 'Settings', path: '/settings', section: 'System' },

]

function Sidebar({ isOpen, currentPath, onNavigate, darkMode }) {
  // WHY: Groups menu items by section for better organization
  const sections = ['Operations', 'Fleet', 'Team', 'System']

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] transition-all duration-300 z-40 overflow-y-auto ${
      isOpen ? 'w-64' : 'w-0 overflow-hidden'
    } ${darkMode
      ? 'bg-[#1a1a2e] border-r border-[#2d2d44]'
      : 'bg-white border-r border-slate-100'
    }`}>
      <div className="p-4">

        {/* Dashboard — no section */}
        {menuItems.filter(i => !i.section).map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition mb-1 group ${
              currentPath === item.path
                ? 'bg-[#1E40AF] text-white shadow-md shadow-blue-200'
                : darkMode
                  ? 'text-slate-400 hover:bg-[#2d2d44] hover:text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#1E40AF]'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {currentPath === item.path && <ChevronRight size={14} />}
          </button>
        ))}

        {/* Sectioned menu items */}
        {sections.map((section) => {
          const items = menuItems.filter(i => i.section === section)
          if (items.length === 0) return null
          return (
            <div key={section} className="mt-6">
              <p className={`text-xs font-bold uppercase tracking-widest px-3 mb-2 ${
                darkMode ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {section}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition group ${
                      currentPath === item.path
                        ? 'bg-[#1E40AF] text-white shadow-md shadow-blue-200'
                        : darkMode
                          ? 'text-slate-400 hover:bg-[#2d2d44] hover:text-white'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-[#1E40AF]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {currentPath === item.path && <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {/* Bottom — Version */}
        <div className={`mt-8 p-3 rounded-xl ${
          darkMode ? 'bg-[#2d2d44]' : 'bg-slate-50'
        }`}>
          <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            ConTrack v1.0.0
          </p>
          <p className="text-xs text-slate-400 mt-0.5">University Project 2026</p>
        </div>

      </div>
    </aside>
  )
}

export default Sidebar