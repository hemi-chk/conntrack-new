import {
  AlertCircle,
  ChevronRight,
  Gavel,
  LayoutDashboard,
  Package,
  PlusSquare,
  Truck,
} from "lucide-react";

// Sidebar menu list.
// Each item has an icon, label, and path used for page navigation.
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: PlusSquare, label: "Create Order", path: "/create" },
  { icon: Package, label: "Orders", path: "/orders" },
  { icon: Gavel, label: "Bidding", path: "/bidding" },
  { icon: Truck, label: "Tracking", path: "/tracking" },
  { icon: AlertCircle, label: "Issues", path: "/issues" },
];

function NavItem({ item, isActive, onNavigate }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "text-white"
          : "text-[#7DA0CA] hover:text-white"
      }`}
      style={{
        background: isActive
          ? "#052659"
          : "transparent",
      }}
      onMouseEnter={(event) => {
        if (!isActive) {
          event.currentTarget.style.background =
            "rgba(5,38,89,0.55)";
        }
      }}
      onMouseLeave={(event) => {
        if (!isActive) {
          event.currentTarget.style.background =
            "transparent";
        }
      }}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
          style={{ background: "#5483B3" }}
        />
      )}

      <Icon
        size={17}
        style={{
          color: isActive
            ? "#7DA0CA"
            : undefined,
        }}
      />

      <span className="whitespace-nowrap">
        {item.label}
      </span>

      {isActive && (
        <ChevronRight
          size={13}
          className="ml-auto"
          style={{
            color: "#7DA0CA",
            opacity: 0.6,
          }}
        />
      )}
    </button>
  );
}

function Sidebar({
  isOpen,
  currentPath,
  onNavigate,
}) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden transition-all duration-300 ${
        isOpen ? "w-64" : "w-0"
      }`}
      style={{ background: "#021024" }}
    >
      {/* Logo */}
      <div
        className="flex h-16 shrink-0 items-center px-5"
        style={{
          borderBottom:
            "1px solid rgba(84,131,179,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #052659 0%, #5483B3 100%)",
            }}
          >
            <span className="text-sm font-extrabold text-white">
              C
            </span>
          </div>

          <span className="whitespace-nowrap text-[17px] font-bold tracking-tight text-white">
            Con
            <span style={{ color: "#7DA0CA" }}>
              Track
            </span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto px-3 py-4">
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={
              currentPath === item.path
            }
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Footer */}
      <div
        className="shrink-0 px-3 pb-4"
        style={{
          borderTop:
            "1px solid rgba(84,131,179,0.15)",
        }}
      >
        <div
          className="mt-3 rounded-xl px-3 py-2.5"
          style={{ background: "#052659" }}
        >
          <p
            className="whitespace-nowrap text-xs font-semibold"
            style={{ color: "#7DA0CA" }}
          >
            ConTrack v1.0.0
          </p>

          <p
            className="mt-0.5 whitespace-nowrap text-[11px]"
            style={{ color: "#5483B3" }}
          >
            Operations Portal
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;