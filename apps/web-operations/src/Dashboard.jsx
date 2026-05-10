import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Plus,
  Eye,
  ArrowRight,
  Clock,
  Package,
  Gavel,
  Truck,
  CheckCircle,
} from "lucide-react";

// Backend API base URL used to fetch dashboard data
const API_BASE_URL = "http://localhost:5000/api/operations";

function Dashboard({ onNavigate }) {
  // Main dashboard data states
  const [orders, setOrders] = useState([]);
  const [issues, setIssues] = useState([]);
  const [trackingRecords, setTrackingRecords] = useState([]);

  // Loading and error states for dashboard API calls
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Loads dashboard data when the page opens
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetches orders, issues, and tracking updates from backend at the same time
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [ordersRes, issuesRes, trackingRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/issues`),
        fetch(`${API_BASE_URL}/tracking-all-debug`),
      ]);

      // Loads orders if API request is successful
      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const ordersData = await ordersRes.value.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        setOrders([]);
      }

      // Loads issues if API request is successful
      if (issuesRes.status === "fulfilled" && issuesRes.value.ok) {
        const issuesData = await issuesRes.value.json();
        setIssues(Array.isArray(issuesData) ? issuesData : []);
      } else {
        setIssues([]);
      }

      // Loads tracking updates if API request is successful
      if (trackingRes.status === "fulfilled" && trackingRes.value.ok) {
        const trackingData = await trackingRes.value.json();

        if (Array.isArray(trackingData)) {
          setTrackingRecords(trackingData);
        } else if (Array.isArray(trackingData?.data)) {
          setTrackingRecords(trackingData.data);
        } else {
          setTrackingRecords([]);
        }
      } else {
        setTrackingRecords([]);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Dashboard data could not be loaded. Please check backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Converts raw backend order data into a clean frontend format
  const normalizedOrders = useMemo(() => {
    return orders.map((order) => ({
      id: order.order_id,
      orderReference: order.order_reference || "N/A",
      type: formatType(order.order_type),
      supplier:
        order.supplier_name ||
        order.supplier ||
        order.suppliers?.company_name ||
        "Not assigned",
      pickup:
        order.pickup_state ||
        order.pickup_country ||
        order.pickup ||
        "-",
      destination:
        order.destination_state ||
        order.destination_country ||
        order.destination ||
        "-",
      status: order.current_status || "created",
      expectedArrival: order.expected_arrival || null,
      createdAt: order.created_at || null,
    }));
  }, [orders]);

  // Calculates mini card values for dashboard summary
  const dashboardStats = useMemo(() => {
    const activeOrders = normalizedOrders.filter(
      (order) => normalizeStatus(order.status) !== "completed"
    ).length;

    const openForBids = normalizedOrders.filter((order) =>
      ["open_for_bids", "bidding_open"].includes(normalizeStatus(order.status))
    ).length;

    const inTracking = normalizedOrders.filter((order) =>
      ["driver_assigned", "in_transit", "at_port", "at_freezone"].includes(
        normalizeStatus(order.status)
      )
    ).length;

    const completedOrders = normalizedOrders.filter(
      (order) => normalizeStatus(order.status) === "completed"
    ).length;

    const issueCount = issues.length;

    return {
      activeOrders,
      openForBids,
      inTracking,
      completedOrders,
      issueCount,
    };
  }, [normalizedOrders, issues]);

  // Shows only latest 8 orders in the order overview table
  const recentOrders = useMemo(() => {
    return normalizedOrders.slice(0, 8);
  }, [normalizedOrders]);

  // Finds orders that need quick attention from Operations
  const attentionOrders = useMemo(() => {
    return normalizedOrders
      .filter((order) => {
        const status = normalizeStatus(order.status);

        return (
          status === "created" ||
          status === "open_for_bids" ||
          order.supplier === "Not assigned"
        );
      })
      .slice(0, 4);
  }, [normalizedOrders]);

  // Shows latest 4 tracking updates based on recorded date/time
  const latestTracking = useMemo(() => {
    return [...trackingRecords]
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
      .slice(0, 4);
  }, [trackingRecords]);

  // Saves selected order and navigates to Orders page
  const handleViewOrder = (order) => {
    sessionStorage.setItem(
      "selectedOrder",
      JSON.stringify({
        order_id: order.id,
        order_reference: order.orderReference,
      })
    );

    onNavigate("/orders");
  };

  // Saves selected order and navigates to Tracking page
  const handleTrackOrder = (order) => {
    sessionStorage.setItem(
      "trackingOrder",
      JSON.stringify({
        id: order.orderReference,
        dbId: order.id,
        type: order.type,
        supplier: order.supplier,
        pickup: order.pickup,
        destination: order.destination,
        status: order.status,
        expectedDay: order.expectedArrival || "N/A",
      })
    );

    onNavigate("/tracking");
  };

  return (
    <div className="h-full overflow-auto bg-[#EFF6FF] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Dashboard title and create order action */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Dashboard</h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome back! Here&apos;s what&apos;s happening in ConTrack today.
            </p>
          </div>

          <button
            onClick={() => onNavigate("/create")}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#1E40AF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1E3A8A]"
          >
            <Plus size={16} />
            Create New Order
          </button>
        </div>

        {/* Error message shown only if dashboard data fails to load */}
        {errorMessage && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#EA580C]">
            {errorMessage}
          </div>
        )}

        {/* Compact summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <DashboardMiniCard
            title="Active Orders"
            value={dashboardStats.activeOrders}
            icon={Package}
            loading={loading}
            color="blue"
          />

          <DashboardMiniCard
            title="Open for Bids"
            value={dashboardStats.openForBids}
            icon={Gavel}
            loading={loading}
            color="blue"
          />

          <DashboardMiniCard
            title="In Tracking"
            value={dashboardStats.inTracking}
            icon={Truck}
            loading={loading}
            color="orange"
          />

          <DashboardMiniCard
            title="Completed Orders"
            value={dashboardStats.completedOrders}
            icon={CheckCircle}
            loading={loading}
            color="green"
          />

          <DashboardMiniCard
            title="Issues"
            value={dashboardStats.issueCount}
            icon={AlertCircle}
            loading={loading}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Latest order overview table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-[#1E293B]">
                Order Overview
              </h3>

              <p className="text-sm text-slate-500">
                Latest operational orders
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#EFF6FF] text-[#1E293B]">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">
                      Order ID
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">Type</th>
                    <th className="px-5 py-3 text-left font-semibold">Route</th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Supplier
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-8 text-center text-slate-500"
                      >
                        Loading dashboard data...
                      </td>
                    </tr>
                  ) : recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr
                        key={order.orderReference}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-[#1E293B]">
                          {order.orderReference}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
                            {order.type}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {order.pickup} → {order.destination}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {order.supplier}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`${statusColor(
                              order.status
                            )} rounded-lg px-3 py-1 text-xs font-semibold`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#1E40AF] hover:bg-[#EFF6FF]"
                            >
                              <Eye size={14} />
                              View
                            </button>

                            <button
                              onClick={() => handleTrackOrder(order)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#1E40AF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A8A]"
                            >
                              Track
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-8 text-center text-slate-500"
                      >
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right side dashboard panels */}
          <div className="space-y-6">
            {/* Orders that require operational attention */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1E293B]">
                  Needs Attention
                </h3>

                <AlertCircle size={18} className="text-[#EA580C]" />
              </div>

              <div className="space-y-3">
                {attentionOrders.length > 0 ? (
                  attentionOrders.map((order) => (
                    <div
                      key={order.orderReference}
                      className="rounded-xl border border-orange-100 bg-orange-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#1E293B]">
                            {order.orderReference}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatStatus(order.status)} • {order.supplier}
                          </p>
                        </div>

                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-xs font-semibold text-[#1E40AF]"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No urgent operational items.
                  </p>
                )}
              </div>
            </div>

            {/* Latest vehicle/order tracking updates */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1E293B]">
                  Latest Tracking Updates
                </h3>

                <Clock size={18} className="text-[#1E40AF]" />
              </div>

              <div className="space-y-3">
                {latestTracking.length > 0 ? (
                  latestTracking.map((record) => (
                    <div
                      key={record.tracking_id}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <p className="font-semibold text-[#1E293B]">
                        Order #{record.order_id}
                      </p>

                      <p className="text-xs text-slate-500">
                        {record.current_location || "Unknown location"} •{" "}
                        {formatStatus(record.status)}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateTime(record.recorded_at)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No tracking updates available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable mini card component used for dashboard summary counts
function DashboardMiniCard({ title, value, icon: Icon, loading, color }) {
  const colorClasses = {
    blue: "bg-[#EFF6FF] text-[#1E40AF]",
    orange: "bg-orange-50 text-[#EA580C]",
    green: "bg-green-50 text-[#16A34A]",
    red: "bg-red-50 text-[#DC2626]",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-[#1E293B]">
            {loading ? "..." : value}
          </h3>
        </div>

        <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// Normalizes status text so different formats can be compared correctly
function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .trim()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");
}

// Converts database status into readable text
function formatStatus(status) {
  if (!status) return "N/A";

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Converts order type into readable text
function formatType(type) {
  if (!type) return "N/A";

  return String(type).replace(/\b\w/g, (char) => char.toUpperCase());
}

// Returns badge color class based on order status
function statusColor(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "completed") {
    return "bg-green-100 text-[#16A34A]";
  }

  if (normalized === "open_for_bids" || normalized === "bidding_open") {
    return "bg-blue-100 text-[#1E40AF]";
  }

  if (
    normalized === "in_transit" ||
    normalized === "at_port" ||
    normalized === "at_freezone" ||
    normalized === "driver_assigned"
  ) {
    return "bg-orange-100 text-[#EA580C]";
  }

  if (normalized === "issue_reported" || normalized === "issue") {
    return "bg-red-100 text-[#DC2626]";
  }

  return "bg-slate-100 text-slate-600";
}

// Formats tracking timestamp into short readable date/time
function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default Dashboard;