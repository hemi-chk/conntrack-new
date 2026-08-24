import { AlertTriangle, PlusSquare, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

const OPS_API = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000"
}/api/operations`;

function AssignDriverModal({ order, state, setDriverId, setVehicleId, onSubmit, onClose }) {
  const { drivers, vehicles, driverId, vehicleId, loading, error } = state;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#1E293B]">Assign Driver</h2>
            <p className="mt-1 text-sm text-slate-500">
              Order {order.id} — select a driver and vehicle from the winning supplier
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B] hover:bg-slate-50">
            Close
          </button>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-10 text-sm text-slate-500">
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-[#052659] border-t-transparent" />
            Loading drivers and vehicles…
          </div>
        )}
        {!loading && error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {!loading && !error && (
          <>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Driver</label>
              {drivers.length === 0 ? (
                <p className="text-sm text-slate-400">No drivers found for this supplier.</p>
              ) : (
                <select value={driverId} onChange={e => setDriverId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] outline-none focus:border-[#052659]">
                  <option value="">Select a driver…</option>
                  {drivers.map(d => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.first_name} {d.last_name} — {d.license_number || 'No license on file'}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-[#1E293B]">Vehicle</label>
              {vehicles.length === 0 ? (
                <p className="text-sm text-slate-400">No vehicles found for this supplier.</p>
              ) : (
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] outline-none focus:border-[#052659]">
                  <option value="">Select a vehicle…</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.vehicle_number} — {v.vehicle_type} ({v.availability_status || 'available'})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={onSubmit} disabled={!driverId || !vehicleId}
                className="flex-[2] rounded-lg bg-[#15803D] px-4 py-2 text-sm text-white hover:bg-[#166534] disabled:opacity-40">
                Confirm Assignment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [assignDriverOrder, setAssignDriverOrder] = useState(null);
  const [assignDriverState, setAssignDriverState] = useState({
    drivers: [],
    vehicles: [],
    driverId: "",
    vehicleId: "",
    loading: false,
    error: "",
  });
  const [backendIssues, setBackendIssues] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  // Issue reporting form states
  const [issueTypes, setIssueTypes] = useState([]);
  const [priority, setPriority] = useState("medium");
  const [issueDetails, setIssueDetails] = useState("");

  // Loads orders from backend and restores legacy local archive markers/issues
  useEffect(() => {
    fetchOrders();
    fetchBackendIssues();

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

    if (
      status === "Created" ||
      status === "Open for Bids" ||
      status === "Bid Accepted"
    ) {
      return "Not assigned";
    }

    return "-";
  };

  // Prevents issue reporting before bidding/operation starts
  const canReportIssue = (status) => {
    return !["Created", "Open for Bids"].includes(status);
  };

  // Converts database issue status into readable review status
  const normalizeIssueReviewStatus = (status) => {
    const cleanStatus = String(status || "").trim().toLowerCase();

    if (
      cleanStatus === "open" ||
      cleanStatus === "sent_to_admin" ||
      cleanStatus === "sent to admin"
    ) {
      return "Sent to Admin";
    }

    if (
      cleanStatus === "escalated" ||
      cleanStatus === "admin_reviewing" ||
      cleanStatus === "admin reviewing" ||
      cleanStatus === "reviewing"
    ) {
      return "Admin Reviewing";
    }

    if (cleanStatus === "resolved") {
      return "Resolved";
    }

    return status || "Sent to Admin";
  };

  // Converts database issue type like vehicle_issue into Vehicle Issue
  const normalizeIssueType = (value) => {
    if (!value) return "Issue";

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Formats backend issue date for the Order Details issue summary
  const formatIssueDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  // Converts one backend issue record into the same shape already used by Orders.jsx
  const mapBackendIssue = (issue) => {
    const order = issue.orders || {};

    return {
      issueId: issue.issue_id,
      dbIssueId: issue.issue_id,

      orderId:
        order.order_reference ||
        issue.order_reference ||
        "-",

      dbOrderId:
        order.order_id ||
        issue.order_id ||
        null,

      issueTypes: [
        normalizeIssueType(
          issue.issue_type ||
          "Issue"
        ),
      ],

      priority: String(
        issue.priority ||
        "medium"
      ).toLowerCase(),

      details:
        issue.description ||
        issue.issue_details ||
        "No issue details provided.",

      status:
        normalizeIssueReviewStatus(
          issue.status
        ),

      createdAt:
        formatIssueDate(
          issue.created_at ||
          issue.reported_at
        ),

      rawCreatedAt:
        issue.created_at ||
        issue.reported_at ||
        null,

      source:
        "backend",
    };
  };

  // Loads the same real issue records used by Issues.jsx
  const fetchBackendIssues = async () => {
    try {
      const response = await fetch(
        `${OPS_API}/issues`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Failed to fetch issues"
        );
      }

      const mappedIssues = Array.isArray(result)
        ? result.map(mapBackendIssue)
        : [];

      setBackendIssues(mappedIssues);
    } catch (error) {
      console.error(
        "Orders issue fetch error:",
        error
      );

      setBackendIssues([]);
    }
  };

  // Gets the latest issue for one order from backend + local reports
  const getLatestIssueForOrder = (orderOrId) => {
    const orderReference =
      typeof orderOrId === "object"
        ? orderOrId?.id
        : orderOrId;

    const databaseOrderId =
      typeof orderOrId === "object"
        ? orderOrId?.dbId
        : ordersData.find(
            (order) =>
              order.id === orderReference
          )?.dbId;

    const combinedIssues = [
      ...backendIssues,
      ...reportedIssues,
    ];

    const relatedIssues =
      combinedIssues.filter((issue) => {
        const matchesReference =
          orderReference &&
          String(issue.orderId) ===
            String(orderReference);

        const matchesDatabaseId =
          databaseOrderId !== null &&
          databaseOrderId !== undefined &&
          issue.dbOrderId !== null &&
          issue.dbOrderId !== undefined &&
          String(issue.dbOrderId) ===
            String(databaseOrderId);

        return (
          matchesReference ||
          matchesDatabaseId
        );
      });

    if (relatedIssues.length === 0) {
      return null;
    }

    return [...relatedIssues].sort(
      (a, b) => {
        const aTime = new Date(
          a.rawCreatedAt ||
          a.createdAt ||
          0
        ).getTime();

        const bTime = new Date(
          b.rawCreatedAt ||
          b.createdAt ||
          0
        ).getTime();

        return (
          (Number.isNaN(bTime) ? 0 : bTime) -
          (Number.isNaN(aTime) ? 0 : aTime)
        );
      }
    )[0];
  };

  // Converts one database order record into the format required by the frontend UI
  const mapDatabaseOrder = (order) => {
    const status = normalizeStatus(order.current_status);
    const supplierName = getAssignedValue(order.supplier_name, status);
    const driverName = getAssignedValue(order.driver_name, status);

    // Database location fields
    const pickupDistrict = order.pickup_district || "-";
    const pickupLocation = order.pickup_location || "-";
    const destinationDistrict = order.destination_district || "-";
    const destinationLocation = order.destination_location || "-";

    // Vehicle/driver validation should be hidden until a vehicle/driver is actually assigned
    const shouldHideValidation =
      status === "Created" ||
      status === "Open for Bids" ||
      status === "Bid Accepted";

    return {
      id: order.order_reference || `ORDER-${order.order_id}`,

      // Database order ID is important for Tracking and Bidding page API calls
      dbId: order.order_id,
      orderId: order.order_id,
      orderReference: order.order_reference || `ORDER-${order.order_id}`,

      type: normalizeType(order.order_type),
      supplier: supplierName,
      driver: driverName,

      pickupDistrict,
      pickupLocation,
      destinationDistrict,
      destinationLocation,

      pickup: pickupLocation,
      destination: destinationLocation,

      status,
      cargoType: order.cargo_type || "-",
      cargoWeight: order.cargo_weight || "-",
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

      const response = await fetch(`${OPS_API}/orders`);

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
      return {
        ...order,
        status: "Archived",
      };
    }

    return order;
  });

  // Filters table by selected status tab
  const filteredOrders = orders.filter((order) => {
    return activeTab === "All" || order.status === activeTab;
  });

  // Returns badge color class according to order status
  const statusBadge = (status) => {
    const base =
      "inline-flex px-3 py-1 rounded-full text-xs font-medium";

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
    const base =
      "inline-flex px-3 py-1 rounded-full text-xs font-medium";

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

  // Saves full selected order details to sessionStorage and navigates to Tracking page
  const goToTracking = (order) => {
    sessionStorage.setItem(
      "trackingOrder",
      JSON.stringify({
        id: order.id,

        order_reference: order.id,

        orderReference:
          order.orderReference ||
          order.id,

        // These IDs are used by Tracking.jsx to call backend tracking API
        dbId: order.dbId,
        order_id: order.dbId,
        databaseOrderId: order.dbId,

        type: order.type,

        pickupDistrict:
          order.pickupDistrict,

        pickupLocation:
          order.pickupLocation,

        destinationDistrict:
          order.destinationDistrict,

        destinationLocation:
          order.destinationLocation,

        pickup:
          order.pickupLocation,

        destination:
          order.destinationLocation,

        containerNo:
          order.containerNo,

        vehicleNo:
          order.vehicleNo ||
          "N/A",

        supplier:
          order.supplier,

        driver:
          order.driver,

        status:
          order.status,

        expectedDay:
          order.expectedArrival,
      })
    );

    onNavigate &&
      onNavigate("/tracking");
  };

  // NEW:
  // Saves selected order and opens Bidding page.
  // Works for both Created and Open for Bids orders.
  const goToBidding = (order) => {
    sessionStorage.setItem(
      "biddingOrder",
      JSON.stringify({
        ...order,

        // Explicitly keep all ID formats Bidding.jsx understands
        id:
          order.id,

        orderReference:
          order.orderReference ||
          order.id,

        order_reference:
          order.orderReference ||
          order.id,

        dbId:
          order.dbId,

        orderId:
          order.orderId ||
          order.dbId,

        order_id:
          order.dbId,

        databaseOrderId:
          order.dbId,
      })
    );

    onNavigate &&
      onNavigate("/bidding");
  };

  // Opens issue report form only for valid operational stages
  const openAssignDriver = async (order) => {
    setAssignDriverState({ drivers: [], vehicles: [], driverId: '', vehicleId: '', loading: true, error: '' });
    setAssignDriverOrder(order);
    try {
      const infoRes = await fetch(`${OPS_API}/orders/${order.orderId}/assignment-info`);
      const info = await infoRes.json();
      const supplierId = info?.supplier_id;
      if (!supplierId) {
        setAssignDriverState(s => ({ ...s, loading: false, error: 'No winning supplier found for this order. Ensure Logistics has finalized a bid.' }));
        return;
      }
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch(`${OPS_API}/drivers?supplier_id=${supplierId}`),
        fetch(`${OPS_API}/vehicles?supplier_id=${supplierId}`),
      ]);
      const drivers = await driversRes.json();
      const vehicles = await vehiclesRes.json();
      setAssignDriverState(s => ({ ...s, drivers: drivers || [], vehicles: vehicles || [], loading: false }));
    } catch {
      setAssignDriverState(s => ({ ...s, loading: false, error: 'Failed to load drivers/vehicles.' }));
    }
  };

  const submitAssignDriver = async () => {
    const { driverId, vehicleId } = assignDriverState;
    if (!driverId || !vehicleId) {
      setAssignDriverState(s => ({ ...s, error: 'Please select both a driver and a vehicle.' }));
      return;
    }
    setAssignDriverState(s => ({ ...s, loading: true, error: '' }));
    try {
      const res = await fetch(`${OPS_API}/orders/${assignDriverOrder.orderId}/assign-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId, vehicle_id: vehicleId }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      setAssignDriverOrder(null);
      setAssignDriverState({ drivers: [], vehicles: [], driverId: '', vehicleId: '', loading: false, error: '' });
      fetchOrders();
    } catch (err) {
      setAssignDriverState(s => ({ ...s, loading: false, error: err.message }));
    }
  };

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

  // Saves the issue in the real backend/database and sends it to Admin.
  // Orders.jsx and Issues.jsx will now read the same persistent issue record.
  const sendIssueToAdmin = async () => {
    if (!issueOrder) return;

    if (issueTypes.length === 0) {
      alert("Please select at least one issue type.");
      return;
    }

    if (!issueDetails.trim()) {
      alert("Please enter issue details.");
      return;
    }

    try {
      const response = await fetch(
        `${OPS_API}/issues`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id:
              issueOrder.dbId,

            issue_type:
              issueTypes.join(", "),

            priority,

            description:
              issueDetails.trim(),

            // reported_by is intentionally omitted here because the database
            // column is UUID-based. The Issues UI will display "Operations Team"
            // as its fallback reporter label.

            // Backend uses these names only to resolve the real IDs when possible.
            supplier_name:
              issueOrder.supplier,

            driver_name:
              issueOrder.driver,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          "Failed to send issue to Admin."
        );
      }

      // Refresh backend issues immediately so the Issue badge updates
      // without requiring a full browser refresh.
      await fetchBackendIssues();

      alert(
        `Issue report for ${issueOrder.id} sent to Admin Team successfully.`
      );

      setIssueOrder(null);
      setIssueTypes([]);
      setPriority("medium");
      setIssueDetails("");
    } catch (error) {
      console.error(
        "Send issue error:",
        error
      );

      alert(
        error.message
      );
    }
  };

  // Archives only completed orders and persists the archive in the database
  const confirmArchiveOrder = async () => {
    if (!archiveOrder) return;

    if (
      archiveOrder.status !==
      "Completed"
    ) {
      alert(
        "Only completed orders can be archived by Operations."
      );

      setArchiveOrder(null);
      return;
    }

    try {
      const response = await fetch(
        `${OPS_API}/orders/${archiveOrder.dbId}/archive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          "Failed to archive order."
        );
      }

      // Remove any old local-only archive marker for this order.
      // The database is now the authoritative source.
      const cleanedArchivedIds =
        archivedOrderIds.filter(
          (orderId) =>
            orderId !== archiveOrder.id
        );

      setArchivedOrderIds(
        cleanedArchivedIds
      );

      localStorage.setItem(
        "archivedOrderIds",
        JSON.stringify(
          cleanedArchivedIds
        )
      );

      // Reload orders so the Archived tab immediately reflects DB state.
      await fetchOrders();

      alert(
        `Order ${archiveOrder.id} archived successfully by Operations.`
      );

      setArchiveOrder(null);
      setSelectedOrder(null);
      setOpenMenu(null);
    } catch (error) {
      console.error(
        "Archive order error:",
        error
      );

      alert(
        error.message
      );
    }
  };

  // Handles dropdown actions
  const handleAction = (action, order) => {
    setOpenMenu(null);

    switch (action) {
      case "details":
        setSelectedOrder(order);
        break;

      // Created order → Open Bidding
      case "bidding":
        if (
          order.status !==
          "Created"
        ) {
          alert(
            "Bidding can be opened only for newly created orders."
          );

          return;
        }

        goToBidding(order);
        break;

      // NEW:
      // Existing Open for Bids order → View Bidding
      case "view_bidding":
        if (
          order.status !==
          "Open for Bids"
        ) {
          alert(
            "Only orders currently open for bids can be viewed in Bidding."
          );

          return;
        }

        goToBidding(order);
        break;

      case "tracking":
        goToTracking(order);
        break;

      case "issue":
        openIssueForm(order);
        break;

      case "archive":
        if (
          order.status !==
          "Completed"
        ) {
          alert(
            "Only completed orders can be archived by Operations."
          );

          return;
        }

        setArchiveOrder(order);
        break;

      default:
        break;
    }
  };

  return (
    <div className="min-h-full w-full bg-[#EBF4FF] px-6 py-6">
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
                onClick={() =>
                  setActiveTab(tab)
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-[#052659] text-white"
                    : "bg-slate-100 text-[#1E293B] hover:bg-[#EBF4FF]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              onNavigate &&
              onNavigate("/create")
            }
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]"

          >
            <PlusSquare
              size={16}
            />

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
            ) : filteredOrders.length ===
              0 ? (
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
                      Pickup District
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Pickup Location
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Destination District
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                      Destination Location
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

                  {filteredOrders.map(
                    (order, index) => {
                      const latestIssue =
                        getLatestIssueForOrder(
                          order
                        );


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
                            {
                              order.pickupDistrict
                            }
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                            {
                              order.pickupLocation
                            }
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                            {
                              order.destinationDistrict
                            }
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                            {
                              order.destinationLocation
                            }
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={statusBadge(
                                order.status
                              )}
                            >
                              {
                                order.status
                              }
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={issueBadge(
                                latestIssue
                              )}
                            >
                              {latestIssue
                                ? `${latestIssue.status} - ${latestIssue.priority}`
                                : "No Issue"}
                            </span>
                          </td>

                          <td className="relative whitespace-nowrap px-4 py-4 text-center">

                            {order.status ===
                            "Archived" ? (
                              <button
                                onClick={() =>
                                  setSelectedOrder(
                                    order
                                  )
                                }
                                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600"

                              >
                                Review
                              </button>
                            ) : (
                              <div className="relative inline-block">

                                <button
                                  onClick={() =>
                                    setOpenMenu(
                                      openMenu ===
                                        index
                                        ? null
                                        : index
                                    )
                                  }
                                  className="rounded-lg bg-[#1E40AF] px-4 py-2 text-xs font-medium text-white hover:bg-[#1E3A8A]"
                                >
                                  Manage ▾
                                </button>

                                {openMenu ===
                                  index && (
                                  <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-slate-200 bg-white text-left text-xs shadow-lg">


                                    <div
                                      onClick={() =>
                                        handleAction(
                                          "details",
                                          order
                                        )
                                      }
                                      className="cursor-pointer px-3 py-2 text-[#1E293B] hover:bg-[#EBF4FF]"
                                    >
                                      View Details
                                    </div>

                                    {/* Created order */}
                                    {order.status ===
                                      "Created" && (
                                      <div
                                        onClick={() =>
                                          handleAction(
                                            "bidding",
                                            order
                                          )
                                        }
                                        className="cursor-pointer px-3 py-2 text-[#1E293B] hover:bg-[#F8FAFC]"
                                      >
                                        Open Bidding
                                      </div>
                                    )}


                                    {/* NEW: already open order */}
                                    {order.status ===
                                      "Open for Bids" && (
                                      <div
                                        onClick={() =>
                                          handleAction(
                                            "view_bidding",
                                            order
                                          )
                                        }
                                        className="cursor-pointer px-3 py-2 text-[#1E40AF] hover:bg-[#EFF6FF]"
                                      >
                                        View Bidding
                                      </div>
                                    )}

                                    <div
                                      onClick={() =>
                                        handleAction(
                                          "tracking",
                                          order
                                        )
                                      }
                                      className="cursor-pointer px-3 py-2 text-[#1E293B] hover:bg-[#F8FAFC]"
                                    >
                                      Track Order
                                    </div>

                                    {canReportIssue(
                                      order.status
                                    ) && (
                                      <div
                                        onClick={() =>
                                          handleAction(
                                            "issue",
                                            order
                                          )
                                        }
                                        className="cursor-pointer px-3 py-2 text-[#DC2626] hover:bg-red-50"
                                      >
                                        Report Issue
                                      </div>
                                    )}

                                    {order.status ===
                                      "Completed" && (
                                      <div
                                        onClick={() =>
                                          handleAction(
                                            "archive",
                                            order
                                          )
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
                    }
                  )}

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
            goToBidding={goToBidding}
            openIssueForm={openIssueForm}
            openAssignDriver={openAssignDriver}
            setArchiveOrder={setArchiveOrder}
            canReportIssue={canReportIssue}

          />
        )}

      </div>

      {/* Assign Driver Modal */}
      {assignDriverOrder && (
        <AssignDriverModal
          order={assignDriverOrder}
          state={assignDriverState}
          setDriverId={(id) => setAssignDriverState(s => ({ ...s, driverId: id }))}
          setVehicleId={(id) => setAssignDriverState(s => ({ ...s, vehicleId: id }))}
          onSubmit={submitAssignDriver}
          onClose={() => setAssignDriverOrder(null)}
        />
      )}

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
                onClick={() =>
                  setIssueOrder(
                    null
                  )
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Close
              </button>

            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">

              <InfoBox
                label="Order No"
                value={
                  issueOrder.id
                }
              />

              <InfoBox
                label="Supplier"
                value={
                  issueOrder.supplier
                }
              />

              <InfoBox
                label="Driver"
                value={
                  issueOrder.driver
                }
              />

              <InfoBox
                label="Route"
                value={`${issueOrder.pickupLocation} → ${issueOrder.destinationLocation}`}
              />

              <InfoBox
                label="Pickup District"
                value={
                  issueOrder.pickupDistrict
                }
              />

              <InfoBox
                label="Destination District"
                value={
                  issueOrder.destinationDistrict
                }
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
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-[#EBF4FF] px-3 py-2 text-sm text-[#1E293B]"
                  >

                    <input
                      type="checkbox"
                      checked={issueTypes.includes(
                        type
                      )}
                      onChange={() =>
                        toggleIssueType(
                          type
                        )
                      }
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
                  value={
                    priority
                  }
                  onChange={(e) =>
                    setPriority(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] outline-none"
                >

                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="critical">
                    Critical
                  </option>

                </select>

              </div>

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-semibold text-[#1E293B]">
                  Issue Details
                </label>

                <textarea
                  value={
                    issueDetails
                  }
                  onChange={(e) =>
                    setIssueDetails(
                      e.target.value
                    )
                  }
                  rows="4"
                  placeholder="Describe the issue clearly..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B] outline-none"
                />

              </div>

            </div>

            <div className="flex justify-end gap-3">

              <button
                onClick={() =>
                  setIssueOrder(
                    null
                  )
                }
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  sendIssueToAdmin
                }
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

                <AlertTriangle
                  className="text-[#DC2626]"
                  size={22}
                />

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
                onClick={() =>
                  setArchiveOrder(
                    null
                  )
                }
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  confirmArchiveOrder
                }
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
  goToBidding,
  openIssueForm,
  openAssignDriver,
  setArchiveOrder,
  canReportIssue,
}) {
  const latestIssue =
    getLatestIssueForOrder(
      selectedOrder
    );

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">

        <div>

          <h2 className="text-lg font-semibold text-[#1E293B]">
            Order Details - {selectedOrder.id}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedOrder.pickupLocation} → {selectedOrder.destinationLocation}
          </p>

        </div>

        <button
          onClick={() =>
            setSelectedOrder(
              null
            )
          }
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
        >
          Close Panel
        </button>

      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

        <InfoBox
          label="Order Type"
          value={
            selectedOrder.type
          }
        />

        <InfoBox
          label="Supplier"
          value={
            selectedOrder.supplier
          }
        />

        <InfoBox
          label="Driver"
          value={
            selectedOrder.driver
          }
        />

        <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">

          <p className="mb-1 text-xs text-slate-500">
            Current Status
          </p>

          <span
            className={statusBadge(
              selectedOrder.status
            )}
          >
            {
              selectedOrder.status
            }

          </span>

        </div>

      </div>

      <SectionTitle title="Issue Summary" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">

          <p className="mb-1 text-xs text-slate-500">
            Issue Status
          </p>

          <span
            className={issueBadge(
              latestIssue
            )}
          >

            {latestIssue
              ? `${latestIssue.status} - ${latestIssue.priority}`
              : "No Issue"}
          </span>

        </div>

        <InfoBox
          label="Issue Type"
          value={
            latestIssue
              ? latestIssue.issueTypes.join(", ")
              : "-"
          }
        />

        <InfoBox
          label="Reported At"
          value={
            latestIssue
              ? latestIssue.createdAt
              : "-"
          }
        />

      </div>

      {latestIssue && (
        <div className="mb-6">

          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-[#1E293B]">

            <p className="mb-1 text-xs text-red-500">
              Issue Details
            </p>

            {
              latestIssue.details
            }

          </div>

        </div>
      )}

      <SectionTitle title="Cargo Details" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

        <InfoBox
          label="Cargo Type"
          value={
            selectedOrder.cargoType
          }
        />

        <InfoBox
          label="Cargo Weight"
          value={
            selectedOrder.cargoWeight !==
            "-"
              ? `${selectedOrder.cargoWeight} kg`
              : "-"
          }
        />

        <InfoBox
          label="Vehicle Type"
          value={
            selectedOrder.vehicleType
          }
        />

        <InfoBox
          label="Container No"
          value={
            selectedOrder.containerNo
          }
        />

      </div>

      <SectionTitle title="Schedule Details" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

        <InfoBox
          label="Pickup Date"
          value={
            selectedOrder.pickupDate
          }
        />

        <InfoBox
          label="Expected Arrival"
          value={
            selectedOrder.expectedArrival
          }
        />

        <InfoBox
          label="Pickup District"
          value={
            selectedOrder.pickupDistrict
          }
        />

        <InfoBox
          label="Pickup Location"
          value={
            selectedOrder.pickupLocation
          }
        />

        <InfoBox
          label="Destination District"
          value={
            selectedOrder.destinationDistrict
          }
        />

        <InfoBox
          label="Destination Location"
          value={
            selectedOrder.destinationLocation
          }
        />

      </div>

      <SectionTitle title="Vehicle Details" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

        <StatusInfoBox
          label="Insurance"
          value={
            selectedOrder.vehicle?.insurance ||
            "-"
          }
          tone={panelBadge(
            selectedOrder.vehicle?.insurance ||
              "-"
          )}
        />

        <StatusInfoBox
          label="Port Pass"
          value={
            selectedOrder.vehicle?.portPass ||
            "-"
          }
          tone={panelBadge(
            selectedOrder.vehicle?.portPass ||
              "-"
          )}
        />

        <StatusInfoBox
          label="Condition Status"
          value={
            selectedOrder.vehicle?.condition ||
            "-"
          }
          tone={panelBadge(
            selectedOrder.vehicle?.condition ||
              "-"
          )}
        />

      </div>

      <SectionTitle title="Driver Details" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

        <InfoBox
          label="Driver Name"
          value={
            selectedOrder.driverDetails?.name ||
            selectedOrder.driver
          }
        />

        <StatusInfoBox
          label="License Status"
          value={
            selectedOrder.driverDetails?.license ||
            "-"
          }
          tone={panelBadge(
            selectedOrder.driverDetails?.license ||
              "-"
          )}
        />

        <StatusInfoBox
          label="Police Report"
          value={
            selectedOrder.driverDetails?.policeReport ||
            "-"
          }
          tone={panelBadge(
            selectedOrder.driverDetails?.policeReport ||
              "-"
          )}
        />

      </div>

      <SectionTitle title="Special Instructions" />

      <div className="mb-6">

        <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4 text-sm text-[#1E293B]">
          {
            selectedOrder.specialInstructions ||
            "-"
          }

        </div>

      </div>

      <SectionTitle title="Order Progress" />

      <div className="mb-6">

        <div className="flex flex-wrap items-center gap-3">

          {selectedOrder.progress.map(
            (step, idx) => {
              const active =
                idx <=
                selectedOrder.currentStep;

              const last =
                idx ===
                selectedOrder.progress.length -
                  1;

              return (
                <div
                  key={step}
                  className="flex items-center gap-3"

                >

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
                        idx <
                        selectedOrder.currentStep
                          ? "bg-[#1E40AF]"
                          : "bg-slate-300"
                      }`}
                    />
                  )}

                </div>
              );
            }
          )}

        </div>

      </div>

      <SectionTitle title="Quick Actions" />

      <div className="flex flex-wrap gap-3">

        {/* Created order */}
        {selectedOrder.status ===
          "Created" && (
          <button
            onClick={() =>
              handleAction(
                "bidding",
                selectedOrder
              )
            }
            className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A]"

          >
            Open Bidding
          </button>
        )}

        {/* NEW: Open for Bids order */}
        {selectedOrder.status ===
          "Open for Bids" && (
          <button
            onClick={() =>
              goToBidding(
                selectedOrder
              )
            }
            className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A]"
          >
            View Bidding
          </button>
        )}

        {selectedOrder.status ===
          "Bid Accepted" && (
          <button
            onClick={() =>
              openAssignDriver(
                selectedOrder
              )
            }
            className="flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-sm text-white hover:bg-[#166534]"
          >
            <UserCheck size={15} />
            Assign Driver
          </button>
        )}

        {selectedOrder.status !==
          "Archived" && (
          <>
            <button
              onClick={() =>
                goToTracking(
                  selectedOrder
                )
              }
              className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A]"

            >
              Track Order
            </button>

            {canReportIssue(
              selectedOrder.status
            ) && (
              <button
                onClick={() =>
                  openIssueForm(
                    selectedOrder
                  )
                }
                className="rounded-lg bg-orange-100 px-4 py-2 text-sm text-[#EA580C] hover:opacity-90"
              >
                Report Issue
              </button>
            )}
          </>
        )}

        {selectedOrder.status ===
          "Completed" && (
          <button
            onClick={() =>
              setArchiveOrder(
                selectedOrder
              )
            }
            className="rounded-lg bg-[#16A34A] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Archive Order
          </button>
        )}

        {selectedOrder.status ===
          "Archived" && (
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
      <h3 className="text-base font-semibold text-[#1E293B]">
        {title}
      </h3>
    </div>
  );
}

// Reusable information box
function InfoBox({
  label,
  value,
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">

      <p className="mb-1 text-xs text-slate-500">
        {label}
      </p>

      <p className="text-sm font-medium text-[#1E293B]">
        {value}
      </p>


    </div>
  );
}

// Reusable status box
function StatusInfoBox({
  label,
  value,
  tone,
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">

      <p className="mb-1 text-xs text-slate-500">
        {label}
      </p>

      <span
        className={`inline-block rounded-full px-3 py-1 text-xs ${tone}`}
      >

        {value}
      </span>

    </div>
  );
}

export default Orders;