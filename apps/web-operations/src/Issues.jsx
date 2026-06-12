import { useMemo, useState, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Send,
  Building2,
  Truck,
  UserRound,
  CalendarDays,
  History,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/operations";

function Issues() {
  // Main page states for tab filter, search, selected modal issue, loaded issues, and follow-up messages
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [issueMessages, setIssueMessages] = useState([]);

  // Tabs used to filter issue review status
  const tabs = ["All", "Sent to Admin", "Admin Reviewing", "Resolved"];

  // Loads issues from backend and previously saved operation follow-up messages
  useEffect(() => {
    fetchIssues();

    const savedMessages =
      JSON.parse(localStorage.getItem("operationIssueMessages")) || [];

    setIssueMessages(savedMessages);
  }, []);

  // Fetches issue records from backend API and keeps only valid operational issue stages
  const fetchIssues = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/issues`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch issues");
      }

      const formattedIssues = result
        .map((issue) => normalizeIssue(issue))
        .filter((issue) => isValidIssueStage(issue.rawOrderStatus));

      setIssues(formattedIssues);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevents showing issues for orders that are only created or still in bidding stage
  const isValidIssueStage = (status) => {
    const blockedStatuses = ["created", "open_for_bids"];
    const currentStatus = String(status || "").toLowerCase();

    return !blockedStatuses.includes(currentStatus);
  };

  // Creates a unique key for connecting follow-up messages with the selected issue
  const getIssueKey = (issue) => {
    return issue?.issueDbId || issue?.issueId || issue?.orderId;
  };

  // Returns all locally saved follow-up messages for one selected issue
  const getMessagesForIssue = (issue) => {
    const issueKey = getIssueKey(issue);

    return issueMessages.filter((message) => message.issueKey === issueKey);
  };

  // Converts raw backend issue data into a clean frontend format
  const normalizeIssue = (issue) => {
    const order = issue.orders || {};
    const supplier = issue.suppliers || {};
    const driver = issue.drivers || {};

    const driverFullName = `${driver.first_name || ""} ${
      driver.last_name || ""
    }`.trim();

    const rawOrderStatus = order.current_status || issue.order_stage || "-";
    const formattedStatus = formatIssueStatus(issue.status || "open");

    return {
      issueId: issue.issue_reference || `ISS-${issue.issue_id}`,
      issueDbId: issue.issue_id,

      rawOrderStatus,

      orderId:
        order.order_reference ||
        issue.order_reference ||
        issue.order_id ||
        "-",

      orderType: order.order_type || issue.order_type || "-",

      issueType: formatText(issue.issue_type) || "-",

      supplier:
        supplier.company_name ||
        issue.supplier_name ||
        issue.supplier ||
        "Not assigned",

      driver:
        driverFullName ||
        issue.driver_name ||
        issue.driver ||
        "Not assigned",

      route:
        issue.route ||
        `${order.pickup_state || issue.pickup_state || "-"} → ${
          order.destination_state || issue.destination_state || "-"
        }`,

      orderStage: formatStatus(rawOrderStatus),

      priority: formatPriority(issue.priority || "Medium"),

      status: formattedStatus,

      reportedBy: issue.reported_by || "Operations Team",

      reported: formatDate(issue.created_at || issue.reported_at),

      updated: formatRelativeTime(issue.updated_at || issue.created_at),

      description:
        issue.description || issue.issue_details || "No issue details provided.",

      adminRemark:
        issue.admin_remark ||
        issue.admin_notes ||
        getAdminRemark(formattedStatus),
    };
  };

  // Default admin remark based on current review status
  const getAdminRemark = (status) => {
    if (status === "Sent to Admin") {
      return "Issue has been received by Admin and is waiting for review.";
    }

    if (status === "Admin Reviewing") {
      return "Admin is reviewing the issue and coordinating the next action.";
    }

    if (status === "Resolved") {
      return "Admin reviewed the issue and confirmed the resolution.";
    }

    return "Waiting for Admin review.";
  };

  // Timeline title changes depending on issue review progress
  const getTimelineReviewTitle = (status) => {
    if (status === "Resolved") {
      return "Admin Reviewed";
    }

    if (status === "Admin Reviewing") {
      return "Admin Reviewing";
    }

    return "Waiting for Admin Review";
  };

  // Timeline description changes depending on issue review progress
  const getTimelineReviewDescription = (status) => {
    if (status === "Resolved") {
      return "Admin reviewed this issue and confirmed the resolution.";
    }

    if (status === "Admin Reviewing") {
      return "Admin is currently reviewing this issue and coordinating the next action.";
    }

    return "Issue has been sent to Admin and is waiting for review.";
  };

  // Message shown inside the Admin Review section of the modal
  const getAdminReviewBoxMessage = (status) => {
    if (status === "Resolved") {
      return "Admin has reviewed and resolved this issue. Operations can still send a follow-up if the issue needs to be checked again.";
    }

    if (status === "Admin Reviewing") {
      return "Admin is currently reviewing this issue. Operations can send extra notes or clarification if required.";
    }

    return "Issue has been sent to Admin and is waiting for review. Operations can send additional details if needed.";
  };

  // Subtitle text for issue modal based on review status
  const getModalSubtitle = (status) => {
    if (status === "Resolved") {
      return "This issue has been reviewed by Admin. Operations can send a follow-up or reopen request if the issue is not fully solved.";
    }

    if (status === "Admin Reviewing") {
      return "Admin is reviewing this issue. Operations can send follow-up notes if required.";
    }

    return "Issue sent to Admin for review. Order status is not changed by this report.";
  };

  // Button text changes depending on whether issue is pending, reviewing, or resolved
  const getActionButtonText = (status) => {
    if (status === "Resolved") {
      return "Send Follow-up / Reopen Request";
    }

    if (status === "Admin Reviewing") {
      return "Send Follow-up to Admin";
    }

    return "Send Message to Admin";
  };

  // Placeholder message changes depending on issue review status
  const getFollowUpPlaceholder = (status) => {
    if (status === "Resolved") {
      return "Example: Admin reviewed this issue, but the document is still pending. Please check again and reopen if required.";
    }

    if (status === "Admin Reviewing") {
      return "Example: Expected arrival date is 16 May 2026. Please consider this while reviewing the delay issue.";
    }

    return "Example: Please review this issue urgently because it may affect the delivery schedule.";
  };

  // Saves operation follow-up messages to localStorage and links them to the selected issue
  const handleIssueAction = (issue) => {
    if (!issue) return;

    if (!followUpMessage.trim()) {
      alert("Please type a message before sending to Admin.");
      return;
    }

    const issueKey = getIssueKey(issue);

    const newMessage = {
      messageId: Date.now(),
      issueKey,
      orderId: issue.orderId,
      senderRole: "Operations",
      actionLabel: getActionButtonText(issue.status),
      message: followUpMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...issueMessages, newMessage];

    setIssueMessages(updatedMessages);
    localStorage.setItem(
      "operationIssueMessages",
      JSON.stringify(updatedMessages)
    );

    setFollowUpMessage("");

    if (issue.status === "Resolved") {
      alert(`Follow-up / reopen request sent to Admin for ${issue.orderId}.`);
      return;
    }

    if (issue.status === "Admin Reviewing") {
      alert(`Follow-up message sent to Admin for ${issue.orderId}.`);
      return;
    }

    alert(`Message sent to Admin for ${issue.orderId}.`);
  };

  // Opens issue detail modal and resets previous follow-up text
  const openIssueModal = (issue) => {
    setSelectedIssue(issue);
    setFollowUpMessage("");
  };

  // Closes issue detail modal and clears follow-up text
  const closeIssueModal = () => {
    setSelectedIssue(null);
    setFollowUpMessage("");
  };

  // Converts database text like driver_assigned into readable text like Driver Assigned
  const formatText = (value) => {
    if (!value) return "";

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Formats priority into High, Medium, or Low
  const formatPriority = (value) => {
    const priority = String(value || "").toLowerCase();

    if (priority === "high") return "High";
    if (priority === "low") return "Low";

    return "Medium";
  };

  // Converts database issue status into operational review status
  const formatIssueStatus = (value) => {
    const status = String(value || "").toLowerCase();

    if (status === "open") {
      return "Sent to Admin";
    }

    if (status === "escalated") {
      return "Admin Reviewing";
    }

    if (status === "resolved") {
      return "Resolved";
    }

    if (status === "sent_to_admin" || status === "sent to admin") {
      return "Sent to Admin";
    }

    if (
      status === "admin_reviewing" ||
      status === "admin reviewing" ||
      status === "reviewing"
    ) {
      return "Admin Reviewing";
    }

    return formatText(value);
  };

  // Converts order current_status into readable order stage
  const formatStatus = (value) => {
    if (!value || value === "-") return "-";

    const status = String(value).toLowerCase();

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

  // Formats full date for reported date
  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Converts updated date into relative time like "5 mins ago" or "2 days ago"
  const formatRelativeTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";

    return `${diffDays} days ago`;
  };

  // Applies selected tab filter and search filter to issue table
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchTab = tab === "All" || issue.status === tab;
      const searchValue = search.toLowerCase();

      const matchSearch =
        issue.orderId.toLowerCase().includes(searchValue) ||
        issue.issueType.toLowerCase().includes(searchValue) ||
        issue.supplier.toLowerCase().includes(searchValue);

      return matchTab && matchSearch;
    });
  }, [issues, tab, search]);

  // Priority badge UI
  const getPriorityBadge = (priority) => {
    if (priority === "High") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-[#DC2626]">
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
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-[#EA580C]">
        Medium
      </span>
    );
  };

  // Review status badge UI
  const getStatusBadge = (status) => {
    if (status === "Sent to Admin") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#1E40AF]">
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
    <div className="min-h-full w-full bg-[#EFF6FF] px-6 py-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Tab filters and search bar */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-3">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  tab === item
                    ? "bg-[#1E40AF] text-white"
                    : "bg-slate-100 text-[#1E293B] hover:bg-[#EFF6FF]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm lg:w-[330px]">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search order, supplier, issue..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-[#1E293B] outline-none"
            />
          </div>
        </div>

        {/* Main issue table */}
        <div className="mt-6 overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#EFF6FF] text-[#1E293B]">
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
                      No valid operational issues found.
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => (
                    <tr
                      key={issue.issueDbId || issue.issueId}
                      className="border-b border-slate-200 bg-white hover:bg-[#F8FAFC]"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#1E293B]">
                        {issue.orderId}
                        <p className="text-xs font-normal text-slate-500">
                          {issue.orderType}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                        {issue.issueType}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                        <div className="flex items-center gap-2">
                          <Building2 size={15} className="text-slate-400" />
                          {issue.supplier}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                        {issue.orderStage}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {getPriorityBadge(issue.priority)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {getStatusBadge(issue.status)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {issue.updated}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <button
                          onClick={() => openIssueModal(issue)}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-xs font-medium text-white hover:bg-[#1E3A8A]"
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
        </div>
      </div>

      {/* Issue detail modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#1E293B]">
                  {selectedIssue.orderId} — {selectedIssue.issueType}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {getModalSubtitle(selectedIssue.status)}
                </p>
              </div>

              <button
                onClick={closeIssueModal}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Basic issue/order summary cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <DetailCard label="Issue ID" value={selectedIssue.issueId} />
              <DetailCard label="Order ID" value={selectedIssue.orderId} />
              <DetailCard label="Supplier" value={selectedIssue.supplier} />
              <DetailCard label="Driver" value={selectedIssue.driver} />
              <DetailCard label="Route" value={selectedIssue.route} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-5">
                {/* Detailed issue information */}
                <div className="rounded-xl border border-slate-200 p-5">
                  <h3 className="mb-3 text-base font-semibold text-[#1E293B]">
                    Issue Details
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InfoItem
                      label="Priority"
                      value={getPriorityBadge(selectedIssue.priority)}
                    />
                    <InfoItem
                      label="Review Status"
                      value={getStatusBadge(selectedIssue.status)}
                    />
                    <InfoItem
                      label="Order Stage"
                      value={selectedIssue.orderStage}
                    />
                  </div>

                  <div className="mt-4 rounded-lg bg-[#F8FAFC] p-4">
                    <p className="text-sm leading-6 text-slate-600">
                      {selectedIssue.description}
                    </p>
                  </div>
                </div>

                {/* Admin review status box */}
                <div className="rounded-xl border border-slate-200 p-5">
                  <h3 className="mb-3 text-base font-semibold text-[#1E293B]">
                    Admin Review
                  </h3>

                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={20}
                        className="mt-0.5 text-[#1E40AF]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          Admin Team
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {getAdminReviewBoxMessage(selectedIssue.status)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations follow-up message area */}
                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1E293B]">
                        Add Follow-up Message
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Send extra notes, clarification, or a reopen request to
                        Admin.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#1E40AF]">
                      Operations Note
                    </span>
                  </div>

                  <textarea
                    value={followUpMessage}
                    onChange={(event) =>
                      setFollowUpMessage(event.target.value)
                    }
                    rows="4"
                    placeholder={getFollowUpPlaceholder(selectedIssue.status)}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#1E293B] outline-none focus:border-[#1E40AF]"
                  />

                  <div className="mt-3 flex flex-wrap justify-end gap-3">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-[#1E40AF] px-4 py-2 text-sm font-medium text-[#1E40AF] hover:bg-[#EFF6FF]">
                      <Truck size={16} />
                      View Tracking
                    </button>

                    <button
                      onClick={() => handleIssueAction(selectedIssue)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E3A8A]"
                    >
                      <Send size={16} />
                      {getActionButtonText(selectedIssue.status)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Issue timeline showing sent/review/follow-up activity */}
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
                      selectedIssue.status === "Resolved" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )
                    }
                    title={getTimelineReviewTitle(selectedIssue.status)}
                    description={getTimelineReviewDescription(
                      selectedIssue.status
                    )}
                    time={selectedIssue.updated}
                  />

                  {getMessagesForIssue(selectedIssue).map((message) => (
                    <TimelineItem
                      key={message.messageId}
                      icon={<Send size={14} />}
                      title={message.actionLabel}
                      description={message.message}
                      time={formatRelativeTime(message.createdAt)}
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-[#F8FAFC] p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarDays size={15} />
                    Reported on {selectedIssue.reported}
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

// Small reusable card for showing issue/order details in modal
function DetailCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#EFF6FF] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1E293B]">{value}</p>
    </div>
  );
}

// Reusable label-value item used inside issue modal
function InfoItem({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <div className="text-sm font-medium text-[#1E293B]">{value}</div>
    </div>
  );
}

// Reusable timeline item for issue sent, admin review, and follow-up messages
function TimelineItem({ icon, title, description, time }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1E40AF]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1E293B]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">{time}</p>
      </div>
    </div>
  );
}

export default Issues;