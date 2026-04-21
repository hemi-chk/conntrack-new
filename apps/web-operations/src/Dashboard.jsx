import { useState } from "react";

function Dashboard() {

  // STATE: used to store which filter is currently active (clicked card)
  const [filter, setFilter] = useState(null);

  // SAMPLE DATA: this will later come from backend (Supabase)
  const orders = [
    { id: "EXP-1023", type: "Export", supplier: "Global Trans", status: "In Progress" },
    { id: "IMP-2014", type: "Import", supplier: "OceanLink Carriers", status: "Awaiting Clearance" },
    { id: "EXP-1008", type: "Export", supplier: "Prime Freight", status: "Pending Pickup" },
    { id: "IMP-1985", type: "Import", supplier: "BlueWave Transport", status: "Completed" },
    { id: "EXP-1045", type: "Export", supplier: "Horizon Shipping", status: "Issue Reported" },
  ];

  // FILTER LOGIC:
  // Based on selected card, filter the orders dynamically
  const filteredOrders = orders.filter(order => {

    // show only export orders
    if (filter === "export") return order.type === "Export";

    // show only import orders
    if (filter === "import") return order.type === "Import";

    // active = all orders except completed
    if (filter === "active") return order.status !== "Completed";

    // show only issues
    if (filter === "issues") return order.status === "Issue Reported";

    // show only completed
    if (filter === "completed") return order.status === "Completed";

    // bidding = awaiting clearance (your current logic)
    if (filter === "bidding") return order.status === "Awaiting Clearance";

    // default → show all
    return true;
  });

  // STATUS COLOR LOGIC:
  // Assign different colors based on order status
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

      {/* MINI SUMMARY CARDS */}
      {/* Clicking a card updates the filter state */}
      <div className="grid grid-cols-6 gap-6 mb-6">

        <Card title="Active Orders" number="4" filterKey="active" current={filter} setFilter={setFilter} />
        <Card title="Export Orders" number="3" filterKey="export" current={filter} setFilter={setFilter} />
        <Card title="Import Orders" number="2" filterKey="import" current={filter} setFilter={setFilter} />
        <Card title="Orders in Bidding" number="1" filterKey="bidding" current={filter} setFilter={setFilter} />

        {/* Special styled cards */}
        <Card title="Completed Orders" number="1" filterKey="completed" current={filter} setFilter={setFilter} color="bg-[#16A34A]" white />
        <Card title="Orders with Issues" number="1" filterKey="issues" current={filter} setFilter={setFilter} color="bg-[#DC2626]" white />

      </div>

      {/* ORDER TABLE */}
      <div className="bg-[#FFFFFF] rounded-xl shadow-md p-6">

        {/* Table Header */}
        <div className="border-b pb-3 mb-4">
          <h3 className="font-semibold text-[#1E293B]">
            Order Overview
          </h3>
        </div>

        <table className="w-full text-sm">

          {/* TABLE HEAD */}
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

            {/* LOOP THROUGH FILTERED ORDERS */}
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

                {/* Status with dynamic color */}
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

// CARD COMPONENT
function Card({ title, number, filterKey, current, setFilter, color, white }) {

  // Check if this card is currently selected
  const active = current === filterKey;

  return (
    <div
      // When clicked → update filter
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