import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  History,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000"
}/api/operations`;

const ISSUE_REFRESH_MS = 10000;
const ISSUES_PER_PAGE = 5;

const TRACKABLE_ORDER_STAGES = new Set([
  "Driver Assigned",
  "In Transit",
  "At Freezone",
  "At Port",
  "Completed",
  "Archived",
]);

function Issues({ onNavigate }) {
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [issueMessages, setIssueMessages] = useState([]);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const tabs = [
    "All",
    "Sent to Admin",
    "Admin Reviewing",
    "Resolved",
  ];

  useEffect(() => {
    fetchIssues();

    try {
      const savedMessages = JSON.parse(
        localStorage.getItem("operationIssueMessages") || "[]"
      );

      setIssueMessages(
        Array.isArray(savedMessages) ? savedMessages : []
      );
    } catch {
      setIssueMessages([]);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchIssues({ silent: true });
    }, ISSUE_REFRESH_MS);

    return () => clearInterval(interval);
  }, []);

  const parseResponse = async (response, fallback = []) => {
    const text = await response.text();

    if (!text) {
      return fallback;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Issues API returned an invalid response. Status: ${response.status}`
      );
    }
  };

  const extractCollection = (result) => {
    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    if (Array.isArray(result?.issues)) {
      return result.issues;
    }

    return [];
  };

  const fetchIssues = async (options = {}) => {
    const silent = options?.silent === true;

    try {
      if (!silent) {
        setIsLoading(true);
      }

      const response = await fetch(`${API_BASE_URL}/issues`);
      const result = await parseResponse(response, []);

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to fetch issues"
        );
      }

      const rawIssues = extractCollection(result);

      const formattedIssues = rawIssues
        .map((issue) => normalizeIssue(issue))
        .filter((issue) =>
          isValidIssueStage(issue.rawOrderStatus)
        );

      setIssues(formattedIssues);
      setLastRefreshAt(new Date());

      setSelectedIssue((currentSelected) => {
        if (!currentSelected) {
          return null;
        }

        return (
          formattedIssues.find(
            (issue) =>
              String(issue.issueDbId) ===
                String(currentSelected.issueDbId) ||
              issue.issueId === currentSelected.issueId
          ) || currentSelected
        );
      });
    } catch (error) {
      console.error("Fetch issues error:", error);

      if (!silent) {
        alert(error.message);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const isValidIssueStage = (status) => {
    const blockedStatuses = new Set([
      "created",
      "open_for_bids",
      "open for bids",
    ]);

    const currentStatus = String(status || "")
      .trim()
      .toLowerCase();

    return !blockedStatuses.has(currentStatus);
  };

  const getIssueKey = (issue) => {
    return (
      issue?.issueDbId ||
      issue?.issueId ||
      issue?.orderId
    );
  };

  const getMessagesForIssue = (issue) => {
    const issueKey = String(getIssueKey(issue));

    return issueMessages.filter(
      (message) =>
        String(message.issueKey) === issueKey
    );
  };

  const normalizeIssue = (issue) => {
    const order = issue.orders || {};
    const supplier = issue.suppliers || {};
    const driver = issue.drivers || {};

    const driverFullName = `${
      driver.first_name || ""
    } ${driver.last_name || ""}`.trim();

    const rawOrderStatus =
      order.current_status ||
      issue.order_stage ||
      issue.order_status ||
      "-";

    const formattedStatus =
      formatIssueStatus(issue.status || "open");

    const reportedBy =
      formatReporter(issue.reported_by);

    const pickupDistrict =
      order.pickup_district ||
      issue.pickup_district ||
      order.pickup_country ||
      issue.pickup_country ||
      "-";

    const pickupLocation =
      order.pickup_location ||
      issue.pickup_location ||
      order.pickup_state ||
      issue.pickup_state ||
      "-";

    const destinationDistrict =
      order.destination_district ||
      issue.destination_district ||
      order.destination_country ||
      issue.destination_country ||
      "-";

    const destinationLocation =
      order.destination_location ||
      issue.destination_location ||
      order.destination_state ||
      issue.destination_state ||
      "-";

    const adminRemark =
      issue.admin_remark ||
      issue.admin_notes ||
      issue.resolution_notes ||
      "";

    return {
      issueId:
        issue.issue_reference ||
        `ISS-${issue.issue_id}`,

      issueDbId:
        issue.issue_id,

      rawOrderStatus,

      dbOrderId:
        order.order_id ||
        issue.order_id ||
        null,

      orderReference:
        order.order_reference ||
        issue.order_reference ||
        null,

      orderId:
        order.order_reference ||
        issue.order_reference ||
        issue.order_id ||
        "-",

      orderType:
        formatOrderType(
          order.order_type ||
            issue.order_type ||
            "-"
        ),

      issueType:
        formatIssueType(issue.issue_type) || "-",

      supplier:
        supplier.company_name ||
        issue.supplier_name ||
        order.supplier_name ||
        issue.supplier ||
        "Not assigned",

      driver:
        driverFullName ||
        issue.driver_name ||
        order.driver_name ||
        issue.driver ||
        "Not assigned",

      pickupDistrict,
      pickupLocation,
      destinationDistrict,
      destinationLocation,

      containerNo:
        order.container_no ||
        issue.container_no ||
        "-",

      expectedArrival:
        order.expected_arrival ||
        issue.expected_arrival ||
        "-",

      route:
        issue.route ||
        `${pickupLocation} → ${destinationLocation}`,

      orderStage:
        formatStatus(rawOrderStatus),

      priority:
        formatPriority(issue.priority || "medium"),

      status:
        formattedStatus,

      reportedBy,

      reported:
        formatDateTime(
          issue.created_at ||
          issue.reported_at
        ),

      updated:
        formatRelativeTime(
          issue.updated_at ||
          issue.created_at ||
          issue.reported_at
        ),

      updatedRaw:
        issue.updated_at ||
        issue.created_at ||
        issue.reported_at ||
        null,

      description:
        issue.description ||
        issue.issue_details ||
        "No issue details provided.",

      adminRemark,
    };
  };

  const getStatusExplanation = (status) => {
    if (status === "Resolved") {
      return "Admin marked this issue as resolved.";
    }

    if (status === "Admin Reviewing") {
      return "Admin is currently reviewing this issue.";
    }

    return "The issue has been sent to Admin and is waiting for review.";
  };

  const getTimelineReviewTitle = (status) => {
    if (status === "Resolved") {
      return "Resolved by Admin";
    }

    if (status === "Admin Reviewing") {
      return "Admin Reviewing";
    }

    return "Waiting for Admin Review";
  };

  const getTimelineReviewDescription = (status) => {
    return getStatusExplanation(status);
  };

  const getModalSubtitle = (status) => {
    if (status === "Resolved") {
      return "Admin has marked this issue as resolved. The order's official workflow status remains separate from the issue status.";
    }

    if (status === "Admin Reviewing") {
      return "Admin is reviewing this issue. Issue review status does not change the order's official workflow stage.";
    }

    return "Issue sent to Admin for review. Reporting an issue does not change the order's official workflow status.";
  };

  const getLocalNotePlaceholder = (status) => {
    if (status === "Resolved") {
      return "Add a local note about why this issue may need another Admin review.";
    }

    if (status === "Admin Reviewing") {
      return "Add a local note or clarification for your own Operations record.";
    }

    return "Add a local Operations note about this issue.";
  };

  const handleLocalFollowUp = (issue) => {
    if (!issue) {
      return;
    }

    if (!followUpMessage.trim()) {
      alert("Please type a note before saving.");
      return;
    }

    const issueKey = String(getIssueKey(issue));

    const newMessage = {
      messageId: Date.now(),
      issueKey,
      orderId: issue.orderId,
      senderRole: "Operations",
      actionLabel:
        issue.status === "Resolved"
          ? "Local Recheck Note"
          : "Local Follow-up Note",
      message: followUpMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [
      ...issueMessages,
      newMessage,
    ];

    setIssueMessages(updatedMessages);

    localStorage.setItem(
      "operationIssueMessages",
      JSON.stringify(updatedMessages)
    );

    setFollowUpMessage("");

    alert(
      "Local Operations note saved in this browser. It has not been sent to Admin."
    );
  };

  const canOpenTracking = (issue) => {
    return (
      issue &&
      TRACKABLE_ORDER_STAGES.has(issue.orderStage)
    );
  };

  const goToTracking = (issue) => {
    if (!issue) {
      return;
    }

    if (!canOpenTracking(issue)) {
      alert(
        "Tracking is available only after a driver has been assigned."
      );
      return;
    }

    if (!issue.dbOrderId && !issue.orderReference) {
      alert(
        "This issue is not linked to a valid order, so Tracking cannot be opened."
      );
      return;
    }

    sessionStorage.setItem(
      "trackingOrder",
      JSON.stringify({
        id:
          issue.orderReference ||
          issue.orderId,

        order_reference:
          issue.orderReference ||
          issue.orderId,

        orderReference:
          issue.orderReference ||
          issue.orderId,

        dbId:
          issue.dbOrderId,

        order_id:
          issue.dbOrderId,

        databaseOrderId:
          issue.dbOrderId,

        type:
          issue.orderType,

        pickupDistrict:
          issue.pickupDistrict,

        pickupLocation:
          issue.pickupLocation,

        destinationDistrict:
          issue.destinationDistrict,

        destinationLocation:
          issue.destinationLocation,

        pickup:
          issue.pickupLocation,

        destination:
          issue.destinationLocation,

        containerNo:
          issue.containerNo,

        supplier:
          issue.supplier,

        driver:
          issue.driver,

        // Tracking.jsx must use this official order status,
        // never the GPS status, for progress.
        status:
          issue.rawOrderStatus,

        current_status:
          issue.rawOrderStatus,

        expectedDay:
          issue.expectedArrival,
      })
    );

    closeIssueModal();

    if (onNavigate) {
      onNavigate("/tracking");
      return;
    }

    window.location.href = "/tracking";
  };

  const openIssueModal = (issue) => {
    setSelectedIssue(issue);
    setFollowUpMessage("");
  };

  const closeIssueModal = () => {
    setSelectedIssue(null);
    setFollowUpMessage("");
  };

  const formatIssueType = (value) => {
    if (!value) {
      return "";
    }

    return String(value)
      .split(",")
      .map((part) =>
        part
          .trim()
          .replaceAll("_", " ")
          .replace(/\b\w/g, (char) =>
            char.toUpperCase()
          )
      )
      .filter(Boolean)
      .join(", ");
  };

  const formatText = (value) => {
    if (!value) {
      return "";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const formatOrderType = (value) => {
    if (!value || value === "-") {
      return "-";
    }

    const normalized = String(value)
      .trim()
      .toLowerCase();

    if (normalized === "import") {
      return "Import";
    }

    if (normalized === "export") {
      return "Export";
    }

    return formatText(value);
  };

  const formatPriority = (value) => {
    const priority = String(value || "")
      .trim()
      .toLowerCase();

    if (priority === "critical") {
      return "Critical";
    }

    if (priority === "high") {
      return "High";
    }

    if (priority === "low") {
      return "Low";
    }

    return "Medium";
  };

  const formatIssueStatus = (value) => {
    const status = String(value || "")
      .trim()
      .toLowerCase();

    if (
      status === "open" ||
      status === "sent_to_admin" ||
      status === "sent to admin"
    ) {
      return "Sent to Admin";
    }

    if (
      status === "escalated" ||
      status === "admin_reviewing" ||
      status === "admin reviewing" ||
      status === "reviewing"
    ) {
      return "Admin Reviewing";
    }

    if (status === "resolved") {
      return "Resolved";
    }

    return formatText(value) || "Sent to Admin";
  };

  const formatStatus = (value) => {
    if (!value || value === "-") {
      return "-";
    }

    const status = String(value)
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_")
      .replaceAll("-", "_");

    const statusMap = {
      created: "Created",
      open_for_bids: "Open for Bids",
      bid_accepted: "Bid Accepted",
      driver_assigned: "Driver Assigned",
      in_transit: "In Transit",
      at_freezone: "At Freezone",
      at_port: "At Port",
      completed: "Completed",
      cancelled: "Cancelled",
      archived: "Archived",
    };

    return statusMap[status] || formatText(value);
  };

  const formatReporter = (value) => {
    if (!value) {
      return "Operations Team";
    }

    const text = String(value).trim();

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidPattern.test(text)) {
      return "Operations Team";
    }

    return text;
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const diffMs = Date.now() - date.getTime();

    if (diffMs < 0) {
      return "Just now";
    }

    const diffMinutes = Math.floor(
      diffMs / 60000
    );

    const diffHours = Math.floor(
      diffMinutes / 60
    );

    const diffDays = Math.floor(
      diffHours / 24
    );

    if (diffMinutes < 1) {
      return "Just now";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} min${
        diffMinutes === 1 ? "" : "s"
      } ago`;
    }

    if (diffHours < 24) {
      return `${diffHours} hour${
        diffHours === 1 ? "" : "s"
      } ago`;
    }

    return `${diffDays} day${
      diffDays === 1 ? "" : "s"
    } ago`;
  };

  const filteredIssues = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return issues.filter((issue) => {
      const matchTab =
        tab === "All" ||
        issue.status === tab;

      if (!searchValue) {
        return matchTab;
      }

      const searchable = [
        issue.orderId,
        issue.issueId,
        issue.issueType,
        issue.supplier,
        issue.driver,
        issue.orderStage,
      ]
        .map((value) =>
          String(value || "").toLowerCase()
        )
        .join(" ");

      return (
        matchTab &&
        searchable.includes(searchValue)
      );
    });
  }, [issues, tab, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIssues.length / ISSUES_PER_PAGE)
  );

  const activePage = Math.min(currentPage, totalPages);

  const firstIssueIndex =
    (activePage - 1) * ISSUES_PER_PAGE;

  const paginatedIssues = filteredIssues.slice(
    firstIssueIndex,
    firstIssueIndex + ISSUES_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getPriorityBadge = (priority) => {
    if (priority === "Critical") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-[#B91C1C]">
          <AlertTriangle size={12} />
          Critical
        </span>
      );
    }

    if (priority === "High") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-[#EA580C]">
          <AlertTriangle size={12} />
          High
        </span>
      );
    }

    if (priority === "Low") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-[#16A34A]">
          Low
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#1E40AF]">
        Medium
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === "Sent to Admin") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#052659]">
          <Send size={12} />
          Sent to Admin
        </span>
      );
    }

    if (status === "Admin Reviewing") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-[#EA580C]">
          <Clock3 size={12} />
          Admin Reviewing
        </span>
      );
    }

    if (status === "Resolved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-[#16A34A]">
          <CheckCircle2 size={12} />
          Resolved
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-full w-full bg-[#EBF4FF] px-6 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-3">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  tab === item
                    ? "bg-[#052659] text-white"
                    : "bg-slate-100 text-[#1E293B] hover:bg-[#EBF4FF]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm lg:w-[330px]">
              <Search
                size={16}
                className="text-slate-400"
              />

              <input
                type="text"
                placeholder="Search order, supplier, driver, issue..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="w-full bg-transparent text-sm text-[#1E293B] outline-none"
              />
            </div>

            <button
              onClick={() => fetchIssues()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#1E40AF] hover:bg-[#EFF6FF] disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  isLoading ? "animate-spin" : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>

        {lastRefreshAt && (
          <p className="mt-3 text-right text-[11px] text-slate-400">
            Last refreshed:{" "}
            {lastRefreshAt.toLocaleTimeString()}
          </p>
        )}

        <div className="mt-4 overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#EBF4FF] text-[#1E293B]">
                <tr>
                  <th className="whitespace-nowrap px-4 py-4 font-semibold">
                    Order ID
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-semibold">
                    Issue Type
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-semibold">
                    Supplier
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-semibold">
                    Order Stage
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-semibold">
                    Priority
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-semibold">
                    Review Status
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-semibold">
                    Last Updated
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Loading issues...
                    </td>
                  </tr>
                ) : filteredIssues.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No operational issues found.
                    </td>
                  </tr>
                ) : (
                  paginatedIssues.map((issue) => (
                    <tr
                      key={
                        issue.issueDbId ||
                        issue.issueId
                      }
                      className="border-b border-slate-200 bg-white hover:bg-[#EBF4FF]"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#1E293B]">
                        {issue.orderId}

                        <p className="text-xs font-normal text-slate-500">
                          {issue.orderType}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-[#1E293B]">
                        {issue.issueType}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                        <div className="flex items-center gap-2">
                          <Building2
                            size={15}
                            className="text-slate-400"
                          />

                          {issue.supplier}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                        {issue.orderStage}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {getPriorityBadge(
                          issue.priority
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {getStatusBadge(
                          issue.status
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {issue.updated}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <button
                          onClick={() =>
                            openIssueModal(issue)
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-4 py-2 text-xs font-medium text-white hover:bg-[#5483B3]"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredIssues.length > 0 && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-4">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1)
                  )
                }
                disabled={activePage === 1}
                aria-label="Previous page"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1E293B] transition hover:border-[#052659] hover:bg-[#EBF4FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="min-w-[96px] text-center text-sm font-medium text-[#1E293B]">
                Page {activePage} of {totalPages}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                disabled={activePage === totalPages}
                aria-label="Next page"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1E293B] transition hover:border-[#052659] hover:bg-[#EBF4FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#1E293B]">
                  {selectedIssue.orderId} —{" "}
                  {selectedIssue.issueType}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {getModalSubtitle(
                    selectedIssue.status
                  )}
                </p>
              </div>

              <button
                onClick={closeIssueModal}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <DetailCard
                label="Issue ID"
                value={selectedIssue.issueId}
              />

              <DetailCard
                label="Order ID"
                value={selectedIssue.orderId}
              />

              <DetailCard
                label="Supplier"
                value={selectedIssue.supplier}
              />

              <DetailCard
                label="Driver"
                value={selectedIssue.driver}
              />

              <DetailCard
                label="Route"
                value={selectedIssue.route}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 p-5">
                  <h3 className="mb-3 text-base font-semibold text-[#1E293B]">
                    Issue Details
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InfoItem
                      label="Priority"
                      value={getPriorityBadge(
                        selectedIssue.priority
                      )}
                    />

                    <InfoItem
                      label="Review Status"
                      value={getStatusBadge(
                        selectedIssue.status
                      )}
                    />

                    <InfoItem
                      label="Order Stage"
                      value={
                        selectedIssue.orderStage
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-lg bg-[#EBF4FF] p-4">
                    <p className="text-sm leading-6 text-slate-600">
                      {
                        selectedIssue.description
                      }
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-5">
                  <h3 className="mb-3 text-base font-semibold text-[#1E293B]">
                    Admin Review
                  </h3>

                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={20}
                        className="mt-0.5 text-[#052659]"
                      />

                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          Admin Team
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {getStatusExplanation(
                            selectedIssue.status
                          )}
                        </p>

                        {selectedIssue.adminRemark && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-white p-3">
                            <p className="text-xs font-semibold text-slate-500">
                              Admin Remark
                            </p>

                            <p className="mt-1 text-sm text-[#1E293B]">
                              {
                                selectedIssue.adminRemark
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1E293B]">
                        Local Operations Note
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Saved only in this browser.
                        This is not sent to Admin.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#EBF4FF] px-3 py-1 text-xs font-medium text-[#052659]">
                      Local Note
                    </span>
                  </div>

                  <textarea
                    value={followUpMessage}
                    onChange={(event) =>
                      setFollowUpMessage(
                        event.target.value
                      )
                    }
                    rows="4"
                    placeholder={getLocalNotePlaceholder(
                      selectedIssue.status
                    )}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#1E293B] outline-none focus:border-[#052659]"
                  />

                  <div className="mt-3 flex flex-wrap justify-end gap-3">
                    {canOpenTracking(
                      selectedIssue
                    ) && (
                      <button
                        onClick={() =>
                          goToTracking(
                            selectedIssue
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-[#1E40AF] px-4 py-2 text-sm font-medium text-[#1E40AF] hover:bg-[#EFF6FF]"
                      >
                        <Truck size={16} />
                        View Tracking
                      </button>
                    )}

                    <button
                      onClick={() =>
                        handleLocalFollowUp(
                          selectedIssue
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-4 py-2 text-sm font-medium text-white hover:bg-[#5483B3]"
                    >
                      <Send size={16} />
                      Save Local Note
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#1E293B]">
                  <History size={18} />
                  Issue Timeline
                </h3>

                <div className="space-y-5">
                  <TimelineItem
                    icon={<Send size={14} />}
                    title="Issue Sent to Admin"
                    description={`Report submitted by ${selectedIssue.reportedBy}`}
                    time={selectedIssue.reported}
                  />

                  <TimelineItem
                    icon={
                      selectedIssue.status ===
                      "Resolved" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )
                    }
                    title={getTimelineReviewTitle(
                      selectedIssue.status
                    )}
                    description={getTimelineReviewDescription(
                      selectedIssue.status
                    )}
                    time={selectedIssue.updated}
                  />

                  {getMessagesForIssue(
                    selectedIssue
                  ).map((message) => (
                    <TimelineItem
                      key={message.messageId}
                      icon={<Send size={14} />}
                      title={
                        message.actionLabel
                      }
                      description={
                        message.message
                      }
                      time={formatRelativeTime(
                        message.createdAt
                      )}
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-[#EBF4FF] p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarDays size={15} />
                    Reported on{" "}
                    {selectedIssue.reported}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <UserRound size={15} />
                    {selectedIssue.reportedBy}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#EBF4FF] p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-[#1E293B]">
        {value || "-"}
      </p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs text-slate-500">
        {label}
      </p>

      <div className="text-sm font-medium text-[#1E293B]">
        {value}
      </div>
    </div>
  );
}

function TimelineItem({
  icon,
  title,
  description,
  time,
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EBF4FF] text-[#052659]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1E293B]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>

        <p className="mt-1 text-xs font-medium text-slate-400">
          {time}
        </p>
      </div>
    </div>
  );
}

export default Issues;
