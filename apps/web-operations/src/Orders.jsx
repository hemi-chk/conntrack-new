import { useState } from "react";
import { PlusSquare } from "lucide-react";

function Orders({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);

  const orders = [
    { id: "EXP-1023", type: "Export", supplier: "Global Trans", driver: "Peter", pickup: "New York", destination: "London", status: "In Progress" },
    { id: "IMP-2014", type: "Import", supplier: "OceanLink", driver: "Nimal", pickup: "India", destination: "Colombo", status: "Awaiting Clearance" },
    { id: "EXP-1008", type: "Export", supplier: "Prime Freight", driver: "Vimal", pickup: "Brazil", destination: "Kandy", status: "Pending Pickup" },
    { id: "IMP-1985", type: "Import", supplier: "BlueWave", driver: "Kimal", pickup: "China", destination: "New York", status: "Completed" },
    { id: "EXP-1045", type: "Export", supplier: "Horizon", driver: "Saman", pickup: "Germany", destination: "Paris", status: "Issue Reported" },
    { id: "IMP-2234", type: "Import", supplier: "SkyCargo", driver: "Ruwan", pickup: "Dubai", destination: "Colombo", status: "In Progress" },
    { id: "EXP-3321", type: "Export", supplier: "Alpha Logistics", driver: "Sunil", pickup: "Canada", destination: "USA", status: "Completed" },
    { id: "IMP-4422", type: "Import", supplier: "MegaTrans", driver: "Arun", pickup: "Japan", destination: "India", status: "Pending Pickup" },
    { id: "EXP-5533", type: "Export", supplier: "TransWorld", driver: "Rizwan", pickup: "Spain", destination: "Italy", status: "Issue Reported" },
    { id: "IMP-6644", type: "Import", supplier: "CargoLine", driver: "Ajith", pickup: "Thailand", destination: "Sri Lanka", status: "Completed" },
  ];

  const filteredOrders = orders.filter((order) => {
    const tabMatch = activeTab === "All" || order.status === activeTab;
    const statusMatch = statusFilter === "All" || order.status === statusFilter;
    return tabMatch && statusMatch;
  });

  const statusBadge = (status) => {
    const base = "px-3 py-1 rounded-md text-xs font-medium";

    switch (status) {
      case "In Progress":
        return `${base} bg-[#EFF6FF] text-[#1E40AF]`;
      case "Awaiting Clearance":
        return `${base} bg-orange-100 text-[#EA580C]`;
      case "Pending Pickup":
        return `${base} bg-[#EFF6FF] text-[#1E293B]`;
      case "Issue Reported":
        return `${base} bg-red-100 text-[#DC2626]`;
      case "Completed":
        return `${base} bg-green-100 text-[#16A34A]`;
      default:
        return base;
    }
  };

  const handleAction = (action, order) => {
    setOpenMenu(null);

    switch (action) {
      case "bidding":
      case "viewBids":
        onNavigate && onNavigate("/bidding");
        break;

      case "tracking":
        onNavigate && onNavigate("/tracking");
        break;

      case "issue":
        onNavigate && onNavigate("/issues");
        break;

      case "close":
        alert(`Order ${order.id} Closed`);
        break;

      default:
        break;
    }
  };

  return (
    <div className="bg-[#EFF6FF] p-6 h-full overflow-auto">
      <div className="bg-[#FFFFFF] rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3 flex-wrap">
            {["All", "In Progress", "Awaiting Clearance", "Pending Pickup", "Completed", "Issue Reported"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm transition ${
                  activeTab === tab
                    ? "bg-[#1E40AF] text-[#FFFFFF]"
                    : "bg-gray-100 text-[#1E293B] hover:bg-[#EFF6FF]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 px-3 py-1.5 rounded-md text-sm text-[#1E293B] bg-[#FFFFFF]"
            >
              <option value="All">Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Clearance">Awaiting Clearance</option>
              <option value="Pending Pickup">Pending Pickup</option>
              <option value="Completed">Completed</option>
              <option value="Issue Reported">Issue Reported</option>
            </select>

            <button
              onClick={() => onNavigate && onNavigate("/create")}
              className="flex items-center gap-2 bg-[#1E40AF] text-[#FFFFFF] px-4 py-1.5 rounded-md text-sm hover:bg-[#1E3A8A]"
            >
              <PlusSquare size={16} />
              New Order
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#EFF6FF] text-[#1E293B] text-sm font-medium">
            <tr>
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="px-4 text-left">Type</th>
              <th className="px-4 text-left">Supplier</th>
              <th className="px-4 text-left">Driver</th>
              <th className="px-4 text-left">Pickup</th>
              <th className="px-4 text-left">Destination</th>
              <th className="px-4 text-left">Status</th>
              <th className="px-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredOrders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-[#1E293B]">{order.id}</td>
                <td className="px-4 text-[#1E293B]">{order.type}</td>
                <td className="px-4 text-[#1E293B]">{order.supplier}</td>
                <td className="px-4 text-[#1E293B]">{order.driver}</td>
                <td className="px-4 text-[#1E293B]">{order.pickup}</td>
                <td className="px-4 text-[#1E293B]">{order.destination}</td>

                <td className="px-4">
                  <span className={statusBadge(order.status)}>
                    {order.status}
                  </span>
                </td>

                <td className="px-4 relative">
                  {order.status === "Completed" ? (
                    <button
                      onClick={() => alert(`Viewing order ${order.id}`)}
                      className="bg-[#1E40AF] text-[#FFFFFF] px-3 py-1 rounded-md text-xs hover:bg-[#1E3A8A]"
                    >
                      View
                    </button>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === index ? null : index)
                        }
                        className="bg-[#1E40AF] text-[#FFFFFF] px-3 py-1 rounded-md text-xs hover:bg-[#1E3A8A]"
                      >
                        Manage ▾
                      </button>

                      {openMenu === index && (
                        <div className="absolute right-0 mt-2 bg-[#FFFFFF] shadow-lg rounded-md w-40 text-xs z-50 border border-slate-200">
                          <div
                            onClick={() => handleAction("bidding", order)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#1E293B]"
                          >
                            Open Bidding
                          </div>

                          <div
                            onClick={() => handleAction("viewBids", order)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#1E293B]"
                          >
                            View Bids
                          </div>

                          <div
                            onClick={() => handleAction("tracking", order)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#1E293B]"
                          >
                            Tracking
                          </div>

                          <div
                            onClick={() => handleAction("issue", order)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#DC2626]"
                          >
                            Report Issue
                          </div>

                          <div
                            onClick={() => handleAction("close", order)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#1E293B]"
                          >
                            Close Order
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Orders;