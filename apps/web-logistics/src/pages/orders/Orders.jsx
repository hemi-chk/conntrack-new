import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    FiFilter,
    FiLoader,
    FiSearch,
} from "react-icons/fi";

import {
    Eye,
    FileText,
    MapPin,
    Package,
    Tag,
} from "lucide-react";

// Shadcn components
import {
    Badge,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/ui";

import api from "../../config/api";

// ---------------- STATUS BADGE ----------------
const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "created";
    const displayName = s.replace(/_/g, " ");

    let badgeStyle =
        "bg-slate-100 text-slate-700 border-slate-200";

    let dotColor = "bg-slate-400";

    if (s === "in_transit" || s === "in transit") {
        badgeStyle =
            "bg-blue-50 text-blue-700 border-blue-200";
        dotColor = "bg-blue-500";
    } else if (
        s === "completed" ||
        s === "delivered"
    ) {
        badgeStyle =
            "bg-emerald-50 text-emerald-700 border-emerald-200";
        dotColor = "bg-emerald-500";
    } else if (
        s === "at_port" ||
        s === "pending"
    ) {
        badgeStyle =
            "bg-amber-50 text-amber-700 border-amber-200";
        dotColor = "bg-amber-500";
    }

    return (
        <Badge
            className={`
                inline-flex items-center
                font-bold
                border
                px-3 py-1
                rounded-full
                capitalize
                text-[11px]
                shadow-none
                ${badgeStyle}
            `}
        >
            <span
                className={`
                    w-1.5 h-1.5 rounded-full mr-2
                    ${dotColor}
                `}
            />
            {displayName}
        </Badge>
    );
};

