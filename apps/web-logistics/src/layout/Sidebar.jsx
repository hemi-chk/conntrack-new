import {
  LayoutDashboard,
  Package,
  Truck,
  FileText,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
  },
  {
    icon: Package,
    label: "Import Orders",
    path: "/import",
  },
  {
    icon: Truck,
    label: "Export Orders",
    path: "/export",
  },
  {
    icon: AlertTriangle,
    label: "Issues",
    path: "/issues",
  },
  {
    icon: FileText,
    label: "Reports",
    path: "/reports",
  },
];

function NavItem({ item, isActive, onNavigate }) {
  const Icon = item.icon;

  return (
    <button
      onClick={() => onNavigate(item.path)}
      className={`
        relative
        w-full
        flex
        items-center
        gap-3
        px-4
        py-3
        rounded-xl
        text-sm
        font-medium
        transition-all
        duration-200
        group
        ${
          isActive
            ? "bg-[#052659] text-white"
            : "text-[#7DA0CA] hover:bg-[#052659]/55 hover:text-white"
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-[#5483B3]" />
      )}

      {/* Icon */}
      <Icon
        size={18}
        strokeWidth={1.8}
        className={isActive ? "text-[#7DA0CA]" : ""}
      />

      {/* Label */}
      <span className="whitespace-nowrap">
        {item.label}
      </span>

      {/* Arrow */}
      {isActive && (
        <ChevronRight
          size={14}
          strokeWidth={2}
          className="ml-auto text-[#7DA0CA]/70"
        />
      )}
    </button>
  );
}

export default function Sidebar({
  isOpen,
  currentPath,
  onNavigate,
}) {
  return (
    <aside
      className={`
        fixed
        left-0
        top-0
        h-screen
        z-40
        flex
        flex-col
        overflow-hidden
        bg-[#021024]
        transition-all
        duration-300
        ${isOpen ? "w-[309px]" : "w-0"}
      `}
    >
      {/* ================= LOGO ================= */}
      <div
        className="
          h-[74px]
          shrink-0
          flex
          items-center
          px-6
          border-b
          border-[#5483B3]/15
        "
      >
        <div className="flex items-center gap-3">
          {/* Logo box */}
          <div
            className="
              w-10
              h-10
              rounded-xl
              flex
              items-center
              justify-center
              shadow-lg
              bg-gradient-to-br
              from-[#052659]
              to-[#5483B3]
            "
          >
            <span className="text-white font-extrabold text-base">
              C
            </span>
          </div>

          {/* Brand */}
          <span className="text-white font-bold text-[18px] tracking-tight">
            Con<span className="text-[#7DA0CA]">Track</span>
          </span>
        </div>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav
        className="
          flex-1
          flex
          flex-col
          justify-center
          overflow-y-auto
          overflow-x-hidden
          px-3.5
          py-6
          space-y-1
        "
      >
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={currentPath === item.path}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* ================= FOOTER ================= */}
      <div
        className="
          shrink-0
          px-3.5
          pb-5
          pt-3
          border-t
          border-[#5483B3]/15
        "
      >
        <div
          className="
            px-3.5
            py-3
            rounded-xl
            bg-[#052659]
          "
        >
          <p className="text-xs font-semibold text-[#7DA0CA]">
            ConTrack v1.0.0
          </p>

          <p className="text-[11px] mt-1 text-[#5483B3]">
            Logistics Portal
          </p>
        </div>
      </div>
    </aside>
  );
}
