import {
    Activity,
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock3,
    Loader2,
    Package,
    RefreshCcw,
    Truck,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Badge,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/ui";

import api from "../../config/api";

/* =========================================================
   LOGISTICS DASHBOARD
   ---------------------------------------------------------
   This page summarizes the active state of the logistics operation.
   It combines counts, status insights, and recent activity so the user
   can understand workload, shipment progress, and follow-up needs at a glance.
========================================================= */

/* =========================================================
   STATUS CONFIGURATION
========================================================= */

const STATUS_CONFIG = {
    completed: {
        dot: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Completed",
    },

    in_transit: {
        dot: "bg-blue-500",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        label: "In Transit",
    },

    at_port: {
        dot: "bg-amber-500",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        label: "At Port",
    },

    pending: {
        dot: "bg-slate-400",
        badge: "bg-slate-50 text-slate-600 border-slate-200",
        label: "Pending",
    },
};

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
    const key = status?.toLowerCase() || "pending";

    const cfg =
        STATUS_CONFIG[key] || STATUS_CONFIG.pending;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
            />

            {cfg.label}
        </span>
    );
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
    const navigate = useNavigate();

    const [data, setData] = useState({
        importOrdersCount: 0,
        exportOrdersCount: 0,
        recentActivity: [],
        stats: {
            inTransitCount: 0,
            completedOrders: 0,
        },
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* =====================================================
       LOAD DASHBOARD DATA
    ===================================================== */

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(
                "/logistics/dashboard-summary"
            );

            const result = response.data;

            setData({
                importOrdersCount:
                    result?.importOrdersCount ?? 0,

                exportOrdersCount:
                    result?.exportOrdersCount ?? 0,

                recentActivity:
                    result?.recentActivity || [],

                stats: {
                    inTransitCount:
                        result?.stats?.inTransitCount ?? 0,

                    completedOrders:
                        result?.stats?.completedOrders ?? 0,
                },
            });
        } catch (err) {
            console.error(
                "Dashboard Load Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to connect to the logistics server."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    /* =====================================================
       DATE
    ===================================================== */

    const today = new Date().toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );

    /* =====================================================
       METRIC CARDS
    ===================================================== */

    const totalActiveOrders =
        (data.importOrdersCount || 0) +
        (data.exportOrdersCount || 0);

    const attentionItems = (data.recentActivity || []).filter(
        (order) => {
            const status = (order.current_status || "").toLowerCase();
            return ["pending", "created", "at_port", "in_transit"].includes(status);
        }
    );

    const needsAttentionCount = attentionItems.length;

    const cards = [
        {
            label: "Active Orders",
            value: totalActiveOrders,
            description: "Open logistics movements",
            icon: Activity,
            color: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-100",
        },

        {
            label: "Import Orders",
            value: data.importOrdersCount,
            description: "Inbound shipments",
            icon: Package,
            color: "text-indigo-700",
            bg: "bg-indigo-50",
            border: "border-indigo-100",
        },

        {
            label: "Export Orders",
            value: data.exportOrdersCount,
            description: "Outbound shipments",
            icon: Truck,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
        },

        {
            label: "In Transit",
            value: data.stats.inTransitCount,
            description: "Currently moving",
            icon: ArrowUpRight,
            color: "text-amber-700",
            bg: "bg-amber-50",
            border: "border-amber-100",
        },

        {
            label: "Completed",
            value: data.stats.completedOrders,
            description: "Successfully delivered",
            icon: CheckCircle2,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
        },

        {
            label: "Needs Attention",
            value: needsAttentionCount,
            description: "Pending / action required",
            icon: AlertTriangle,
            color: "text-rose-700",
            bg: "bg-rose-50",
            border: "border-rose-100",
        },
    ];

    /* =====================================================
       LOADING STATE
    ===================================================== */

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <Loader2
                            className="animate-spin text-blue-600"
                            size={24}
                        />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">
                            Loading dashboard
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                            Fetching the latest logistics activity...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* =====================================================
       ERROR STATE
    ===================================================== */

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-7 text-center">

                    <div className="mx-auto w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center">
                        <AlertTriangle
                            className="text-rose-500"
                            size={23}
                        />
                    </div>

                    <h2 className="text-base font-bold text-slate-900 mt-4">
                        Couldn't load dashboard
                    </h2>

                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        {error}
                    </p>

                    <Button
                        onClick={loadDashboard}
                        className="mt-5 bg-slate-900 hover:bg-slate-800 rounded-xl"
                    >
                        <RefreshCcw size={15} />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <div className="min-h-screen bg-slate-50 p-5 md:p-6 lg:p-8">

            <div className="max-w-7xl mx-auto space-y-6">

                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        {/* TITLE */}

                        <div className="flex items-start gap-4">

                            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                <Activity
                                    size={22}
                                    className="text-blue-700"
                                />
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                                    Logistics Operations
                                </p>

                                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                                    Dashboard
                                </h1>

                                <p className="text-sm text-slate-500 mt-1">
                                    Overview of your current shipment activity and operations.
                                </p>
                            </div>

                        </div>

                        {/* DATE */}

                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">

                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                <Calendar
                                    size={15}
                                    className="text-slate-600"
                                />
                            </div>

                            <div>
                                <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                                    Today
                                </p>

                                <p className="text-xs sm:text-sm font-bold text-slate-700">
                                    {today}
                                </p>
                            </div>

                            <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

                        </div>

                    </div>

                </section>

                {/* =================================================
                    KPI CARDS
                ================================================= */}

                <section>

                    <div className="flex items-center justify-between mb-3">

                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                Operations Overview
                            </h2>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Current shipment statistics
                            </p>
                        </div>

                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

                        {cards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <div
                                    key={card.label}
                                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                                >

                                    <div className="flex items-start justify-between gap-3">

                                        <div>
                                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                {card.label}
                                            </p>

                                            <p className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                                                {card.value ?? 0}
                                            </p>

                                            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                                                {card.description}
                                            </p>
                                        </div>

                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.bg} ${card.color} ${card.border}`}
                                        >
                                            <Icon size={19} />
                                        </div>

                                    </div>

                                </div>
                            );
                        })}

                    </div>

                </section>

                <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Priority Actions</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Operational items needing attention</p>
                            </div>
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                {needsAttentionCount} items
                            </span>
                        </div>

                        <div className="space-y-3">
                            {(data.recentActivity || []).slice(0, 3).map((order) => {
                                const status = (order.current_status || "pending").toLowerCase();
                                const tone =
                                    status === "completed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : status === "in_transit"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200";

                                return (
                                    <div
                                        key={order.order_id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-800">{order.order_reference || `ORD-${order.order_id}`}</p>
                                            <p className="text-[11px] text-slate-500">{order.customer || "Internal"}</p>
                                        </div>

                                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
                                            {status.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900">Operations Summary</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Current operational status</p>

                        <div className="mt-5 space-y-4">
                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>In transit</span>
                                    <span>{data.stats.inTransitCount}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-blue-500"
                                        style={{ width: `${Math.min((data.stats.inTransitCount / Math.max(totalActiveOrders, 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>Completed</span>
                                    <span>{data.stats.completedOrders}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{ width: `${Math.min((data.stats.completedOrders / Math.max(totalActiveOrders, 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>Needs attention</span>
                                    <span>{needsAttentionCount}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-amber-500"
                                        style={{ width: `${Math.min((needsAttentionCount / Math.max(totalActiveOrders, 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    ACTIVITY SECTION
                ================================================= */}

                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                    {/* HEADER */}

                    <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                        <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <Clock3
                                    size={17}
                                    className="text-blue-700"
                                />
                            </div>

                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    Recent Activity
                                </h2>

                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Latest shipment records across your orders
                                </p>
                            </div>

                        </div>

                        <button
                            onClick={() =>
                                navigate("/orders")
                            }
                            className="self-start sm:self-auto text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                        >
                            View all orders
                            <ArrowRight size={13} />
                        </button>

                    </div>

                    {/* TABLE */}

                    <div className="overflow-x-auto">

                        <Table>

                            <TableHeader>

                                <TableRow className="bg-slate-50 border-b border-slate-100">

                                    <TableHead className="py-3.5 px-5 md:px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Order
                                    </TableHead>

                                    <TableHead className="py-3.5 px-5 md:px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Reference
                                    </TableHead>

                                    <TableHead className="py-3.5 px-5 md:px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Type
                                    </TableHead>

                                    <TableHead className="py-3.5 px-5 md:px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Vehicle / Driver
                                    </TableHead>

                                    <TableHead className="py-3.5 px-5 md:px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Status
                                    </TableHead>

                                    <TableHead className="py-3.5 px-5 md:px-6 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Action
                                    </TableHead>

                                </TableRow>

                            </TableHeader>

                            <TableBody>

                                {data.recentActivity?.length > 0 ? (

                                    data.recentActivity.map(
                                        (order) => (
                                            <TableRow
                                                key={
                                                    order.order_id
                                                }
                                                className="hover:bg-slate-50/80 transition-colors border-slate-100"
                                            >

                                                {/* ORDER */}

                                                <TableCell className="py-4 px-5 md:px-6">

                                                    <div className="flex items-center gap-3">

                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                            <Package
                                                                size={14}
                                                                className="text-slate-600"
                                                            />
                                                        </div>

                                                        <span className="font-mono text-xs font-bold text-slate-700">
                                                            #
                                                            {
                                                                order.order_id
                                                            }
                                                        </span>

                                                    </div>

                                                </TableCell>

                                                {/* REFERENCE */}

                                                <TableCell className="py-4 px-5 md:px-6">

                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {order.order_reference ||
                                                            "—"}
                                                    </span>

                                                </TableCell>

                                                {/* TYPE */}

                                                <TableCell className="py-4 px-5 md:px-6">

                                                    <OrderTypeBadge
                                                        type={
                                                            order.order_type
                                                        }
                                                    />

                                                </TableCell>

                                                {/* VEHICLE / DRIVER */}

                                                <TableCell className="py-4 px-5 md:px-6">

                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {order.vehicle_number ||
                                                                "No vehicle assigned"}
                                                        </p>

                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            {order.driver_name ||
                                                                "No driver assigned"}
                                                        </p>
                                                    </div>

                                                </TableCell>

                                                {/* STATUS */}

                                                <TableCell className="py-4 px-5 md:px-6">
                                                    <StatusBadge
                                                        status={
                                                            order.current_status
                                                        }
                                                    />
                                                </TableCell>

                                                {/* ACTION */}

                                                <TableCell className="py-4 px-5 md:px-6 text-right">

                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `/orders/${order.order_id}`
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition-all"
                                                    >
                                                        Details
                                                        <ArrowUpRight
                                                            size={
                                                                13
                                                            }
                                                        />
                                                    </button>

                                                </TableCell>

                                            </TableRow>
                                        )
                                    )

                                ) : (

                                    <TableRow>

                                        <TableCell
                                            colSpan={6}
                                            className="h-52 text-center"
                                        >

                                            <div className="flex flex-col items-center justify-center">

                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                    <Package
                                                        size={23}
                                                        className="text-slate-300"
                                                    />
                                                </div>

                                                <p className="text-sm font-bold text-slate-600 mt-3">
                                                    No shipment activity yet
                                                </p>

                                                <p className="text-xs text-slate-400 mt-1">
                                                    Orders will appear here once they are created.
                                                </p>

                                            </div>

                                        </TableCell>

                                    </TableRow>
                                )}

                            </TableBody>

                        </Table>

                    </div>

                </section>

                {/* =================================================
                    FOOTER SUMMARY
                ================================================= */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">

                    <p className="text-[11px] text-slate-400">
                        ConnTrack Logistics Management System
                    </p>

                    <p className="text-[11px] text-slate-400">
                        Dashboard data is retrieved from the latest server records.
                    </p>

                </div>

            </div>

        </div>
    );
}

/* =========================================================
   ORDER TYPE BADGE
========================================================= */

function OrderTypeBadge({ type }) {
    const normalized =
        type?.toLowerCase() || "unknown";

    const isImport =
        normalized === "import";

    return (
        <Badge
            variant="secondary"
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isImport
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-sky-50 text-sky-700 border-sky-200"
            }`}
        >
            {normalized.charAt(0).toUpperCase() +
                normalized.slice(1)}
        </Badge>
    );
}