// =========================================================
// LOGISTICS ORDERS PAGE
// ---------------------------------------------------------
// This page lists import/export orders for the logistics interface. It lets the
// user search, filter, and inspect active shipment records without mixing in
// other app domains.
// =========================================================
export default function OrdersPage({ title, type }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // ---------------- FETCH ORDERS ----------------
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await api.get(
                    `/logistics/orders?type=${encodeURIComponent(type || "")}`
                );

                const responseOrders = Array.isArray(res.data)
                    ? res.data
                    : res.data?.orders;

                if (!Array.isArray(responseOrders)) {
                    throw new Error("Invalid orders response from the server.");
                }

                setOrders(responseOrders);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setOrders([]);
                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to load orders."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [type]);

    // ---------------- FILTER ----------------
    const filtered = orders.filter((o) => {
        const ref = o.order_reference || "";
        const status = o.current_status || "created";

        return (
            ref
                .toLowerCase()
                .includes(search.toLowerCase()) &&
            (statusFilter === "All" ||
                status === statusFilter)
        );
    });

    return (
        <div className="min-h-screen bg-slate-50/60 p-6 md:p-8 space-y-7 dark:bg-[#021024]">

            {/* ================= HEADER ================= */}
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/90">

                {/* Subtle decorative elements */}
                <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-blue-50 blur-3xl pointer-events-none dark:bg-blue-950/40" />

                <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-50 blur-3xl pointer-events-none dark:bg-indigo-950/30" />

                <div className="relative z-10 p-6 md:p-8">

                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                        {/* ================= TITLE ================= */}
                        <div>

                            <div className="mb-3 flex items-center gap-2">

                                <span className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/50">
                                    <Package
                                        size={17}
                                        className="text-blue-600 dark:text-blue-400"
                                    />
                                </span>

                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                                    Logistics Management
                                </span>

                            </div>

                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl dark:text-slate-50">
                                {title || "Logistics Orders"}
                            </h1>

                            <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                                View, monitor and manage your
                                active logistics orders and
                                shipment records.
                            </p>

                        </div>

                        {/* ================= RECORD COUNT ================= */}
                        <div className="min-w-[190px] rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">

                            <div className="flex items-center gap-3">

                                <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/60">
                                    <Package
                                        size={20}
                                        className="text-blue-600 dark:text-blue-400"
                                    />
                                </div>

                                <div>

                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                                        Total Records
                                    </p>

                                    <p className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
                                        {orders.length}
                                    </p>

                                </div>

                            </div>

                            {type && (
                                <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">

                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                        {type} Orders
                                    </span>

                                </div>
                            )}

                        </div>

                    </div>

                </div>
            </section>

            {/* ================= FILTER BAR ================= */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* ================= SEARCH ================= */}
                    <div className="relative w-full lg:max-w-md">

                        <FiSearch
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                        />

                        <input
                            type="text"
                            placeholder="Search by order reference or ID..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            className="
                                w-full
                                rounded-xl
                                border border-slate-200
                                bg-slate-50
                                py-2.5
                                pl-10
                                pr-4
                                text-xs
                                font-semibold
                                text-slate-900
                                placeholder:text-slate-400
                                outline-none
                                transition-all
                                focus:border-blue-300
                                focus:bg-white
                                focus:ring-2
                                focus:ring-blue-500/10
                            "
                        />

                    </div>

                    {/* ================= CONTROLS ================= */}
                    <div className="flex flex-wrap items-center gap-3">

                        {/* Status Filter */}
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">

                            <FiFilter
                                size={14}
                                className="text-slate-400"
                            />

                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                Status
                            </span>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="cursor-pointer bg-transparent text-xs font-bold text-slate-800 outline-none"
                            >

                                <option value="All">
                                    All Statuses
                                </option>

                                <option value="in_transit">
                                    In Transit
                                </option>

                                <option value="at_port">
                                    At Port
                                </option>

                                <option value="completed">
                                    Completed
                                </option>

                                <option value="pending">
                                    Pending
                                </option>

                            </select>

                        </div>

                        {/* Result Count */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">

                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Showing{" "}
                            </span>

                            <span className="text-xs font-extrabold text-slate-900">
                                {filtered.length}
                            </span>

                        </div>

                    </div>

                </div>

            </section>

            {/* ================= TABLE ================= */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

                {/* ================= TABLE HEADER ================= */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                    <div>

                        <h2 className="text-sm font-extrabold text-slate-900">
                            Order Records
                        </h2>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                            Current logistics shipment overview
                        </p>

                    </div>

                    <div className="hidden items-center gap-2 sm:flex">

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Live Records
                        </span>

                    </div>

                </div>

                {/* ================= LOADING ================= */}
                {loading ? (

                    <div className="flex flex-col items-center justify-center gap-3 p-16">

                        <div className="rounded-2xl bg-blue-50 p-4">

                            <FiLoader
                                className="animate-spin text-blue-600"
                                size={25}
                            />

                        </div>

                        <div className="text-center">

                            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                Loading order records
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                                Please wait while the latest
                                orders are retrieved.
                            </p>

                        </div>

                    </div>

                ) : error ? (

                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <div className="rounded-2xl bg-red-50 p-4">
                            <Package size={28} className="text-red-500" />
                        </div>
                        <p className="mt-4 text-sm font-extrabold text-slate-800">
                            Unable to load orders
                        </p>
                        <p className="mt-1 max-w-sm text-xs text-red-500">
                            {error}
                        </p>
                    </div>

                ) : filtered.length === 0 ? (

                    /* ================= EMPTY STATE ================= */
                    <div className="flex flex-col items-center justify-center p-16 text-center">

                        <div className="rounded-2xl bg-slate-100 p-4">

                            <Package
                                size={28}
                                className="text-slate-400"
                            />

                        </div>

                        <p className="mt-4 text-sm font-extrabold text-slate-800">
                            No orders found
                        </p>

                        <p className="mt-1 max-w-sm text-xs text-slate-400">
                            No orders match your current
                            search or status filter.
                        </p>

                    </div>

                ) : (

                    /* ================= TABLE DATA ================= */
                    <div className="overflow-x-auto">

                        <Table className="w-full">

                            <TableHeader>

                                <TableRow className="border-b border-slate-200 bg-slate-50/70 hover:bg-slate-50/70">

                                    <TableHead className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                                        Order
                                    </TableHead>

                                    <TableHead className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                                        Route
                                    </TableHead>

                                    <TableHead className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                                        Status
                                    </TableHead>

                                    <TableHead className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                                        Actions
                                    </TableHead>

                                </TableRow>

                            </TableHeader>

                            <TableBody className="divide-y divide-slate-100">

                                {filtered.map((order) => (

                                    <TableRow
                                        key={order.order_id}
                                        className="group transition-colors hover:bg-slate-50/70"
                                    >

                                        {/* ================= ORDER ================= */}
                                        <TableCell className="px-6 py-5">

                                            <div className="flex items-center gap-3">

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                                    <Package size={17} />

                                                </div>

                                                <div>

                                                    <p className="text-sm font-extrabold text-slate-900">
                                                        {order.order_reference}
                                                    </p>

                                                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                                        ID #{order.order_id}
                                                    </p>

                                                </div>

                                            </div>

                                        </TableCell>

                                        {/* ================= ROUTE ================= */}
                                        <TableCell className="px-6 py-5">

                                            <div className="flex items-center gap-2.5">

                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">

                                                    <MapPin
                                                        size={14}
                                                        className="text-slate-500"
                                                    />

                                                </div>

                                                <div className="max-w-sm">

                                                    <p className="text-xs font-bold leading-relaxed text-slate-800">

                                                        {order.route &&
                                                        !/^(null|undefined)\s*→\s*(null|undefined)$/i.test(order.route)
                                                            ? order.route
                                                            :
                                                            `${order.pickup_location ||
                                                                order.pickup_state ||
                                                                order.pickup_district ||
                                                                "N/A"} → ${
                                                                order.destination_location ||
                                                                order.destination_state ||
                                                                order.destination_district ||
                                                                "N/A"
                                                            }`}

                                                    </p>

                                                </div>

                                            </div>

                                        </TableCell>

                                        {/* ================= STATUS ================= */}
                                        <TableCell className="px-6 py-5">

                                            {getStatusBadge(
                                                order.current_status
                                            )}

                                        </TableCell>

                                        {/* ================= ACTIONS ================= */}
                                        <TableCell className="px-6 py-5">

                                            <div className="flex items-center justify-end gap-2">

                                                {/* View */}
                                                <Link
                                                    to={`/orders/${order.order_id}`}
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        gap-1.5
                                                        rounded-xl
                                                        border
                                                        border-slate-200
                                                        bg-white
                                                        px-3
                                                        py-2
                                                        text-[11px]
                                                        font-bold
                                                        text-slate-700
                                                        shadow-sm
                                                        transition-all
                                                        hover:border-slate-300
                                                        hover:bg-slate-900
                                                        hover:text-white
                                                    "
                                                >

                                                    <Eye size={13} />

                                                    View

                                                </Link>

                                                {/* Bids */}
                                                <Link
                                                    to={`/orders/${order.order_id}/bids`}
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        gap-1.5
                                                        rounded-xl
                                                        border
                                                        border-blue-200
                                                        bg-blue-50
                                                        px-3
                                                        py-2
                                                        text-[11px]
                                                        font-bold
                                                        text-blue-700
                                                        transition-all
                                                        hover:bg-blue-600
                                                        hover:text-white
                                                    "
                                                >

                                                    <Tag size={13} />

                                                    Bids

                                                </Link>

                                                {/* Documents */}
                                                <Link
                                                    to={`/orders/${order.order_id}/documents`}
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        gap-1.5
                                                        rounded-xl
                                                        border
                                                        border-slate-200
                                                        bg-slate-50
                                                        px-3
                                                        py-2
                                                        text-[11px]
                                                        font-bold
                                                        text-slate-700
                                                        transition-all
                                                        hover:bg-slate-200
                                                    "
                                                >

                                                    <FileText size={13} />

                                                    Docs

                                                </Link>

                                            </div>

                                        </TableCell>

                                    </TableRow>

                                ))}

                            </TableBody>

                        </Table>

                    </div>

                )}

            </section>

        </div>
    );
}