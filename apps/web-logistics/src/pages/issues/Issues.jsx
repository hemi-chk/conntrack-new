import {
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Filter,
    Loader2,
    PackageCheck,
    Plus,
    RefreshCw,
    Search,
    Send,
    ShieldAlert,
    Truck,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/ui";
import api from "../../config/api";

// =========================================================
// LOGISTICS ISSUES PAGE
// ---------------------------------------------------------
// This page is the logistics escalation workflow. It allows users to report an
// operational issue and review previous issue records related to shipment activity.

// Accepts legacy low/medium/high values too, for issues created before the
// 3-tier scale, and normalizes everything to minor/major/critical.
const normalizePriority = (priority) => {
    const p = priority?.toLowerCase();
    if (["critical", "high", "urgent"].includes(p)) return "critical";
    if (["major", "medium"].includes(p)) return "major";
    return "minor";
};

const Issues = () => {
    const [issues, setIssues] = useState([]);
    const [ordersList, setOrdersList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [statusMessage, setStatusMessage] = useState({
        type: "",
        text: "",
    });

    const [activeTab, setActiveTab] = useState("list");

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    const [formData, setFormData] = useState({
        order_id: "",
        supplier_id: "",
        driver_id: "",
        issue_type: "Traffic/Route Delay",
        priority: "major",
        description: "",
    });

    useEffect(() => {
        fetchIssues();
        fetchOrders();
    }, []);

    // ---------------------------------------------------------
    // API
    // ---------------------------------------------------------

    const fetchIssues = async () => {
        setIsLoading(true);

        try {
            const response = await api.get("/logistics/issues");

            if (response.data && response.data.success) {
                setIssues(response.data.data || []);
            } else if (Array.isArray(response.data)) {
                setIssues(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch issues history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await api.get("/logistics/orders");

            let fetchedOrders = [];

            if (response.data && response.data.orders) {
                fetchedOrders = response.data.orders;
            } else if (Array.isArray(response.data)) {
                fetchedOrders = response.data;
            }

            setOrdersList(fetchedOrders);
        } catch (error) {
            console.error("Failed to load orders for selection:", error);
        }
    };

    // ---------------------------------------------------------
    // Form handlers
    // ---------------------------------------------------------

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectOrder = (e) => {
        const selectedId = e.target.value;

        const selectedOrder = ordersList.find(
            (order) => String(order.order_id) === String(selectedId)
        );

        setFormData((prev) => ({
            ...prev,
            order_id: selectedId,
            supplier_id:
                selectedOrder?.supplier_id ||
                prev.supplier_id ||
                "",
            driver_id:
                selectedOrder?.driver_id ||
                prev.driver_id ||
                "",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        setStatusMessage({
            type: "",
            text: "",
        });

        try {
            const storedUser = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            // reported_by sent here is advisory only - the backend always
            // derives it from the verified token, never trusts this value.
            const reportedByUuid =
                storedUser?.id ||
                storedUser?.uuid ||
                formData.reported_by ||
                null;

            const payload = {
                ...formData,
                reported_by: reportedByUuid,
            };

            const response = await api.post(
                "/logistics/issues",
                payload
            );

            if (response.data && response.data.success) {
                setStatusMessage({
                    type: "success",
                    text: "Issue successfully submitted to Admin for review.",
                });

                setFormData({
                    order_id: "",
                    supplier_id: "",
                    driver_id: "",
                    issue_type: "Traffic/Route Delay",
                    priority: "major",
                    description: "",
                });

                fetchIssues();

                setTimeout(() => {
                    setActiveTab("list");
                }, 1600);
            } else {
                throw new Error(
                    response.data?.error ||
                        "Failed to report issue"
                );
            }
        } catch (error) {
            console.error("Submission Error:", error);

            const errorMessage =
                error.response?.data?.error ||
                error.message ||
                "Failed to submit issue to Admin.";

            setStatusMessage({
                type: "error",
                text: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---------------------------------------------------------
    // Filtering
    // ---------------------------------------------------------

    const filteredIssues = issues.filter((issue) => {
        const query = searchQuery.toLowerCase();

        const matchesSearch =
            (issue.issue_reference &&
                issue.issue_reference
                    .toLowerCase()
                    .includes(query)) ||
            (issue.issue_type &&
                issue.issue_type
                    .toLowerCase()
                    .includes(query)) ||
            (issue.description &&
                issue.description
                    .toLowerCase()
                    .includes(query)) ||
            (issue.order_id &&
                String(issue.order_id).includes(searchQuery)) ||
            (issue.orders?.order_reference &&
                issue.orders.order_reference
                    .toLowerCase()
                    .includes(query));

        const matchesStatus =
            statusFilter === "all" ||
            issue.status === statusFilter;

        const matchesPriority =
            priorityFilter === "all" ||
            normalizePriority(issue.priority) === priorityFilter;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority
        );
    });

    // ---------------------------------------------------------
    // Statistics
    // ---------------------------------------------------------

    const totalCount = issues.length;

    const openCount = issues.filter(
        (issue) =>
            issue.status === "open" || !issue.status
    ).length;

    const escalatedCount = issues.filter(
        (issue) => issue.status === "escalated"
    ).length;

    const resolvedCount = issues.filter(
        (issue) => issue.status === "resolved"
    ).length;

    // ---------------------------------------------------------
    // Badges
    // ---------------------------------------------------------

    const getPriorityBadge = (priority) => {
        switch (normalizePriority(priority)) {
            case "critical":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                        Critical
                    </span>
                );

            case "major":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        Major
                    </span>
                );

            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Minor
                    </span>
                );
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "resolved":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        <CheckCircle2 size={12} />
                        Solved
                    </span>
                );

            case "escalated":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                        <ShieldAlert size={12} />
                        Reviewing
                    </span>
                );

            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        <Clock size={12} />
                        Not Reviewed
                    </span>
                );
        }
    };

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* ------------------------------------------------
                    PAGE HEADER
                ------------------------------------------------ */}

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-600">
                            <ShieldAlert size={14} />
                            LOGISTICS CONTROL
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Issues
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Monitor operational incidents and report issues to Admin.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={() => setActiveTab("list")}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                                activeTab === "list"
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <FileText size={15} />
                            Issue Register
                        </button>

                        <button
                            onClick={() => {
                                setStatusMessage({
                                    type: "",
                                    text: "",
                                });
                                setActiveTab("report");
                            }}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                                activeTab === "report"
                                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                    : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                            }`}
                        >
                            <Plus size={15} />
                            Report Issue
                        </button>

                    </div>
                </div>

                {/* ------------------------------------------------
                    STAT CARDS
                ------------------------------------------------ */}

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Total Issues
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {totalCount}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                                <AlertOctagon size={19} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Not Reviewed
                                </p>

                                <p className="mt-2 text-2xl font-bold text-amber-600">
                                    {openCount}
                                </p>
                            </div>

                            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                                <Clock size={19} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Reviewing
                                </p>

                                <p className="mt-2 text-2xl font-bold text-indigo-600">
                                    {escalatedCount}
                                </p>
                            </div>

                            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                                <ShieldAlert size={19} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Solved
                                </p>

                                <p className="mt-2 text-2xl font-bold text-emerald-600">
                                    {resolvedCount}
                                </p>
                            </div>

                            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                                <CheckCircle2 size={19} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* =================================================
                    ISSUE REGISTER
                ================================================= */}

                {activeTab === "list" && (
                    <div className="space-y-4">

                        {/* Filters */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                                <div className="relative w-full lg:max-w-md">

                                    <Search
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Search issues, orders or descriptions..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    />

                                </div>

                                <div className="flex flex-wrap items-center gap-2">

                                    <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                                        <Filter
                                            size={14}
                                            className="text-slate-400"
                                        />

                                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Status
                                        </span>

                                        <select
                                            value={statusFilter}
                                            onChange={(e) =>
                                                setStatusFilter(e.target.value)
                                            }
                                            className="bg-transparent text-xs font-semibold text-slate-700 outline-none"
                                        >
                                            <option value="all">
                                                All
                                            </option>
                                            <option value="open">
                                                Not Reviewed
                                            </option>
                                            <option value="escalated">
                                                Reviewing
                                            </option>
                                            <option value="resolved">
                                                Solved
                                            </option>
                                        </select>
                                    </div>

                                    <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">

                                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Priority
                                        </span>

                                        <select
                                            value={priorityFilter}
                                            onChange={(e) =>
                                                setPriorityFilter(
                                                    e.target.value
                                                )
                                            }
                                            className="bg-transparent text-xs font-semibold text-slate-700 outline-none"
                                        >
                                            <option value="all">
                                                All
                                            </option>
                                            <option value="critical">
                                                Critical
                                            </option>
                                            <option value="major">
                                                Major
                                            </option>
                                            <option value="minor">
                                                Minor
                                            </option>
                                        </select>

                                    </div>

                                    <button
                                        onClick={fetchIssues}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                        title="Refresh"
                                    >
                                        <RefreshCw
                                            size={15}
                                            className={
                                                isLoading
                                                    ? "animate-spin text-blue-600"
                                                    : ""
                                            }
                                        />
                                    </button>

                                </div>
                            </div>
                        </div>

                        {/* Table */}

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                            {isLoading ? (
                                <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
                                    <Loader2
                                        size={28}
                                        className="animate-spin text-blue-600"
                                    />

                                    <p className="text-xs font-medium text-slate-500">
                                        Loading issues...
                                    </p>
                                </div>
                            ) : filteredIssues.length === 0 ? (
                                <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

                                    <div className="mb-4 rounded-2xl bg-slate-100 p-4">
                                        <AlertTriangle
                                            size={28}
                                            className="text-slate-400"
                                        />
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-800">
                                        No issues found
                                    </h3>

                                    <p className="mt-1 max-w-sm text-xs text-slate-500">
                                        No incidents match the current
                                        search and filter criteria.
                                    </p>

                                </div>
                            ) : (
                                <div className="overflow-x-auto">

                                    <table className="w-full min-w-[1100px]">

                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">

                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Issue
                                                </th>

                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Order
                                                </th>

                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Category
                                                </th>

                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Stakeholders
                                                </th>

                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Priority
                                                </th>

                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Status
                                                </th>

                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Description
                                                </th>

                                                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    Date
                                                </th>

                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">

                                            {filteredIssues.map((issue) => (

                                                <tr
                                                    key={issue.issue_id}
                                                    className="transition hover:bg-slate-50/70"
                                                >

                                                    <td className="px-5 py-4">
                                                        <div className="font-mono text-xs font-bold text-blue-700">
                                                            {issue.issue_reference ||
                                                                `#ISS-${issue.issue_id}`}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div className="text-xs font-semibold text-slate-900">
                                                            {issue.orders
                                                                ?.order_reference ||
                                                                (issue.order_id
                                                                    ? `ORD #${issue.order_id}`
                                                                    : "Unlinked")}
                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div className="max-w-[180px] text-xs font-semibold text-slate-800">
                                                            {issue.issue_type ||
                                                                "General Incident"}
                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div className="space-y-1.5">

                                                            {issue.suppliers
                                                                ?.company_name && (
                                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                                                                    <Building2
                                                                        size={13}
                                                                        className="text-slate-400"
                                                                    />
                                                                    {issue
                                                                        .suppliers
                                                                        .company_name}
                                                                </div>
                                                            )}

                                                            {issue.drivers && (
                                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                                                                    <Truck
                                                                        size={13}
                                                                        className="text-slate-400"
                                                                    />
                                                                    {
                                                                        issue
                                                                            .drivers
                                                                            .first_name
                                                                    }{" "}
                                                                    {
                                                                        issue
                                                                            .drivers
                                                                            .last_name
                                                                    }
                                                                </div>
                                                            )}

                                                            {!issue.suppliers
                                                                ?.company_name &&
                                                                !issue.drivers && (
                                                                    <span className="text-[11px] text-slate-400">
                                                                        {issue.supplier_id
                                                                            ? `Sup #${issue.supplier_id}`
                                                                            : ""}{" "}
                                                                        {issue.driver_id
                                                                            ? `Drv #${issue.driver_id}`
                                                                            : ""}{" "}
                                                                        {!issue.supplier_id &&
                                                                        !issue.driver_id
                                                                            ? "N/A"
                                                                            : ""}
                                                                    </span>
                                                                )}

                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {getPriorityBadge(
                                                            issue.priority
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {getStatusBadge(
                                                            issue.status
                                                        )}
                                                    </td>

                                                    <td className="max-w-[260px] px-5 py-4">

                                                        <p
                                                            title={
                                                                issue.description
                                                            }
                                                            className="truncate text-xs text-slate-500"
                                                        >
                                                            {issue.description ||
                                                                "No description provided"}
                                                        </p>

                                                    </td>

                                                    <td className="px-5 py-4 text-right">

                                                        <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500">

                                                            <Calendar size={12} />

                                                            {issue.created_at
                                                                ? new Date(
                                                                      issue.created_at
                                                                  ).toLocaleDateString(
                                                                      "en-US",
                                                                      {
                                                                          month: "short",
                                                                          day: "numeric",
                                                                          year: "numeric",
                                                                      }
                                                                  )
                                                                : "Recently"}

                                                        </div>

                                                    </td>

                                                </tr>

                                            ))}

                                        </tbody>

                                    </table>

                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* =================================================
                    REPORT ISSUE
                ================================================= */}

                {activeTab === "report" && (

                    <div className="mx-auto max-w-4xl">

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                            {/* Form header */}

                            <div className="border-b border-slate-200 px-6 py-6 md:px-8">

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-600">
                                            <Plus size={15} />
                                            NEW INCIDENT
                                        </div>

                                        <h2 className="text-xl font-bold text-slate-900">
                                            Report Logistics Issue
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Submit an operational incident for
                                            Admin review and action.
                                        </p>

                                    </div>

                                    <span className="hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 sm:block">
                                        Logistics Handler
                                    </span>

                                </div>

                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-8 p-6 md:p-8"
                            >

                                {/* Message */}

                                {statusMessage.text && (
                                    <div
                                        className={`flex items-start gap-3 rounded-xl border p-4 ${
                                            statusMessage.type === "success"
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                : "border-red-200 bg-red-50 text-red-800"
                                        }`}
                                    >
                                        {statusMessage.type === "success" ? (
                                            <CheckCircle2
                                                size={18}
                                                className="mt-0.5 shrink-0 text-emerald-600"
                                            />
                                        ) : (
                                            <XCircle
                                                size={18}
                                                className="mt-0.5 shrink-0 text-red-600"
                                            />
                                        )}

                                        <span className="text-xs font-semibold leading-relaxed">
                                            {statusMessage.text}
                                        </span>
                                    </div>
                                )}

                                {/* Step 1 */}

                                <section>

                                    <div className="mb-4 flex items-center gap-3">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                            <PackageCheck size={16} />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Shipment Information
                                            </h3>

                                            <p className="text-[11px] text-slate-500">
                                                Connect the issue to an active order.
                                            </p>
                                        </div>

                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">

                                        <div>
                                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                                                Active Order
                                            </label>

                                            <select
                                                value={formData.order_id}
                                                onChange={handleSelectOrder}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="">
                                                    Select existing order
                                                </option>

                                                {ordersList.map((ord) => (
                                                    <option
                                                        key={ord.order_id}
                                                        value={ord.order_id}
                                                    >
                                                        Order #{ord.order_id} (
                                                        {ord.order_reference ||
                                                            "No Ref"}
                                                        ) -{" "}
                                                        {ord.pickup_location ||
                                                            "N/A"}{" "}
                                                        →{" "}
                                                        {ord.destination_location ||
                                                            "N/A"}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                                                Order ID / Reference
                                            </label>

                                            <input
                                                type="text"
                                                name="order_id"
                                                value={formData.order_id}
                                                placeholder="e.g. 23 or ORD-0023"
                                                onChange={handleChange}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                    </div>

                                </section>

                                {/* Step 2 */}

                                <section className="border-t border-slate-100 pt-7">

                                    <div className="mb-4 flex items-center gap-3">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                            <Building2 size={16} />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Incident Details
                                            </h3>

                                            <p className="text-[11px] text-slate-500">
                                                Identify the type and affected stakeholders.
                                            </p>
                                        </div>

                                    </div>

                                    <div className="grid gap-5 md:grid-cols-3">

                                        <div>
                                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                                                Issue Category
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                name="issue_type"
                                                value={formData.issue_type}
                                                onChange={handleChange}
                                                required
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="Traffic/Route Delay">
                                                    Traffic / Route Delay
                                                </option>

                                                <option value="Documentation Issue">
                                                    Documentation Issue
                                                </option>

                                                <option value="Cargo Damage">
                                                    Cargo Damage
                                                </option>

                                                <option value="Vehicle Breakdown">
                                                    Vehicle Breakdown
                                                </option>

                                                <option value="Customs Hold">
                                                    Customs Hold
                                                </option>

                                                <option value="Other">
                                                    Other Issue
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                                                Supplier ID
                                            </label>

                                            <input
                                                type="number"
                                                name="supplier_id"
                                                value={formData.supplier_id}
                                                placeholder="Optional"
                                                onChange={handleChange}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                                                Driver ID
                                            </label>

                                            <input
                                                type="number"
                                                name="driver_id"
                                                value={formData.driver_id}
                                                placeholder="Optional"
                                                onChange={handleChange}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                    </div>

                                </section>

                                {/* Step 3 */}

                                <section className="border-t border-slate-100 pt-7">

                                    <div className="mb-4 flex items-center gap-3">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                            <AlertTriangle size={16} />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Priority Level
                                            </h3>

                                            <p className="text-[11px] text-slate-500">
                                                Select the severity of this incident.
                                            </p>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-3 gap-3">

                                        {[
                                            {
                                                id: "minor",
                                                label: "Minor",
                                            },
                                            {
                                                id: "major",
                                                label: "Major",
                                            },
                                            {
                                                id: "critical",
                                                label: "Critical",
                                            },
                                        ].map((item) => (

                                            <label
                                                key={item.id}
                                                className="cursor-pointer"
                                            >

                                                <input
                                                    type="radio"
                                                    name="priority"
                                                    value={item.id}
                                                    checked={
                                                        formData.priority ===
                                                        item.id
                                                    }
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />

                                                <div
                                                    className={`rounded-xl border px-4 py-3 text-center text-xs font-bold transition ${
                                                        formData.priority ===
                                                        item.id
                                                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {item.label}
                                                </div>

                                            </label>

                                        ))}

                                    </div>

                                </section>

                                {/* Step 4 */}

                                <section className="border-t border-slate-100 pt-7">

                                    <div className="mb-4">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                <FileText size={16} />
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Incident Description
                                                </h3>

                                                <p className="text-[11px] text-slate-500">
                                                    Describe what happened and what action is required.
                                                </p>
                                            </div>

                                        </div>

                                    </div>

                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={5}
                                        required
                                        placeholder="Include the location, impact on schedule, current situation and required intervention..."
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    />

                                </section>

                                {/* Actions */}

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-end">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveTab("list")
                                        }
                                        disabled={isSubmitting}
                                        className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-11 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2
                                                    size={15}
                                                    className="mr-2 animate-spin"
                                                />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send
                                                    size={15}
                                                    className="mr-2"
                                                />
                                                Submit Issue
                                                <ArrowRight
                                                    size={14}
                                                    className="ml-1"
                                                />
                                            </>
                                        )}
                                    </Button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default Issues;