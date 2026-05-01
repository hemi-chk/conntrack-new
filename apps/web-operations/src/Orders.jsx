import { useEffect, useState } from "react";
import { PlusSquare, AlertTriangle } from "lucide-react";

function Orders({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [issueOrder, setIssueOrder] = useState(null);
  const [archiveOrder, setArchiveOrder] = useState(null);
  const [createdOrders, setCreatedOrders] = useState([]);
  const [archivedOrderIds, setArchivedOrderIds] = useState([]);

  const [issueTypes, setIssueTypes] = useState([]);
  const [priority, setPriority] = useState("Medium");
  const [issueDetails, setIssueDetails] = useState("");

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("createdOrders")) || [];
    const savedArchived =
      JSON.parse(localStorage.getItem("archivedOrderIds")) || [];

    setCreatedOrders(savedOrders);
    setArchivedOrderIds(savedArchived);
  }, []);

  const defaultOrders = [
    {
      id: "EXP-1023",
      type: "Export",
      supplier: "Global Trans",
      driver: "Peter Silva",
      pickup: "New York",
      destination: "London",
      status: "In Progress",
      vehicle: {
        insurance: "Valid until 30 June 2026",
        portPass: "Approved",
        condition: "Good Condition",
      },
      driverDetails: {
        name: "Peter Silva",
        license: "Valid",
        policeReport: "Verified",
      },
      progress: ["Created", "Bidding", "Pickup", "In Transit", "Delivered"],
      currentStep: 3,
    },
    {
      id: "IMP-2014",
      type: "Import",
      supplier: "OceanLink",
      driver: "Nimal Perera",
      pickup: "India",
      destination: "Colombo",
      status: "Awaiting Clearance",
      vehicle: {
        insurance: "Valid until 10 Aug 2026",
        portPass: "Pending Verification",
        condition: "Needs Inspection",
      },
      driverDetails: {
        name: "Nimal Perera",
        license: "Valid",
        policeReport: "Pending",
      },
      progress: ["Created", "Bidding", "Pickup", "In Transit", "Delivered"],
      currentStep: 1,
    },
    {
      id: "EXP-1008",
      type: "Export",
      supplier: "Prime Freight",
      driver: "Vimal Raj",
      pickup: "Brazil",
      destination: "Kandy",
      status: "Pending Pickup",
      vehicle: {
        insurance: "Valid until 12 Dec 2026",
        portPass: "Approved",
        condition: "Good Condition",
      },
      driverDetails: {
        name: "Vimal Raj",
        license: "Valid",
        policeReport: "Verified",
      },
      progress: ["Created", "Bidding", "Pickup", "In Transit", "Delivered"],
      currentStep: 2,
    },
    {
      id: "IMP-1985",
      type: "Import",
      supplier: "BlueWave",
      driver: "Kimal Deen",
      pickup: "China",
      destination: "New York",
      status: "Completed",
      vehicle: {
        insurance: "Valid until 01 Jan 2027",
        portPass: "Approved",
        condition: "Good Condition",
      },
      driverDetails: {
        name: "Kimal Deen",
        license: "Valid",
        policeReport: "Verified",
      },
      progress: ["Created", "Bidding", "Pickup", "In Transit", "Delivered"],
      currentStep: 4,
    },
    {
      id: "EXP-DEMO-2026",
      type: "Export",
      supplier: "Demo Logistics",
      driver: "Demo Driver",
      pickup: "Colombo",
      destination: "Galle",
      status: "Completed",
      vehicle: {
        insurance: "Valid until 15 Dec 2026",
        portPass: "Approved",
        condition: "Good Condition",
      },
      driverDetails: {
        name: "Demo Driver",
        license: "Valid",
        policeReport: "Verified",
      },
      progress: ["Created", "Bidding", "Pickup", "In Transit", "Delivered"],
      currentStep: 4,
    },
    {
      id: "EXP-1045",
      type: "Export",
      supplier: "Horizon",
      driver: "Saman Fernando",
      pickup: "Germany",
      destination: "Paris",
      status: "Issue Reported",
      vehicle: {
        insurance: "Expired",
        portPass: "Approved",
        condition: "Damaged Side Panel",
      },
      driverDetails: {
        name: "Saman Fernando",
        license: "Valid",
        policeReport: "Verified",
      },
      progress: ["Created", "Bidding", "Pickup", "In Transit", "Delivered"],
      currentStep: 3,
    },
    {
      id: "IMP-2234",
      type: "Import",
      supplier: "SkyCargo",
      driver: "Ruwan Silva",
      pickup: "Dubai",
      destination: "Colombo",
      status: "In Progress",
      vehicle: {
        insurance: "Valid until 17 May 2026",
        portPass: "Approved",
        condition: "Good Condition",
      },
      driverDetails: {
        name: "Ruwan Silva",
        license: "Valid",
        policeReport: "Verified",
      },
      progress: ["Created", "Bidding", "Pickup", "In Transit", "Delivered"],
      currentStep: 3,
    },
  ];

  const allOrders = [...createdOrders, ...defaultOrders];

  const orders = allOrders.map((order) => {
    if (archivedOrderIds.includes(order.id)) {
      return { ...order, status: "Archived" };
    }
    return order;
  });

  const filteredOrders = orders.filter((order) => {
    const tabMatch = activeTab === "All" || order.status === activeTab;
    const statusMatch = statusFilter === "All" || order.status === statusFilter;
    return tabMatch && statusMatch;
  });

  const statusBadge = (status) => {
    const base = "px-3 py-1 rounded-md text-xs font-medium";

    switch (status) {
      case "Created":
        return `${base} bg-purple-100 text-purple-700`;
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
      case "Archived":
        return `${base} bg-gray-200 text-gray-600`;
      default:
        return base;
    }
  };

  const panelBadge = (value) => {
    if (
      value === "Approved" ||
      value === "Verified" ||
      value === "Valid" ||
      value === "Good Condition"
    ) {
      return "bg-green-100 text-[#16A34A]";
    }

    if (
      value === "Pending" ||
      value === "Pending Verification" ||
      value === "Needs Inspection"
    ) {
      return "bg-orange-100 text-[#EA580C]";
    }

    return "bg-red-100 text-[#DC2626]";
  };

  const goToTracking = (order) => {
    sessionStorage.setItem("trackingOrder", JSON.stringify(order));
    onNavigate && onNavigate("/tracking");
  };

  const openIssueForm = (order) => {
    setOpenMenu(null);
    setIssueOrder(order);
    setIssueTypes([]);
    setPriority("Medium");
    setIssueDetails("");
  };

  const toggleIssueType = (type) => {
    setIssueTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  const sendIssueToLogistics = () => {
    if (!issueOrder) return;

    if (issueTypes.length === 0) {
      alert("Please select at least one issue type.");
      return;
    }

    if (!issueDetails.trim()) {
      alert("Please enter issue details.");
      return;
    }

    const issueReport = {
      orderId: issueOrder.id,
      supplier: issueOrder.supplier,
      driver: issueOrder.driver,
      route: `${issueOrder.pickup} → ${issueOrder.destination}`,
      issueTypes,
      priority,
      details: issueDetails,
      sentTo: "Logistics Team",
      createdAt: new Date().toLocaleString(),
    };

    sessionStorage.setItem("latestIssueReport", JSON.stringify(issueReport));

    alert(`Issue report for ${issueOrder.id} sent to Logistics Team.`);
    setIssueOrder(null);
  };

  const confirmArchiveOrder = () => {
    if (!archiveOrder) return;

    if (archiveOrder.status !== "Completed") {
      alert("Only completed orders can be archived.");
      setArchiveOrder(null);
      return;
    }

    const updatedArchived = [...archivedOrderIds, archiveOrder.id];
    setArchivedOrderIds(updatedArchived);
    localStorage.setItem("archivedOrderIds", JSON.stringify(updatedArchived));

    alert(`Order ${archiveOrder.id} archived successfully.`);
    setArchiveOrder(null);
    setSelectedOrder(null);
  };

  const handleAction = (action, order) => {
    setOpenMenu(null);

    switch (action) {
      case "details":
        setSelectedOrder(order);
        break;

      case "bidding":
        if (order.status !== "Created") {
          alert("Bidding can be opened only for newly created orders.");
          return;
        }
        sessionStorage.setItem("biddingOrder", JSON.stringify(order));
        onNavigate && onNavigate("/bidding");
        break;

      case "tracking":
        goToTracking(order);
        break;

      case "issue":
        openIssueForm(order);
        break;

      case "archive":
        if (order.status !== "Completed") {
          alert("Only completed orders can be archived.");
          return;
        }
        setArchiveOrder(order);
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
            {[
              "All",
              "Created",
              "In Progress",
              "Awaiting Clearance",
              "Pending Pickup",
              "Completed",
              "Issue Reported",
              "Archived",
            ].map((tab) => (
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
              <option value="Created">Created</option>
              <option value="In Progress">In Progress</option>
              <option value="Awaiting Clearance">Awaiting Clearance</option>
              <option value="Pending Pickup">Pending Pickup</option>
              <option value="Completed">Completed</option>
              <option value="Issue Reported">Issue Reported</option>
              <option value="Archived">Archived</option>
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
              <tr key={`${order.id}-${index}`} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-[#1E293B]">{order.id}</td>
                <td className="px-4 text-[#1E293B]">{order.type}</td>
                <td className="px-4 text-[#1E293B]">
                  {order.supplier || "-"}
                </td>
                <td className="px-4 text-[#1E293B]">{order.driver || "-"}</td>
                <td className="px-4 text-[#1E293B]">{order.pickup}</td>
                <td className="px-4 text-[#1E293B]">{order.destination}</td>

                <td className="px-4">
                  <span className={statusBadge(order.status)}>
                    {order.status}
                  </span>
                </td>

                <td className="px-4 relative">
                  {order.status === "Archived" ? (
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-gray-200 text-gray-600 px-3 py-1 rounded-md text-xs"
                    >
                      Review
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
                            onClick={() => handleAction("details", order)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#1E293B]"
                          >
                            View Details
                          </div>

                          {order.status === "Created" && (
                            <div
                              onClick={() => handleAction("bidding", order)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#1E293B]"
                            >
                              Open Bidding
                            </div>
                          )}

                          <div
                            onClick={() => handleAction("tracking", order)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#1E293B]"
                          >
                            Track Order
                          </div>

                          <div
                            onClick={() => handleAction("issue", order)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#DC2626]"
                          >
                            Report Issue
                          </div>

                          {order.status === "Completed" && (
                            <div
                              onClick={() => handleAction("archive", order)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[#16A34A]"
                            >
                              Archive Order
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedOrder && (
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
            <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  Order Details - {selectedOrder.id}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedOrder.pickup} → {selectedOrder.destination}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="text-sm px-4 py-2 rounded-md border border-slate-300 text-[#1E293B] hover:bg-slate-50"
              >
                Close Panel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <InfoBox label="Order Type" value={selectedOrder.type} />
              <InfoBox
                label="Supplier"
                value={selectedOrder.supplier || "-"}
              />
              <InfoBox label="Driver" value={selectedOrder.driver || "-"} />
              <div className="border border-slate-200 rounded-lg p-4 bg-[#EFF6FF]">
                <p className="text-xs text-slate-500 mb-1">Current Status</p>
                <span className={statusBadge(selectedOrder.status)}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            <SectionTitle title="Vehicle Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatusInfoBox
                label="Insurance"
                value={selectedOrder.vehicle?.insurance || "-"}
                tone={panelBadge(selectedOrder.vehicle?.insurance || "-")}
              />
              <StatusInfoBox
                label="Port Gate Pass"
                value={selectedOrder.vehicle?.portPass || "-"}
                tone={panelBadge(selectedOrder.vehicle?.portPass || "-")}
              />
              <StatusInfoBox
                label="Condition Status"
                value={selectedOrder.vehicle?.condition || "-"}
                tone={panelBadge(selectedOrder.vehicle?.condition || "-")}
              />
            </div>

            <SectionTitle title="Driver Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <InfoBox
                label="Driver Name"
                value={selectedOrder.driverDetails?.name || "-"}
              />
              <StatusInfoBox
                label="License Status"
                value={selectedOrder.driverDetails?.license || "-"}
                tone={panelBadge(selectedOrder.driverDetails?.license || "-")}
              />
              <StatusInfoBox
                label="Police Report"
                value={selectedOrder.driverDetails?.policeReport || "-"}
                tone={panelBadge(
                  selectedOrder.driverDetails?.policeReport || "-"
                )}
              />
            </div>

            <SectionTitle title="Order Progress" />
            <div className="mb-6 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                {selectedOrder.progress.map((step, idx) => {
                  const active = idx <= selectedOrder.currentStep;
                  const last = idx === selectedOrder.progress.length - 1;

                  return (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={`px-4 py-2 rounded-full text-xs font-medium ${
                          active
                            ? "bg-[#1E40AF] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {step}
                      </div>
                      {!last && (
                        <div
                          className={`w-8 h-0.5 ${
                            idx < selectedOrder.currentStep
                              ? "bg-[#1E40AF]"
                              : "bg-slate-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <SectionTitle title="Quick Actions" />
            <div className="flex flex-wrap gap-3">
              {selectedOrder.status === "Created" && (
                <button
                  onClick={() => handleAction("bidding", selectedOrder)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:opacity-90"
                >
                  Open Bidding
                </button>
              )}

              {selectedOrder.status !== "Archived" && (
                <>
                  <button
                    onClick={() => goToTracking(selectedOrder)}
                    className="bg-[#1E40AF] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1E3A8A]"
                  >
                    Track Order
                  </button>

                  <button
                    onClick={() => openIssueForm(selectedOrder)}
                    className="bg-orange-100 text-[#EA580C] px-4 py-2 rounded-md text-sm hover:opacity-90"
                  >
                    Report Issue
                  </button>
                </>
              )}

              {selectedOrder.status === "Completed" && (
                <button
                  onClick={() => setArchiveOrder(selectedOrder)}
                  className="bg-[#16A34A] text-white px-4 py-2 rounded-md text-sm hover:opacity-90"
                >
                  Archive Order
                </button>
              )}

              {selectedOrder.status === "Archived" && (
                <span className="bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm">
                  Archived for review
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {issueOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1E293B]">
                  Report Issue to Logistics
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Auto-filled order details. Select issue type and submit to
                  Logistics Team.
                </p>
              </div>

              <button
                onClick={() => setIssueOrder(null)}
                className="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-[#1E293B] hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <InfoBox label="Order No" value={issueOrder.id} />
              <InfoBox label="Supplier" value={issueOrder.supplier || "-"} />
              <InfoBox label="Driver" value={issueOrder.driver || "-"} />
              <InfoBox
                label="Route"
                value={`${issueOrder.pickup} → ${issueOrder.destination}`}
              />
            </div>

            <div className="mb-5">
              <p className="text-sm font-semibold text-[#1E293B] mb-3">
                Issue Type
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  "Vehicle Issue",
                  "Driver Issue",
                  "Document Issue",
                  "Delay Issue",
                  "Port Pass Issue",
                  "Insurance Issue",
                  "Other",
                ].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#1E293B] bg-[#EFF6FF] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={issueTypes.includes(type)}
                      onChange={() => toggleIssueType(type)}
                      className="accent-[#1E40AF]"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-[#1E293B] bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                  Issue Details
                </label>
                <textarea
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                  rows="4"
                  placeholder="Describe the issue clearly..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-[#1E293B] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIssueOrder(null)}
                className="px-4 py-2 rounded-md border border-slate-300 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={sendIssueToLogistics}
                className="px-4 py-2 rounded-md bg-[#1E40AF] text-white text-sm hover:bg-[#1E3A8A]"
              >
                Send to Logistics
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-[390px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="text-[#DC2626]" size={22} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1E293B]">
                  Archive Order?
                </h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to archive {archiveOrder.id}?
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-5">
              <p className="text-xs text-[#DC2626]">
                Only completed orders can be archived. Archived orders will be
                moved to the Archived tab for review.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setArchiveOrder(null)}
                className="px-4 py-2 rounded-md border border-slate-200 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmArchiveOrder}
                className="px-4 py-2 rounded-md bg-[#DC2626] text-white text-sm hover:bg-red-700"
              >
                Yes, Archive Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="mb-3">
      <h3 className="text-base font-semibold text-[#1E293B]">{title}</h3>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-[#EFF6FF]">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-[#1E293B]">{value}</p>
    </div>
  );
}

function StatusInfoBox({ label, value, tone }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-[#EFF6FF]">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <span className={`inline-block px-3 py-1 rounded-full text-xs ${tone}`}>
        {value}
      </span>
    </div>
  );
}

export default Orders;