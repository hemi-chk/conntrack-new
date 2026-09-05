import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PlusSquare,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const OPS_API = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000"
}/api/operations`;

const ORDERS_PER_PAGE = 5;

function Orders({ onNavigate }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [issueFilter, setIssueFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueOrder, setIssueOrder] = useState(null);
  const [archiveOrder, setArchiveOrder] = useState(null);

  const [ordersData, setOrdersData] = useState([]);
  const [backendIssues, setBackendIssues] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingIssue, setIsSendingIssue] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const [issueTypes, setIssueTypes] = useState([]);
  const [priority, setPriority] = useState("medium");
  const [issueDetails, setIssueDetails] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchBackendIssues();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setOpenMenu(null);
  }, [searchTerm, statusFilter, typeFilter, issueFilter]);

  const parseResponse = async (response, fallback = {}) => {
    const text = await response.text();

    if (!text) {
      return fallback;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Backend returned an invalid response. Status: ${response.status}`
      );
    }
  };

  const extractCollection = (result, key) => {
    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    if (Array.isArray(result?.[key])) {
      return result[key];
    }

    return [];
  };

  const normalizeStatus = (status) => {
    if (!status) return "Created";

    const cleanStatus = String(status).trim().toLowerCase();

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
        return String(status);
    }
  };

  const normalizeType = (type) => {
    if (!type) return "-";

    const value = String(type).trim();

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

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

  const getAssignedValue = (value) => {
    if (value && String(value).trim() !== "") {
      return String(value).trim();
    }

    return "Not assigned";
  };

  const canTrackOrder = (status) => {
    return [
      "Driver Assigned",
      "In Transit",
      "At Freezone",
      "At Port",
      "Completed",
    ].includes(status);
  };

  const canViewBidResult = (status) => {
    return [
      "Bid Accepted",
      "Driver Assigned",
      "In Transit",
      "At Freezone",
      "At Port",
      "Completed",
      "Archived",
    ].includes(status);
  };

  const canReportIssue = (status) => {
    return [
      "Bid Accepted",
      "Driver Assigned",
      "In Transit",
      "At Freezone",
      "At Port",
      "Completed",
      "Archived",
    ].includes(status);
  };

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

  const normalizeIssueType = (value) => {
    if (!value) return "Issue";

    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatIssueDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

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
          issue.issue_type || "Issue"
        ),
      ],

      priority: String(
        issue.priority || "medium"
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

      source: "backend",
    };
  };

  const fetchBackendIssues = async () => {
    try {
      const response = await fetch(`${OPS_API}/issues`);
      const result = await parseResponse(response, []);

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          "Failed to fetch issues"
        );
      }

      const issues = extractCollection(result, "issues");
      setBackendIssues(issues.map(mapBackendIssue));
    } catch (error) {
      console.error("Orders issue fetch error:", error);
    }
  };

  const getLatestIssueForOrder = (orderOrId) => {
    const orderReference =
      typeof orderOrId === "object"
        ? orderOrId?.id
        : orderOrId;

    const databaseOrderId =
      typeof orderOrId === "object"
        ? orderOrId?.dbId
        : ordersData.find(
            (order) => order.id === orderReference
          )?.dbId;

    const relatedIssues = backendIssues.filter((issue) => {
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

      return matchesReference || matchesDatabaseId;
    });

    if (relatedIssues.length === 0) {
      return null;
    }

    return [...relatedIssues].sort((a, b) => {
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
    })[0];
  };

  const mapDatabaseOrder = (order) => {
    const status = normalizeStatus(
      order.current_status || order.status
    );

    const supplierName = getAssignedValue(
      order.supplier_name ||
      order.suppliers?.company_name ||
      order.supplier
    );

    const driverName = getAssignedValue(
      order.driver_name ||
      order.drivers?.name ||
      [
        order.drivers?.first_name,
        order.drivers?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
    );

    const pickupDistrict =
      order.pickup_district ||
      order.pickup_country ||
      "-";

    const pickupLocation =
      order.pickup_location ||
      order.pickup_state ||
      "-";

    const destinationDistrict =
      order.destination_district ||
      order.destination_country ||
      "-";

    const destinationLocation =
      order.destination_location ||
      order.destination_state ||
      "-";

    return {
      id:
        order.order_reference ||
        `ORDER-${order.order_id}`,

      dbId: order.order_id,
      orderId: order.order_id,

      orderReference:
        order.order_reference ||
        `ORDER-${order.order_id}`,

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

      cargoType:
        order.cargo_type ||
        "-",

      cargoWeight:
        order.cargo_weight ??
        "-",

      pickupDate:
        order.pickup_date ||
        "-",

      expectedArrival:
        order.expected_arrival ||
        "-",

      vehicleType:
        order.vehicle_type ||
        "-",

      vehicleNo:
        order.vehicle_number ||
        order.vehicles?.vehicle_number ||
        "-",

      containerNo:
        order.container_no ||
        "-",

      specialInstructions:
        order.special_instructions ||
        "-",

      vehicle: {
        insurance:
          order.insurance_status ||
          order.vehicles?.insurance_status ||
          "-",

        portPass:
          order.port_pass_status ||
          order.vehicles?.port_pass_status ||
          "-",

        condition:
          order.condition_status ||
          order.vehicles?.condition_status ||
          "-",
      },

      driverDetails: {
        name: driverName,

        license:
          order.license_status ||
          order.drivers?.license_status ||
          "-",

        policeReport:
          order.police_report_status ||
          order.drivers?.police_report_status ||
          "-",
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

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${OPS_API}/orders`);
      const result = await parseResponse(response, []);

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          "Failed to fetch orders"
        );
      }

      const rawOrders = extractCollection(result, "orders");
      const mappedOrders = rawOrders.map(mapDatabaseOrder);

      setOrdersData(mappedOrders);

      setSelectedOrder((currentSelected) => {
        if (!currentSelected) {
          return null;
        }

        return (
          mappedOrders.find(
            (order) =>
              String(order.dbId) ===
                String(currentSelected.dbId) ||
              order.id === currentSelected.id
          ) || currentSelected
        );
      });
    } catch (error) {
      console.error("Fetch orders error:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = ordersData.filter((order) => {
    const latestIssue = getLatestIssueForOrder(order);

    const matchesStatus =
      statusFilter === "All" || order.status === statusFilter;

    const matchesType =
      typeFilter === "All" || order.type === typeFilter;

    const matchesIssue =
      issueFilter === "All" ||
      (issueFilter === "With Issues" && Boolean(latestIssue)) ||
      (issueFilter === "Without Issues" && !latestIssue);

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const issueSearchText = latestIssue
      ? [
          latestIssue.status,
          latestIssue.priority,
          ...(latestIssue.issueTypes || []),
          latestIssue.details,
        ]
          .filter(Boolean)
          .join(" ")
      : "no issue";

    const searchableText = [
      order.id,
      order.orderReference,
      order.type,
      order.supplier,
      order.driver,
      order.pickupDistrict,
      order.pickupLocation,
      order.destinationDistrict,
      order.destinationLocation,
      order.status,
      issueSearchText,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      searchableText.includes(normalizedSearch);

    return (
      matchesStatus &&
      matchesType &&
      matchesIssue &&
      matchesSearch
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  );

  const activePage = Math.min(currentPage, totalPages);
  const firstOrderIndex = (activePage - 1) * ORDERS_PER_PAGE;
  const lastOrderIndex = firstOrderIndex + ORDERS_PER_PAGE;

  const paginatedOrders = filteredOrders.slice(
    firstOrderIndex,
    lastOrderIndex
  );

  const showingFrom =
    filteredOrders.length === 0 ? 0 : firstOrderIndex + 1;

  const showingTo = Math.min(
    lastOrderIndex,
    filteredOrders.length
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
    setOpenMenu(null);
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
    setOpenMenu(null);
  };

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
        return `${base} bg-slate-100 text-slate-600`;
    }
  };

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

  const panelBadge = (value) => {
    const normalized = String(value || "").trim().toLowerCase();

    if (!normalized || normalized === "-") {
      return "bg-slate-100 text-slate-600";
    }

    if (
      normalized === "approved" ||
      normalized === "verified" ||
      normalized === "valid" ||
      normalized === "good condition" ||
      normalized.startsWith("valid until")
    ) {
      return "bg-green-100 text-[#16A34A]";
    }

    if (
      normalized === "pending" ||
      normalized === "pending verification" ||
      normalized === "needs inspection"
    ) {
      return "bg-orange-100 text-[#EA580C]";
    }

    if (
      normalized === "expired" ||
      normalized === "invalid" ||
      normalized === "rejected" ||
      normalized === "blocked"
    ) {
      return "bg-red-100 text-[#DC2626]";
    }

    return "bg-slate-100 text-slate-600";
  };

  const goToTracking = (order) => {
    if (!canTrackOrder(order.status)) {
      alert(
        "Tracking is available only after a driver has been assigned."
      );
      return;
    }

    sessionStorage.setItem(
      "trackingOrder",
      JSON.stringify({
        id: order.id,
        order_reference: order.id,
        orderReference:
          order.orderReference ||
          order.id,

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
          order.vehicleNo,

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

    onNavigate && onNavigate("/tracking");
  };

  const goToBidding = (order) => {
    sessionStorage.setItem(
      "biddingOrder",
      JSON.stringify({
        ...order,

        id: order.id,

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

    onNavigate && onNavigate("/bidding");
  };

  const openIssueForm = (order) => {
    if (!canReportIssue(order.status)) {
      alert(
        "Issues can be reported only after bidding is completed and operational handling has started."
      );
      return;
    }

    setOpenMenu(null);
    setIssueOrder(order);

    setIssueTypes(
      order.status === "Archived"
        ? ["Archive Mistake"]
        : []
    );

    setPriority("medium");
    setIssueDetails("");
  };

  const toggleIssueType = (type) => {
    setIssueTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

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
      setIsSendingIssue(true);

      const response = await fetch(`${OPS_API}/issues`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          order_id: issueOrder.dbId,
          issue_type: issueTypes.join(", "),
          priority,
          description: issueDetails.trim(),

          supplier_name:
            issueOrder.supplier,

          driver_name:
            issueOrder.driver,
        }),
      });

      const result = await parseResponse(response, {});

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          "Failed to send issue to Admin."
        );
      }

      await fetchBackendIssues();

      alert(
        `Issue report for ${issueOrder.id} sent to Admin Team successfully.`
      );

      setIssueOrder(null);
      setIssueTypes([]);
      setPriority("medium");
      setIssueDetails("");
    } catch (error) {
      console.error("Send issue error:", error);
      alert(error.message);
    } finally {
      setIsSendingIssue(false);
    }
  };

  const confirmArchiveOrder = async () => {
    if (!archiveOrder) return;

    if (archiveOrder.status !== "Completed") {
      alert(
        "Only completed orders can be archived by Operations."
      );

      setArchiveOrder(null);
      return;
    }

    try {
      setIsArchiving(true);

      const response = await fetch(
        `${OPS_API}/orders/${archiveOrder.dbId}/archive`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await parseResponse(response, {});

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          "Failed to archive order."
        );
      }

      await fetchOrders();

      alert(
        `Order ${archiveOrder.id} archived successfully by Operations.`
      );

      setArchiveOrder(null);
      setSelectedOrder(null);
      setOpenMenu(null);
    } catch (error) {
      console.error("Archive order error:", error);
      alert(error.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleAction = (action, order) => {
    setOpenMenu(null);

    switch (action) {
      case "details":
        setSelectedOrder(order);
        break;

      case "bidding":
        if (order.status !== "Created") {
          alert(
            "Bidding can be opened only for newly created orders."
          );
          return;
        }

        goToBidding(order);
        break;

      case "view_bidding":
        if (order.status !== "Open for Bids") {
          alert(
            "Only orders currently open for bids can be viewed in Bidding."
          );
          return;
        }

        goToBidding(order);
        break;

      case "view_bid_result":
        if (!canViewBidResult(order.status)) {
          alert(
            "Bid Result is available only after the bidding stage has been completed."
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
        if (order.status !== "Completed") {
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

  const openManageDropdown = (event, order) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 192;
    const estimatedMenuHeight = 240;
    const viewportPadding = 12;

    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const shouldOpenUpward =
      spaceBelow < estimatedMenuHeight &&
      buttonRect.top > estimatedMenuHeight;

    const left = Math.min(
      Math.max(
        viewportPadding,
        buttonRect.right - menuWidth
      ),
      window.innerWidth - menuWidth - viewportPadding
    );

    setMenuPosition({
      left,
      top: shouldOpenUpward
        ? null
        : buttonRect.bottom + 8,
      bottom: shouldOpenUpward
        ? window.innerHeight - buttonRect.top + 8
        : null,
    });

    setOpenMenu((current) =>
      current === order.dbId ? null : order.dbId
    );
  };

  const statusOptions = [
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
  ];

  const typeOptions = [
    "All",
    "Import",
    "Export",
  ];

  const issueOptions = [
    "All",
    "With Issues",
    "Without Issues",
  ];

  return (
    <div className="min-h-full w-full bg-[#EBF4FF] px-8 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by order ID, district, driver, type or issue..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1E293B] outline-none transition focus:border-[#052659] focus:ring-2 focus:ring-[#EBF4FF]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1E293B] outline-none focus:border-[#052659] focus:ring-2 focus:ring-[#EBF4FF]"
            >
              <option value="All">All Statuses</option>
              {statusOptions
                .filter((status) => status !== "All")
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1E293B] outline-none focus:border-[#052659] focus:ring-2 focus:ring-[#EBF4FF]"
            >
              <option value="All">All Types</option>
              {typeOptions
                .filter((type) => type !== "All")
                .map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
            </select>

            <select
              value={issueFilter}
              onChange={(event) => setIssueFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1E293B] outline-none focus:border-[#052659] focus:ring-2 focus:ring-[#EBF4FF]"
            >
              {issueOptions.map((issueOption) => (
                <option key={issueOption} value={issueOption}>
                  {issueOption === "All"
                    ? "All Issue States"
                    : issueOption}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() =>
              onNavigate &&
              onNavigate("/create")
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#052659] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5483B3]"
          >
            <PlusSquare size={16} />
            Create New Order
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl">
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
                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Order ID
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Type
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Supplier
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Driver
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Pickup
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Destination
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Issue
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => {
                    const latestIssue =
                      getLatestIssueForOrder(order);

                    return (
                      <tr
                        key={order.dbId || order.id}
                        className="border-b border-slate-200 bg-white hover:bg-[#F8FAFC]"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#1E293B]">
                          {order.id}
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-[#1E293B]">
                          {order.type}
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-[#1E293B]">
                          {order.supplier}
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-[#1E293B]">
                          {order.driver}
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-medium text-[#1E293B]">
                            {order.pickupLocation}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {order.pickupDistrict}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-medium text-[#1E293B]">
                            {order.destinationLocation}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {order.destinationDistrict}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-5">
                          <span className={statusBadge(order.status)}>
                            {order.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-5">
                          {latestIssue ? (
                            <button
                              type="button"
                              onClick={() => setSelectedIssue(latestIssue)}
                              className={`${issueBadge(
                                latestIssue
                              )} cursor-pointer transition hover:opacity-80`}
                              title="View issue details"
                            >
                              {`${latestIssue.status} - ${latestIssue.priority}`}
                            </button>
                          ) : (
                            <span className={issueBadge(null)}>
                              No Issue
                            </span>
                          )}
                        </td>

                        <td className="relative whitespace-nowrap px-4 py-4 text-center">
                          <div className="relative inline-block">
                            <button
                              onClick={(event) =>
                                openManageDropdown(
                                  event,
                                  order
                                )
                              }
                              className="rounded-lg bg-[#052659] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#5483B3]"
                            >
                              Manage ▾
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && filteredOrders.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {showingFrom}–{showingTo} of {filteredOrders.length}{" "}
                {filteredOrders.length === 1 ? "order" : "orders"}
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={activePage === 1}
                  aria-label="Previous page"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1E293B] transition hover:border-[#052659] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="min-w-[96px] text-center text-sm font-medium text-[#1E293B]">
                  Page {activePage} of {totalPages}
                </div>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={activePage === totalPages}
                  aria-label="Next page"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1E293B] transition hover:border-[#052659] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {openMenu !== null &&
        menuPosition &&
        createPortal(
          <div
            className="fixed inset-0 z-[999]"
            onClick={() => {
              setOpenMenu(null);
              setMenuPosition(null);
            }}
          >
            {(() => {
              const order = ordersData.find(
                (item) => item.dbId === openMenu
              );

              if (!order) {
                return null;
              }

              return (
                <div
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  className="fixed w-48 overflow-hidden rounded-lg border border-slate-200 bg-white text-left text-xs shadow-xl"
                  style={{
                    left: menuPosition.left,
                    top: menuPosition.top ?? undefined,
                    bottom:
                      menuPosition.bottom ?? undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleAction("details", order)
                    }
                    className="block w-full px-3 py-2.5 text-left text-[#1E293B] hover:bg-[#EBF4FF]"
                  >
                    View Details
                  </button>

                  {order.status === "Created" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAction("bidding", order)
                      }
                      className="block w-full px-3 py-2.5 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      Open Bidding
                    </button>
                  )}

                  {order.status === "Open for Bids" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(
                          "view_bidding",
                          order
                        )
                      }
                      className="block w-full px-3 py-2.5 text-left text-[#1E40AF] hover:bg-[#EFF6FF]"
                    >
                      View Bidding
                    </button>
                  )}

                  {canViewBidResult(order.status) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(
                          "view_bid_result",
                          order
                        )
                      }
                      className="block w-full px-3 py-2.5 text-left font-medium text-[#1E40AF] hover:bg-[#EFF6FF]"
                    >
                      View Bid Result
                    </button>
                  )}

                  {canTrackOrder(order.status) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAction("tracking", order)
                      }
                      className="block w-full px-3 py-2.5 text-left text-[#1E293B] hover:bg-[#F8FAFC]"
                    >
                      Track Order
                    </button>
                  )}

                  {canReportIssue(order.status) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAction("issue", order)
                      }
                      className="block w-full px-3 py-2.5 text-left text-[#DC2626] hover:bg-red-50"
                    >
                      {order.status === "Archived"
                        ? "Report Archive Mistake"
                        : "Report Issue"}
                    </button>
                  )}

                  {order.status === "Completed" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleAction("archive", order)
                      }
                      className="block w-full px-3 py-2.5 text-left text-[#16A34A] hover:bg-green-50"
                    >
                      Archive Order
                    </button>
                  )}
                </div>
              );
            })()}
          </div>,
          document.body
        )}

      {selectedOrder && (
        <OrderDetailsPanel
          selectedOrder={selectedOrder}
          statusBadge={statusBadge}
          panelBadge={panelBadge}
          getLatestIssueForOrder={getLatestIssueForOrder}
          issueBadge={issueBadge}
          setSelectedOrder={setSelectedOrder}
          setSelectedIssue={setSelectedIssue}
          handleAction={handleAction}
          goToTracking={goToTracking}
          goToBidding={goToBidding}
          openIssueForm={openIssueForm}
          setArchiveOrder={setArchiveOrder}
          canReportIssue={canReportIssue}
          canTrackOrder={canTrackOrder}
          canViewBidResult={canViewBidResult}
        />
      )}

      {selectedIssue && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/40 p-6 md:p-10"
          onClick={() => setSelectedIssue(null)}
        >
          <div
            className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1E293B]">
                  Issue Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedIssue.orderId || "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBox
                  label="Issue ID"
                  value={selectedIssue.issueId || "-"}
                />

                <InfoBox
                  label="Order No"
                  value={selectedIssue.orderId || "-"}
                />

                <InfoBox
                  label="Issue Type"
                  value={
                    selectedIssue.issueTypes?.length
                      ? selectedIssue.issueTypes.join(", ")
                      : "-"
                  }
                />

                <InfoBox
                  label="Priority"
                  value={
                    selectedIssue.priority
                      ? selectedIssue.priority.charAt(0).toUpperCase() +
                        selectedIssue.priority.slice(1)
                      : "-"
                  }
                />

                <InfoBox
                  label="Status"
                  value={selectedIssue.status || "-"}
                />

                <InfoBox
                  label="Reported At"
                  value={selectedIssue.createdAt || "-"}
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-[#1E293B]">
                  Issue Description
                </p>

                <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm leading-6 text-[#1E293B]">
                  {selectedIssue.details || "No issue details provided."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {issueOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/40 p-6 md:p-10">
          <div className="my-6 max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#1E293B]">
                  Report Issue to Admin
                </h2>

              </div>

              <button
                onClick={() => setIssueOrder(null)}
                disabled={isSendingIssue}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B] hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBox
                label="Order No"
                value={issueOrder.id}
              />

              <InfoBox
                label="Supplier"
                value={issueOrder.supplier}
              />

              <InfoBox
                label="Driver"
                value={issueOrder.driver}
              />

              <InfoBox
                label="Route"
                value={`${issueOrder.pickupLocation} → ${issueOrder.destinationLocation}`}
              />

              <InfoBox
                label="Pickup District"
                value={issueOrder.pickupDistrict}
              />

              <InfoBox
                label="Destination District"
                value={issueOrder.destinationDistrict}
              />
            </div>

            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-[#1E293B]">
                Issue Type
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  "Driver Issue",
                  "Vehicle Issue",
                  "Delay Issue",
                  "Route / Location Issue",
                  "Delivery Issue",
                  "Archive Mistake",
                  "Other",
                ].map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-[#EBF4FF] px-3 py-2 text-sm text-[#1E293B]"
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
                disabled={isSendingIssue}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={sendIssueToAdmin}
                disabled={isSendingIssue}
                className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A] disabled:opacity-50"
              >
                {isSendingIssue ? "Sending..." : "Send to Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/40 p-6 md:p-10">
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
                Only completed orders can be archived by Operations. There is
                no unarchive action in the Operations interface.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setArchiveOrder(null)}
                disabled={isArchiving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmArchiveOrder}
                disabled={isArchiving}
                className="rounded-lg bg-[#DC2626] px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isArchiving ? "Archiving..." : "Yes, Archive Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDetailsPanel({
  selectedOrder,
  statusBadge,
  panelBadge,
  getLatestIssueForOrder,
  issueBadge,
  setSelectedOrder,
  setSelectedIssue,
  handleAction,
  goToTracking,
  goToBidding,
  openIssueForm,
  setArchiveOrder,
  canReportIssue,
  canTrackOrder,
  canViewBidResult,
}) {
  const latestIssue =
    getLatestIssueForOrder(selectedOrder);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
      onClick={() => setSelectedOrder(null)}
    >
      <div
        className="my-6 w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="max-h-[86vh] overflow-y-auto p-7">
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">
            Order Details - {selectedOrder.id}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedOrder.pickupLocation} →{" "}
            {selectedOrder.destinationLocation}
          </p>
        </div>

        <button
          onClick={() => setSelectedOrder(null)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-[#1E293B] hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoBox
          label="Order Type"
          value={selectedOrder.type}
        />

        <InfoBox
          label="Supplier"
          value={selectedOrder.supplier}
        />

        <InfoBox
          label="Driver"
          value={selectedOrder.driver}
        />

        <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">
          <p className="mb-1 text-xs text-slate-500">
            Current Status
          </p>

          <span className={statusBadge(selectedOrder.status)}>
            {selectedOrder.status}
          </span>
        </div>
      </div>

      <SectionTitle title="Issue Summary" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">
          <p className="mb-1 text-xs text-slate-500">
            Issue Status
          </p>

          <span className={issueBadge(latestIssue)}>
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
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs text-red-500">
                Issue Details
              </p>

              <button
                type="button"
                onClick={() => setSelectedIssue(latestIssue)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[#DC2626] shadow-sm hover:bg-red-50"
              >
                View Issue
              </button>
            </div>

            {latestIssue.details}
          </div>
        </div>
      )}

      <SectionTitle title="Cargo Details" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoBox
          label="Cargo Type"
          value={selectedOrder.cargoType}
        />

        <InfoBox
          label="Cargo Weight"
          value={
            selectedOrder.cargoWeight !== "-"
              ? `${selectedOrder.cargoWeight} kg`
              : "-"
          }
        />

        <InfoBox
          label="Vehicle Type"
          value={selectedOrder.vehicleType}
        />

        <InfoBox
          label="Container No"
          value={selectedOrder.containerNo}
        />
      </div>

      <SectionTitle title="Schedule Details" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoBox
          label="Pickup Date"
          value={selectedOrder.pickupDate}
        />

        <InfoBox
          label="Expected Arrival"
          value={selectedOrder.expectedArrival}
        />

        <InfoBox
          label="Pickup District"
          value={selectedOrder.pickupDistrict}
        />

        <InfoBox
          label="Pickup Location"
          value={selectedOrder.pickupLocation}
        />

        <InfoBox
          label="Destination District"
          value={selectedOrder.destinationDistrict}
        />

        <InfoBox
          label="Destination Location"
          value={selectedOrder.destinationLocation}
        />
      </div>

      <SectionTitle title="Vehicle Details" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusInfoBox
          label="Insurance"
          value={selectedOrder.vehicle?.insurance || "-"}
          tone={panelBadge(
            selectedOrder.vehicle?.insurance || "-"
          )}
        />

        <StatusInfoBox
          label="Port Pass"
          value={selectedOrder.vehicle?.portPass || "-"}
          tone={panelBadge(
            selectedOrder.vehicle?.portPass || "-"
          )}
        />

        <StatusInfoBox
          label="Condition Status"
          value={selectedOrder.vehicle?.condition || "-"}
          tone={panelBadge(
            selectedOrder.vehicle?.condition || "-"
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
          {selectedOrder.specialInstructions || "-"}
        </div>
      </div>

      <SectionTitle title="Order Progress" />

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {selectedOrder.progress.map((step, idx) => {
            const active =
              selectedOrder.status !== "Cancelled" &&
              selectedOrder.status !== "Archived" &&
              idx <= selectedOrder.currentStep;

            const last =
              idx === selectedOrder.progress.length - 1;

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
                      active &&
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

      <div className="flex flex-wrap gap-4">
        {selectedOrder.status === "Created" && (
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

        {selectedOrder.status === "Open for Bids" && (
          <button
            onClick={() =>
              handleAction(
                "view_bidding",
                selectedOrder
              )
            }
            className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A]"
          >
            View Bidding
          </button>
        )}

        {canViewBidResult(selectedOrder.status) && (
          <button
            onClick={() =>
              handleAction(
                "view_bid_result",
                selectedOrder
              )
            }
            className="rounded-lg bg-[#052659] px-4 py-2 text-sm text-white transition hover:bg-[#5483B3]"
          >
            View Bid Result
          </button>
        )}

        {canTrackOrder(selectedOrder.status) && (
          <button
            onClick={() =>
              goToTracking(selectedOrder)
            }
            className="rounded-lg bg-[#1E40AF] px-4 py-2 text-sm text-white hover:bg-[#1E3A8A]"
          >
            Track Order
          </button>
        )}

        {canReportIssue(selectedOrder.status) && (
          <button
            onClick={() =>
              openIssueForm(selectedOrder)
            }
            className="rounded-lg bg-orange-100 px-4 py-2 text-sm text-[#EA580C] hover:opacity-90"
          >
            {selectedOrder.status === "Archived"
              ? "Report Archive Mistake"
              : "Report Issue"}
          </button>
        )}

        {selectedOrder.status === "Completed" && (
          <button
            onClick={() =>
              setArchiveOrder(selectedOrder)
            }
            className="rounded-lg bg-[#16A34A] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Archive Order
          </button>
        )}

        {selectedOrder.status === "Archived" && (
          <span className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-600">
            Archived — Admin must handle any unarchive request
          </span>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="mb-3">
      <h3 className="text-base font-semibold text-[#1E293B]">
        {title}
      </h3>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">
      <p className="mb-1 text-xs text-slate-500">
        {label}
      </p>

      <p className="break-words text-sm font-medium text-[#1E293B]">
        {value || "-"}
      </p>
    </div>
  );
}

function StatusInfoBox({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-[#EFF6FF] p-4">
      <p className="mb-1 text-xs text-slate-500">
        {label}
      </p>

      <span
        className={`inline-block rounded-full px-3 py-1 text-xs ${tone}`}
      >
        {value || "-"}
      </span>
    </div>
  );
}

export default Orders;
