import {
  LayoutDashboard,
  Search,
  Package,
  Truck,
  FileText,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Search, label: "Tracking", path: "/tracking" },
  { icon: Package, label: "Import Orders", path: "/import" },
  { icon: Truck, label: "Export Orders", path: "/export" },
  { icon: AlertTriangle, label: "Clearance Issues", path: "/clearance" },
  { icon: FileText, label: "Reports", path: "/reports" },

]

export default function Sidebar({ isOpen, currentPath, onNavigate }) {
  return (
    <aside
      className={`fixed left-0 top-20 h-[calc(100vh-80px)] bg-white border-r border-slate-200 transition-all duration-300 z-40 overflow-y-auto ${isOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
    >
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition group ${isActive
                  ? "bg-[#EFF6FF] text-[#1E40AF]"
                  : "text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1E40AF]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </div>

                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition"
                />
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}