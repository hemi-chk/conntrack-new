import { useState } from "react";

function Dashboard({ onNavigate }) {

  // STATE: Tracks which filter is currently selected (from summary cards)
  const [filter, setFilter] = useState(null);

  // MOCK DATA: Represents order records (will be replaced by backend data later)
  const orders = [
    { id: "EXP-1023", type: "Export", supplier: "Global Trans", status: "In Progress" },
    { id: "IMP-2014", type: "Import", supplier: "OceanLink Carriers", status: "Awaiting Clearance" },
    { id: "EXP-1008", type: "Export", supplier: "Prime Freight", status: "Pending Pickup" },
    { id: "IMP-1985", type: "Import", supplier: "BlueWave Transport", status: "Completed" },
    { id: "EXP-1045", type: "Export", supplier: "Horizon Shipping", status: "Issue Reported" },
  ];

  // FILTER LOGIC:
  // Dynamically filters orders based on selected card
  const filteredOrders = orders.filter(order => {

    // Filter export orders
    if (filter === "export") return order.type === "Export";

    // Filter import orders
    if (filter === "import") return order.type === "Import";

    // Active = all orders except completed
    if (filter === "active") return order.status !== "Completed";

    // Show only orders with issues
    if (filter === "issues") return order.status === "Issue Reported";

    // Show completed orders
    if (filter === "completed") return order.status === "Completed";

    // Bidding logic (currently mapped to awaiting clearance)
    if (filter === "bidding") return order.status === "Awaiting Clearance";

    // Default case: return all orders
    return true;
  });

  // STATUS COLOR MAPPING:
  // Assigns UI color styles based on order status
  const statusColor = (status) => {

    if (status === "In Progress") 
      return "bg-[#EFF6FF] text-[#1E293B]";

    if (status === "Awaiting Clearance") 
      return "bg-orange-100 text-[#EA580C]";

    if (status === "Pending Pickup") 
      return "bg-[#EFF6FF] text-[#1E40AF]";

    if (status === "Completed") 
      return "bg-green-100 text-[#16A34A]";

    if (status === "Issue Reported") 
      return "bg-red-100 text-[#DC2626]";
  };

  return (
    <div className="p-8 bg-[#EFF6FF] h-full overflow-hidden">

      {/* SUMMARY CARDS SECTION */}
      {/* Each card applies a specific filter when clicked */}
      <div className="grid grid-cols-6 gap-6 mb-6">

        <Card title="Active Orders" number="4" filterKey="active" current={filter} setFilter={setFilter} />
        <Card title="Export Orders" number="3" filterKey="export" current={filter} setFilter={setFilter} />
        <Card title="Import Orders" number="2" filterKey="import" current={filter} setFilter={setFilter} />
        <Card title="Orders in Bidding" number="1" filterKey="bidding" current={filter} setFilter={setFilter} />

        {/* Highlight cards with custom colors */}
        <Card title="Completed Orders" number="1" filterKey="completed" current={filter} setFilter={setFilter} color="bg-[#16A34A]" white />
        <Card title="Orders with Issues" number="1" filterKey="issues" current={filter} setFilter={setFilter} color="bg-[#DC2626]" white />

      </div>

      {/* ORDER TABLE SECTION */}
      <div className="bg-[#FFFFFF] rounded-xl shadow-md p-6">

        {/* TABLE HEADER + ACTION BUTTON */}
        <div className="border-b pb-3 mb-4 flex justify-between items-center">

          {/* Section title */}
          <h3 className="font-semibold text-[#1E293B]">
            Order Overview
          </h3>

          {/* Navigation button to Create Order page */}
          <button
            onClick={() => onNavigate('/create')}
            className="bg-[#1E40AF] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1E3A8A] transition"
          >
            + Create New Order
          </button>

        </div>

        {/* TABLE STRUCTURE */}
        <table className="w-full text-sm">

          {/* TABLE HEADERS */}
          <thead className="bg-[#EFF6FF] text-[#1E293B] font-semibold border-b">
            <tr>
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="text-left">Type</th>
              <th className="text-left">Supplier</th>
              <th className="text-left">Status</th>
              <th className="text-left">Action</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-gray-200">

            {/* Render filtered order list */}
            {filteredOrders.map((order, index) => (
              <tr key={index} className="hover:bg-[#EFF6FF]">

                {/* Order ID */}
                <td className="py-4 px-4 font-medium">{order.id}</td>

                {/* Order Type */}
                <td>
                  <span className="bg-[#EFF6FF] text-[#1E40AF] px-3 py-1 rounded-md font-medium">
                    {order.type}
                  </span>
                </td>

                {/* Supplier Name */}
                <td>{order.supplier}</td>

                {/* Status with dynamic styling */}
                <td>
                  <span className={`${statusColor(order.status)} px-3 py-1 rounded-md font-medium`}>
                    {order.status}
                  </span>
                </td>

                {/* Action button */}
                <td>
                  <button className="bg-[#1E40AF] text-white px-4 py-1 rounded-md">
                    View
                  </button>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

// REUSABLE CARD COMPONENT
function Card({ title, number, filterKey, current, setFilter, color, white }) {

  // Determines if the card is currently active
  const active = current === filterKey;

  return (
    <div
      // On click → update filter state
      onClick={() => setFilter(filterKey)}

      className={`
        ${color ? color : active ? "bg-[#1E40AF] text-white" : "bg-white"}
        ${white ? "text-white" : ""}
        p-6 rounded-xl shadow-md cursor-pointer transition
      `}
    >
      <p className="text-sm font-semibold">{title}</p>
      <h3 className="text-3xl font-bold mt-3">{number}</h3>
    </div>
  );
}

export default Dashboard;