import { useEffect, useState } from "react";
import { PlusSquare, AlertTriangle } from "lucide-react";

function Orders({ onNavigate }) {
  // Main page states for tabs, dropdown menu, selected order panel, issue popup, archive popup, and order data
  const [activeTab, setActiveTab] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [issueOrder, setIssueOrder] = useState(null);
  const [archiveOrder, setArchiveOrder] = useState(null);
  const [ordersData, setOrdersData] = useState([]);
  const [archivedOrderIds, setArchivedOrderIds] = useState([]);
  const [reportedIssues, setReportedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Issue reporting form states
  const [issueTypes, setIssueTypes] = useState([]);
  const [priority, setPriority] = useState("medium");
  const [issueDetails, setIssueDetails] = useState("");

  // Loads orders from backend and restores locally saved archived orders/issues
  useEffect(() => {
    fetchOrders();

    const savedArchived =
      JSON.parse(localStorage.getItem("archivedOrderIds")) || [];

    const savedIssues =
      JSON.parse(localStorage.getItem("reportedIssues")) || [];

    setArchivedOrderIds(savedArchived);
    setReportedIssues(savedIssues);
  }, []);

  // Converts database status into readable UI status
  const normalizeStatus = (status) => {
    if (!status) return "Created";

    const cleanStatus = status.toLowerCase();

    switch (cleanStatus) {
      case "created":
        return "Created";
      case "open_for_bids":
      case "open for bids":
        return "Open for Bids";
      case "bid_accepted":
      case "bid accepted":
        return "Bid Accepted";
      case "driver_assigned":
      case "driver assigned":
        return "Driver Assigned";
      case "in_transit":
      case "in transit":
        return "In Transit";
      case "at_freezone":
      case "at freezone":
        return "At Freezone";
      case "at_port":
      case "at port":
        return "At Port";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "archived":
        return "Archived";
      default:
        return "Created";
    }
  };

  // Formats order type like import/export into Import/Export
  const normalizeType = (type) => {
    if (!type) return "-";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  // Converts order status into progress step index
  const getCurrentStep = (status) => {
    switch (status) {
      case "Created":
        return 0;
      case "Open for Bids":
        return 1;
      case "Bid Accepted":
        return 2;
      case "Driver Assigned":
        return 3;
      case "In Transit":
        return 4;
      case "At Freezone":
        return 5;
      case "At Port":
        return 6;
      case "Completed":
        return 7;
      default:
        return 0;
    }
  };

  // Shows "Not assigned" for supplier/driver before assignment stages
  const getAssignedValue = (value, status) => {
    if (value && value.trim() !== "") {
      return value;
    }

    if (status === "Created" || status === "Open for Bids") {
      return "Not assigned";
    }

    return "-";
  };

  // Prevents issue reporting before bidding/operation starts
  const canReportIssue = (status) => {
    return !["Created", "Open for Bids"].includes(status);
  };

  // Gets the latest locally reported issue for a specific order
  const getLatestIssueForOrder = (orderId) => {
    const relatedIssues = reportedIssues.filter(
      (issue) => issue.orderId === orderId
    );

    if (relatedIssues.length === 0) {
      return null;
    }

    return relatedIssues[relatedIssues.length - 1];
  };

  // Converts one database order record into the format required by the frontend UI
  const mapDatabaseOrder = (order) => {
    const status = normalizeStatus(order.current_status);
    const supplierName = getAssignedValue(order.supplier_name, status);
    const driverName = getAssignedValue(order.driver_name, status);

    // Vehicle/driver validation should be hidden until a vehicle/driver is actually assigned
    const shouldHideValidation =
      status === "Created" ||
      status === "Open for Bids" ||
      status === "Bid Accepted";

    return {
      id: order.order_reference || `ORDER-${order.order_id}`,

      // Database order ID is important for Tracking page API call
      dbId: order.order_id,
      orderId: order.order_id,
      orderReference: order.order_reference || `ORDER-${order.order_id}`,

      type: normalizeType(order.order_type),
      supplier: supplierName,
      driver: driverName,
      pickup: order.pickup_state || order.pickup_country || "-",
      destination: order.destination_state || order.destination_country || "-",
      status,
      cargoType: order.cargo_type || "-",
      cargoWeight: order.cargo_weight || "-",
      pickupCountry: order.pickup_country || "-",
      pickupState: order.pickup_state || "-",
      destinationCountry: order.destination_country || "-",
      destinationState: order.destination_state || "-",
      pickupDate: order.pickup_date || "-",
      expectedArrival: order.expected_arrival || "-",
      vehicleType: order.vehicle_type || "-",
      containerNo: order.container_no || "-",
      specialInstructions: order.special_instructions || "-",

      vehicle: {
        insurance: shouldHideValidation
          ? "-"
          : order.insurance_status || "Valid until 30 June 2026",

        portPass: shouldHideValidation
          ? "-"
          : order.port_pass_status || "Approved",

        condition: shouldHideValidation
          ? "-"
          : order.condition_status || "Good Condition",
      },

      driverDetails: {
        name: driverName,

        license: shouldHideValidation ? "-" : order.license_status || "Valid",

        policeReport: shouldHideValidation
          ? "-"
          : order.police_report_status || "Verified",
      },

      progress: [
        "Created",
        "Open for Bids",
        "Bid Accepted",
        "Driver Assigned",
        "In Transit",
        "At Freezone",
        "At Port",
        "Completed",
      ],
      currentStep: getCurrentStep(status),
    };
  };

  // Fetches all operation orders from backend API
  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:5000/api/operations/orders");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch orders");
      }

      const mappedOrders = result.map(mapDatabaseOrder);
      setOrdersData(mappedOrders);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Applies local archive status without changing the database order status
  const orders = ordersData.map((order) => {
    if (archivedOrderIds.includes(order.id)) {
      return { ...order, status: "Archived" };
    }

    return order;
  });

  // Filters table by selected status tab
  const filteredOrders = orders.filter((order) => {
    return activeTab === "All" || order.status === activeTab;
  });

  // Returns badge color class according to order status
  const statusBadge = (status) => {
    const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "Created":
        return `${base} bg-purple-100 text-purple-700`;
      case "Open for Bids":
        return `${base} bg-indigo-100 text-indigo-700`;
      case "Bid Accepted":
        return `${base} bg-blue-100 text-blue-700`;
      case "Driver Assigned":
        return `${base} bg-cyan-100 text-cyan-700`;
      case "In Transit":
        return `${base} bg-[#EFF6FF] text-[#1E40AF]`;
      case "At Freezone":
        return `${base} bg-orange-100 text-[#EA580C]`;
      case "At Port":
        return `${base} bg-yellow-100 text-yellow-700`;
      case "Completed":
        return `${base} bg-green-100 text-[#16A34A]`;
      case "Cancelled":
        return `${base} bg-red-100 text-[#DC2626]`;
      case "Archived":
        return `${base} bg-gray-200 text-gray-600`;
      default:
        return base;
    }
  };

  // Returns badge color class according to issue priority
  const issueBadge = (issue) => {
    const base = "inline-flex px-3 py-1 rounded-full text-xs font-medium";

    if (!issue) {
      return `${base} bg-slate-100 text-[#1E293B]`;
    }

    switch (issue.priority) {
      case "critical":
        return `${base} bg-red-100 text-[#DC2626]`;
      case "high":
        return `${base} bg-orange-100 text-[#EA580C]`;
      case "medium":
        return `${base} bg-[#EFF6FF] text-[#1E40AF]`;
      case "low":
        return `${base} bg-green-100 text-[#16A34A]`;
      default:
        return `${base} bg-slate-100 text-[#1E293B]`;
    }
  };

  // Returns badge color for vehicle/driver validation values in details panel
  const panelBadge = (value) => {
    if (
      value === "Approved" ||
      value === "Verified" ||
      value === "Valid" ||
      value === "Good Condition" ||
      value?.startsWith("Valid until")
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

  // Saves full selected order details to sessionStorage and navigates to Tracking page.
  // This fixes Tracking page showing only database ID like "8" and N/A values.
  const goToTracking = (order) => {
    sessionStorage.setItem(
      "trackingOrder",
      JSON.stringify({
        id: order.id,
        order_reference: order.id,
        orderReference: order.orderReference || order.id,

        // These IDs are used by Tracking.jsx to call backend tracking API
        dbId: order.dbId,
        order_id: order.dbId,
        databaseOrderId: order.dbId,

        type: order.type,
        pickup: order.pickup,
        destination: order.destination,
        containerNo: order.containerNo,
        vehicleNo: order.vehicleNo || "N/A",
        supplier: order.supplier,
        driver: order.driver,
        status: order.status,
        expectedDay: order.expectedArrival,
      })
    );

    onNavigate && onNavigate("/tracking");
  };

  // Opens issue report form only for valid operational stages
  const openIssueForm = (order) => {
    if (!canReportIssue(order.status)) {
      alert(
        "Issues can be reported only after bidding is completed and operations have started."
      );
      return;
    }

    setOpenMenu(null);
    setIssueOrder(order);
    setIssueTypes([]);
    setPriority("medium");
    setIssueDetails("");
  };

  // Adds or removes issue type checkbox value
  const toggleIssueType = (type) => {
    setIssueTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  // Saves issue report locally and sends latest issue data through sessionStorage for admin/issue flow
  const sendIssueToAdmin = () => {
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
      issueId: Date.now(),
      orderId: issueOrder.id,
      dbOrderId: issueOrder.dbId,
      supplier: issueOrder.supplier,
      driver: issueOrder.driver,
      route: `${issueOrder.pickup} → ${issueOrder.destination}`,
      issueTypes,
      priority,
      details: issueDetails,
      status: "open",
      sentTo: "Admin Team",
      createdAt: new Date().toLocaleString(),
    };

    const updatedIssues = [...reportedIssues, issueReport];

    setReportedIssues(updatedIssues);
    localStorage.setItem("reportedIssues", JSON.stringify(updatedIssues));
    sessionStorage.setItem("latestIssueReport", JSON.stringify(issueReport));

    alert(`Issue report for ${issueOrder.id} sent to Admin Team.`);
    setIssueOrder(null);
  };

  // Archives only completed orders and saves archived order ID locally
  const confirmArchiveOrder = () => {
    if (!archiveOrder) return;

    if (archiveOrder.status !== "Completed") {
      alert("Only completed orders can be archived by Operations.");
      setArchiveOrder(null);
      return;
    }

    const updatedArchived = [...archivedOrderIds, archiveOrder.id];
    setArchivedOrderIds(updatedArchived);
    localStorage.setItem("archivedOrderIds", JSON.stringify(updatedArchived));

    alert(`Order ${archiveOrder.id} archived successfully by Operations.`);
    setArchiveOrder(null);
    setSelectedOrder(null);
  };

  // Handles dropdown actions: details, bidding, tracking, issue report, and archive
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
          alert("Only completed orders can be archived by Operations.");
          return;
        }
        setArchiveOrder(order);
        break;

      default:
        break;
    }
  };

  return (
    <div className="min-h-full w-full bg-[#EFF6FF] px-6 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Status tabs and create order button */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex flex-wrap gap-3">
            {[
              "All",
              "Created",
              "Open for Bids",
              "Bid Accepted",
              "Driver Assigned",
              "In Transit",
              "At Freezone",
              "At Port",
              "Completed",
              "Cancelled",
              "Archived",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-[#1E40AF] text-white"
                    : "bg-slate-100 text-[#1E293B] hover:bg-[#EFF6FF]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate && onNavigate("/create")}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]"
          >
            <PlusSquare size={16} />
            New Order
          </button>
        </div>

        {/* Orders table */}
        <div className="mt-6 overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Loading orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No orders found.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EFF6FF] text-[#1E293B]">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Order ID
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Type
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Supplier
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Driver
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Pickup
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Destination
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Issue
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order, index) => {
                    const latestIssue = getLatestIssueForOrder(order.id);

                    return (
                      <tr
                        key={`${order.id}-${index}`}
                        className="border-b border-slate-200 bg-white hover:bg-[#F8FAFC]"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#1E293B]">
                          {order.id}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                          {order.type}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                          {order.supplier}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                          {order.driver}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                          {order.pickup}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                          {order.destination}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={statusBadge(order.status)}>
                            {order.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={issueBadge(latestIssue)}>
                            {latestIssue
                              ? `${latestIssue.status} - ${latestIssue.priority}`
                              : "No Issue"}
                          </span>
                        </td>

                        <td className="relative whitespace-nowrap px-4 py-4 text-center">
                          {order.status === "Archived" ? (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600"
                            >
                              Review
                            </button>
                          ) : (
                            <div className="relative inline-block">
                              <button
                                onClick={() =>
                                  setOpenMenu(openMenu === index ? null : index)
                                }
                                className="rounded-lg bg-[#1E40AF] px-4 py-2 text-xs font-medium text-white hover:bg-[#1E3A8A]"
                              >
                                Manage ▾
                              </button>

                              {openMenu === index && (
                                <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-slate-200 bg-white text-left text-xs shadow-lg">
                                  <div
                                    onClick={() => handleAction("details", order)}
                                    className="cursor-pointer px-3 py-2 text-[#1E293B] hover:bg-[#F8FAFC]"
                                  >
                                    View Details
                                  </div>

                                  {order.status === "Created" && (
                                    <div
                                      onClick={() =>
                                        handleAction("bidding", order)
                                      }
                                      className="cursor-pointer px-3 py-2 text-[#1E293B] hover:bg-[#F8FAFC]"
                                    >
                                      Open Bidding
                                    </div>
                                  )}

                                  <div
                                    onClick={() =>
                                      handleAction("tracking", order)
                                    }
                                    className="cursor-pointer px-3 py-2 text-[#1E293B] hover:bg-[#F8FAFC]"
                                  >
                                    Track Order
                                  </div>

                                  {canReportIssue(order.status) && (
                                    <div
                                      onClick={() => handleAction("issue", order)}
                                      className="cursor-pointer px-3 py-2 text-[#DC2626] hover:bg-red-50"
                                    >
                                      Report Issue
                                    </div>
                                  )}

                                  {order.status === "Completed" && (
                                    <div
                                      onClick={() =>
                                        handleAction("archive", order)
                                      }
                                      className="cursor-pointer px-3 py-2 text-[#16A34A] hover:bg-green-50"
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
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Selected order detail panel */}
        {selectedOrder && (
          <OrderDetailsPanel
            selectedOrder={selectedOrder}
            statusBadge={statusBadge}
            panelBadge={panelBadge}
            getLatestIssueForOrder={getLatestIssueForOrder}
            issueBadge={issueBadge}
            setSelectedOrder={setSelectedOrder}
            handleAction={handleAction}
            goToTracking={goToTracking}
            openIssueForm={openIssueForm}
            setArchiveOrder={setArchiveOrder}
            canReportIssue={canReportIssue}
          />
        )}
      </div>

      {/* Issue report modal */}
      {issueOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#1E293B]">
                  Report Issue to Admin
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Auto-filled order details. Issue will be saved separately
                  without changing the order status.
                </p>
              </div>

              <button
                onClick={() => setIssueOrder(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBox label="Order No" value={issueOrder.id} />
              <InfoBox label="Supplier" value={issueOrder.supplier} />
              <InfoBox label="Driver" value={issueOrder.driver} />
              <InfoBox
                label="Route"
                value={`${issueOrder.pickup} → ${issueOrder.destination}`}
              />
            </div>

            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-[#1E293B]">
                Issue Type
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  "Vehicle Issue",
                  "Driver Issue",
                  "Document Issue",
                  "Delay Issue",
                  "Insurance Issue",
                  "Other",
                ].map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-[#EFF6FF] px-3 py-2 text-sm text-[#1E293B]"
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

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1E293B]">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#1E293B]">
                  Issue Details
                </label>
                <textarea
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                  rows="4"
                  placeholder="Describe the issue clearly..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIssueOrder(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={sendIssueToAdmin}
                className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A]"
              >
                Send to Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive confirmation modal */}
      {archiveOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[390px] rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="text-[#DC2626]" size={22} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1E293B]">
                  Archive Order?
                </h3>
                <p className="text-sm text-slate-500">
                  Are you sure Operations should archive {archiveOrder.id}?
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-xs text-[#DC2626]">
                Only completed orders can be archived by Operations. Archived
                orders will be moved to the Archived tab for review.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setArchiveOrder(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmArchiveOrder}
                className="rounded-lg bg-[#DC2626] px-4 py-2 text-sm text-white hover:bg-red-700"
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

// Detailed panel shown under the table when user selects "View Details"
function OrderDetailsPanel({
  selectedOrder,
  statusBadge,
  panelBadge,
  getLatestIssueForOrder,
  issueBadge,
  setSelectedOrder,
  handleAction,
  goToTracking,
  openIssueForm,
  setArchiveOrder,
  canReportIssue,
}) {
  const latestIssue = getLatestIssueForOrder(selectedOrder.id);

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">
            Order Details - {selectedOrder.id}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {selectedOrder.pickup} → {selectedOrder.destination}
          </p>
        </div>

        <button
          onClick={() => setSelectedOrder(null)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
        >
          Close Panel
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoBox label="Order Type" value={selectedOrder.type} />
        <InfoBox label="Supplier" value={selectedOrder.supplier} />
        <InfoBox label="Driver" value={selectedOrder.driver} />
        <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">
          <p className="mb-1 text-xs text-slate-500">Current Status</p>
          <span className={statusBadge(selectedOrder.status)}>
            {selectedOrder.status}
          </span>
        </div>
      </div>

      <SectionTitle title="Issue Summary" />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">
          <p className="mb-1 text-xs text-slate-500">Issue Status</p>
          <span className={issueBadge(latestIssue)}>
            {latestIssue
              ? `${latestIssue.status} - ${latestIssue.priority}`
              : "No Issue"}
          </span>
        </div>
        <InfoBox
          label="Issue Type"
          value={latestIssue ? latestIssue.issueTypes.join(", ") : "-"}
        />
        <InfoBox
          label="Reported At"
          value={latestIssue ? latestIssue.createdAt : "-"}
        />
      </div>

      {latestIssue && (
        <div className="mb-6">
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-[#1E293B]">
            <p className="mb-1 text-xs text-red-500">Issue Details</p>
            {latestIssue.details}
          </div>
        </div>
      )}

      <SectionTitle title="Cargo Details" />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoBox label="Cargo Type" value={selectedOrder.cargoType} />
        <InfoBox
          label="Cargo Weight"
          value={
            selectedOrder.cargoWeight !== "-"
              ? `${selectedOrder.cargoWeight} kg`
              : "-"
          }
        />
        <InfoBox label="Vehicle Type" value={selectedOrder.vehicleType} />
        <InfoBox label="Container No" value={selectedOrder.containerNo} />
      </div>

      <SectionTitle title="Schedule Details" />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoBox label="Pickup Date" value={selectedOrder.pickupDate} />
        <InfoBox
          label="Expected Arrival"
          value={selectedOrder.expectedArrival}
        />
        <InfoBox label="Pickup Country" value={selectedOrder.pickupCountry} />
        <InfoBox
          label="Destination Country"
          value={selectedOrder.destinationCountry}
        />
      </div>

      <SectionTitle title="Vehicle Details" />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusInfoBox
          label="Insurance"
          value={selectedOrder.vehicle?.insurance || "-"}
          tone={panelBadge(selectedOrder.vehicle?.insurance || "-")}
        />
        <StatusInfoBox
          label="Port Pass"
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
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoBox
          label="Driver Name"
          value={selectedOrder.driverDetails?.name || selectedOrder.driver}
        />
        <StatusInfoBox
          label="License Status"
          value={selectedOrder.driverDetails?.license || "-"}
          tone={panelBadge(selectedOrder.driverDetails?.license || "-")}
        />
        <StatusInfoBox
          label="Police Report"
          value={selectedOrder.driverDetails?.policeReport || "-"}
          tone={panelBadge(selectedOrder.driverDetails?.policeReport || "-")}
        />
      </div>

      <SectionTitle title="Special Instructions" />
      <div className="mb-6">
        <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4 text-sm text-[#1E293B]">
          {selectedOrder.specialInstructions || "-"}
        </div>
      </div>

      <SectionTitle title="Order Progress" />
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {selectedOrder.progress.map((step, idx) => {
            const active = idx <= selectedOrder.currentStep;
            const last = idx === selectedOrder.progress.length - 1;

            return (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`rounded-full px-4 py-2 text-xs font-medium ${
                    active
                      ? "bg-[#1E40AF] text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step}
                </div>
                {!last && (
                  <div
                    className={`h-0.5 w-8 ${
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
            className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A]"
          >
            Open Bidding
          </button>
        )}

        {selectedOrder.status !== "Archived" && (
          <>
            <button
              onClick={() => goToTracking(selectedOrder)}
              className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A]"
            >
              Track Order
            </button>

            {canReportIssue(selectedOrder.status) && (
              <button
                onClick={() => openIssueForm(selectedOrder)}
                className="rounded-lg bg-orange-100 px-4 py-2 text-sm text-[#EA580C] hover:opacity-90"
              >
                Report Issue
              </button>
            )}
          </>
        )}

        {selectedOrder.status === "Completed" && (
          <button
            onClick={() => setArchiveOrder(selectedOrder)}
            className="rounded-lg bg-[#16A34A] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Archive Order
          </button>
        )}

        {selectedOrder.status === "Archived" && (
          <span className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-600">
            Archived by Operations for review
          </span>
        )}
      </div>
    </div>
  );
}

// Small reusable heading for each detail section
function SectionTitle({ title }) {
  return (
    <div className="mb-3">
      <h3 className="text-base font-semibold text-[#1E293B]">{title}</h3>
    </div>
  );
}

// Reusable information box used inside the order detail panel and issue modal
function InfoBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-[#1E293B]">{value}</p>
    </div>
  );
}

// Reusable status box for insurance, port pass, vehicle condition, license, and police report
function StatusInfoBox({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <span className={`inline-block rounded-full px-3 py-1 text-xs ${tone}`}>
        {value}
      </span>
    </div>
  );
}

export default Orders;