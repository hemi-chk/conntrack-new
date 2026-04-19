import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Search,
  Package,
  Truck,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Tracking", icon: Search, to: "/tracking" },
  { label: "Import Orders", icon: Package, to: "/import" },
  { label: "Export Orders", icon: Truck, to: "/export" },
  { label: "Reports", icon: FileText, to: "/reports" },
  { label: "Settings", icon: Settings, to: "/settings" },
]

export default function Sidebar() {
  return (
    <aside className="flex flex-col h-screen w-64 border-r bg-card text-card-foreground shrink-0">

      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">ConnTrack</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Logistics System</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="border-t px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold select-none">
            B
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Binuwara</p>
            <p className="text-xs text-muted-foreground truncate">Logistics Handler</p>
          </div>
        </div>
      </div>

    </aside>
  )
}
