import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    ChevronRight,
    FileText,
    Info,
    Loader2,
    MapPin,
    Package,
    Truck,
    User,
    Weight,
} from "lucide-react";

import { Button } from "@/ui";

import ContainerMap from "./ContainerMap";
import TrackingMeter from "./TrackingMeter";

import api from "../../config/api";

export default function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // =========================================================
    // FETCH ORDER DETAILS
    // =========================================================
    useEffect(() => {
        async function fetchOrderDetails() {
            try {
                setLoading(true);
                setError(null);

                const response = await api.get(
                    `/logistics/orders/${id}`
                );

                setOrder(response.data);
            } catch (err) {
                console.error("Fetch Error:", err);

                setError(
                    err.response?.data?.message ||
                        err.message ||
                        "Failed to load order details."
                );
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    // =========================================================
    // LOADING STATE
    // =========================================================
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/60">
                <div className="mx-auto flex min-h-[600px] max-w-7xl items-center justify-center px-6">
                    <div className="flex flex-col items-center text-center">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                            <Loader2
                                size={28}
                                className="animate-spin text-blue-600"
                            />
                        </div>

                        <p className="mt-4 text-sm font-extrabold text-slate-800">
                            Loading order details
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                            Retrieving the latest shipment information...
                        </p>

                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR STATE
    // =========================================================
    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-50/60 px-6 py-8">
                <div className="mx-auto flex min-h-[600px] max-w-7xl items-center justify-center">

                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <Package
                                size={26}
                                className="text-slate-400"
                            />
                        </div>

                        <h2 className="mt-5 text-lg font-extrabold text-slate-900">
                            Order Record Not Found
                        </h2>

                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            {error ||
                                "The requested order could not be found."}
                        </p>

                        <Button
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="
                                mt-6
                                h-10
                                gap-2
                                rounded-xl
                                bg-slate-900
                                px-5
                                text-xs
                                font-bold
                                text-white
                                hover:bg-slate-800
                            "
                        >
                            <ArrowLeft size={14} />
                            Back to Orders
                        </Button>

                    </div>
                </div>
            </div>
        );
    }

    const status = (
        order.current_status || "created"
    )
        .replace(/_/g, " ")
        .toLowerCase();
    const orderAssignment = order.order_assignments?.[0];
    const supplierName =
        orderAssignment?.suppliers?.company_name || "Pending Selection";
    const driverName = orderAssignment?.drivers
        ? `${orderAssignment.drivers.first_name} ${orderAssignment.drivers.last_name}`
        : "Pending Selection";

    return (
        <div className="min-h-screen bg-slate-50/60 px-4 py-5 md:px-6 md:py-7">

            <div className="mx-auto max-w-7xl space-y-6">

                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* Breadcrumb */}
                    <div className="flex min-w-0 items-center gap-3">

                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                text-slate-600
                                shadow-sm
                                transition-all
                                hover:border-slate-300
                                hover:bg-slate-900
                                hover:text-white
                            "
                        >
                            <ArrowLeft size={17} />
                        </button>

                        <div className="min-w-0">

                            <div className="flex items-center gap-2">

                                <span className="
                                    text-lg
                                    font-extrabold
                                    tracking-tight
                                    text-slate-900
                                ">
                                    Order Details
                                </span>

                                <ChevronRight
                                    size={15}
                                    className="shrink-0 text-slate-300"
                                />

                                <span className="
                                    truncate
                                    font-mono
                                    text-xs
                                    font-bold
                                    text-blue-700
                                ">
                                    {order.order_reference || `#${order.order_id}`}
                                </span>

                            </div>

                            <p className="
                                mt-0.5
                                text-[11px]
                                font-medium
                                text-slate-400
                            ">
                                Shipment overview and operational information
                            </p>

                        </div>
                    </div>

                    {/* Current status */}
                    <div className="
                        flex
                        w-fit
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-3.5
                        py-2.5
                        shadow-sm
                    ">

                        <span
                            className={`
                                h-2
                                w-2
                                rounded-full
                                ${
                                    status === "completed" ||
                                    status === "delivered"
                                        ? "bg-emerald-500"
                                        : status === "in transit"
                                        ? "bg-blue-500"
                                        : "bg-amber-500"
                                }
                            `}
                        />

                        <span className="
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-wider
                            text-slate-600
                        ">
                            {status}
                        </span>

                    </div>

                </header>


                <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.35fr)]">
                    {/* =====================================================
                        ORDER SUMMARY
                    ====================================================== */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 md:p-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#052659] text-white">
                                <Package size={21} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="truncate text-lg font-extrabold text-slate-900">
                                        {order.order_reference || `Order #${order.order_id}`}
                                    </h2>
                                    <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold capitalize text-slate-600">
                                        {order.order_type || "N/A"}
                                    </span>
                                </div>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {order.customers?.customer_name || "Internal Order"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 p-5 md:p-6">
                        <div className="flex items-center gap-2">
                            <Info size={15} className="text-blue-600" />
                            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
                                Logistics Summary
                            </h3>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-4 rounded-xl bg-slate-50 p-4">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Origin</p>
                                    <p className="mt-1 text-sm font-bold text-slate-800">
                                        {order.pickup_location || order.pickup_state || order.pickup_district || "N/A"}{order.pickup_country ? `, ${order.pickup_country}` : ""}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Destination</p>
                                    <p className="mt-1 text-sm font-bold text-slate-800">
                                        {order.destination_location || order.destination_state || order.destination_district || "N/A"}{order.destination_country ? `, ${order.destination_country}` : ""}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <Weight size={14} className="text-slate-400" />
                                    <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Weight</p>
                                    <p className="mt-1 text-sm font-extrabold text-slate-800">{order.cargo_weight ? `${order.cargo_weight} kg` : "N/A"}</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <Truck size={14} className="text-slate-400" />
                                    <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Vehicle</p>
                                    <p className="mt-1 truncate text-sm font-extrabold text-slate-800">{order.vehicle_type || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-3">
                            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                                <Briefcase size={16} className="text-blue-600" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase text-slate-400">Supplier</p>
                                    <p className="truncate text-xs font-bold text-slate-800">{supplierName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                                <User size={16} className="text-purple-600" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase text-slate-400">Driver</p>
                                    <p className="truncate text-xs font-bold text-slate-800">{driverName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                                <Package size={16} className="text-[#052659]" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase text-slate-400">Container</p>
                                    <p className="truncate font-mono text-xs font-extrabold text-[#052659]">{order.container_no || "Not Assigned"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <Calendar size={15} className="text-blue-600" />
                                Pickup Date
                            </div>
                            <span className="text-xs font-extrabold text-slate-800">{order.pickup_date || "TBD"}</span>
                        </div>
                    </div>
                    </section>


                    {/* =====================================================
                        TRACKING
                    ====================================================== */}
                    <section className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200/80
                    bg-white
                    shadow-sm
                ">

                    {/* Section Header */}
                    <div className="
                        border-b
                        border-slate-100
                        px-5
                        py-4
                        md:px-6
                    ">

                        <div className="flex items-center gap-3">

                            <div className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-50
                            ">
                                <Package
                                    size={17}
                                    className="text-blue-600"
                                />
                            </div>

                            <div>

                                <h2 className="
                                    text-sm
                                    font-extrabold
                                    text-slate-900
                                ">
                                    Shipment Tracking
                                </h2>

                                <p className="
                                    mt-0.5
                                    text-[10px]
                                    font-medium
                                    text-slate-400
                                ">
                                    Current progress and shipment status
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* Tracking Content */}
                    <div className="px-5 py-6 md:px-7 md:py-7">

                        <TrackingMeter
                            orderId={order.order_id}
                            orderType={order.order_type}
                        />

                    </div>

                    </section>
                </div>


                {/* =====================================================
                    CONTAINER LOCATION
                ====================================================== */}
                <section className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200/80
                    bg-white
                    shadow-sm
                ">

                    {/* Section Header */}
                    <div className="
                        border-b
                        border-slate-100
                        px-5
                        py-4
                        md:px-6
                    ">

                        <div className="flex items-center gap-3">

                            <div className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-xl
                                bg-indigo-50
                            ">
                                <MapPin
                                    size={17}
                                    className="text-indigo-600"
                                />
                            </div>

                            <div>

                                <h2 className="
                                    text-sm
                                    font-extrabold
                                    text-slate-900
                                ">
                                    Container Location
                                </h2>

                                <p className="
                                    mt-0.5
                                    text-[10px]
                                    font-medium
                                    text-slate-400
                                ">
                                    Current container position and movement
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* Map */}
                    <div className="px-5 py-6 md:px-7 md:py-7">

                        <ContainerMap
                            orderId={order.order_id}
                            status={order.current_status}
                        />

                    </div>

                </section>


                {/* =====================================================
                    OPERATIONAL ACTIONS
                ====================================================== */}
                <section className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200/80
                    bg-white
                    shadow-sm
                ">

                    <div className="
                        flex
                        flex-col
                        gap-5
                        p-5
                        md:p-6
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                    ">

                        {/* Information */}
                        <div className="flex items-start gap-3">

                            <div className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-slate-100
                            ">
                                <Package
                                    size={17}
                                    className="text-slate-600"
                                />
                            </div>

                            <div>

                                <h2 className="
                                    text-sm
                                    font-extrabold
                                    text-slate-900
                                ">
                                    Operational Actions
                                </h2>

                                <p className="
                                    mt-1
                                    max-w-xl
                                    text-[11px]
                                    font-medium
                                    leading-relaxed
                                    text-slate-500
                                ">
                                    Review carrier bids or manage the
                                    required shipment documentation.
                                </p>

                            </div>

                        </div>


                        {/* Action Buttons */}
                        <div className="
                            flex
                            flex-wrap
                            gap-2
                        ">

                            {/* Bid Selection */}
                            <Button
                                variant="outline"
                                className="
                                    h-10
                                    gap-2
                                    rounded-xl
                                    border-emerald-200
                                    bg-emerald-50
                                    px-4
                                    text-[11px]
                                    font-extrabold
                                    text-emerald-700
                                    shadow-none
                                    transition-all
                                    hover:border-emerald-300
                                    hover:bg-emerald-100
                                "
                                onClick={() =>
                                    navigate(
                                        `/orders/${order.order_id}/bids`
                                    )
                                }
                            >
                                <CheckCircle2
                                    size={15}
                                    className="text-emerald-600"
                                />

                                Bid Selection
                            </Button>


                            {/* Documents */}
                            <Button
                                variant="outline"
                                className="
                                    h-10
                                    gap-2
                                    rounded-xl
                                    border-blue-200
                                    bg-blue-50
                                    px-4
                                    text-[11px]
                                    font-extrabold
                                    text-blue-700
                                    shadow-none
                                    transition-all
                                    hover:border-blue-300
                                    hover:bg-blue-100
                                "
                                onClick={() =>
                                    navigate(
                                        `/orders/${order.order_id}/documents`
                                    )
                                }
                            >
                                <FileText
                                    size={15}
                                    className="text-blue-600"
                                />

                                Documents
                            </Button>

                        </div>

                    </div>

                </section>

            </div>
        </div>
    );
}