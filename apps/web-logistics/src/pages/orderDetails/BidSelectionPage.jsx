import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Loader2,
  Package,
} from "lucide-react";

import { Button } from "@/ui";

import BidsSection from "./BidsSection";
import OrderSummary from "./OrderSummary";

import api from "../../config/api";

export default function BidSelectionPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // =========================================================
    // FETCH ORDER
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
    // HANDLE BID SELECTION
    // =========================================================

    const handleSelectWinner = async (bid) => {
        setOrder((prev) => ({
            ...prev,
            current_status: "bid_accepted",
            assigned_supplier: bid.company_name,
        }));
    };

    // =========================================================
    // LOADING
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
                            Loading bid selection
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                            Retrieving available carrier bids...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
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

    // =========================================================
    // STATUS
    // =========================================================

    const status = (
        order.current_status || "created"
    )
        .replace(/_/g, " ")
        .toLowerCase();

    const isAssigned = [
        "bid_accepted",
        "driver_assigned",
        "in_transit",
        "at_port",
        "completed",
    ].includes(order.current_status);

    return (
        <div className="min-h-screen bg-slate-50/60 px-4 py-5 md:px-6 md:py-7">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* =====================================================
                    PAGE HEADER
                ====================================================== */}

                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* Left */}
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
                                    Bid Selection
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
                                    {order.order_reference ||
                                        `#${order.order_id}`}
                                </span>

                            </div>

                            <p className="
                                mt-0.5
                                text-[11px]
                                font-medium
                                text-slate-400
                            ">
                                Review carrier bids and select a
                                suitable supplier
                            </p>

                        </div>
                    </div>

                    {/* Status */}
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
                                    status === "completed"
                                        ? "bg-emerald-500"
                                        : isAssigned
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


                {/* =====================================================
                    ORDER CONTEXT
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
                        gap-4
                        px-5
                        py-4
                        md:flex-row
                        md:items-center
                        md:justify-between
                        md:px-6
                    ">

                        {/* Order information */}
                        <div className="flex items-center gap-3">

                            <div className="
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-50
                            ">
                                <Gavel
                                    size={18}
                                    className="text-blue-600"
                                />
                            </div>

                            <div>
                                <h2 className="
                                    text-sm
                                    font-extrabold
                                    text-slate-900
                                ">
                                    Carrier Bids
                                </h2>

                                <p className="
                                    mt-0.5
                                    text-[10px]
                                    font-medium
                                    text-slate-400
                                ">
                                    Compare available suppliers
                                    before confirming the shipment
                                </p>
                            </div>

                        </div>

                        {/* Order type */}
                        <div className="
                            flex
                            items-center
                            gap-2
                        ">

                            <span className="
                                rounded-lg
                                bg-slate-100
                                px-2.5
                                py-1.5
                                text-[10px]
                                font-extrabold
                                uppercase
                                tracking-wider
                                text-slate-600
                            ">
                                {order.order_type || "Import"}
                            </span>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    ASSIGNMENT STATUS
                ====================================================== */}

                {isAssigned && (
                    <section className="
                        rounded-2xl
                        border
                        border-emerald-200
                        bg-emerald-50
                        px-5
                        py-4
                    ">

                        <div className="flex items-start gap-3">

                            <div className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-emerald-100
                            ">
                                <CheckCircle2
                                    size={17}
                                    className="text-emerald-600"
                                />
                            </div>

                            <div>
                                <p className="
                                    text-sm
                                    font-extrabold
                                    text-emerald-800
                                ">
                                    Supplier Already Selected
                                </p>

                                <p className="
                                    mt-0.5
                                    text-[11px]
                                    font-medium
                                    text-emerald-700
                                ">
                                    This order has already moved beyond
                                    bid selection. Available bids are
                                    shown for reference only.
                                </p>
                            </div>

                        </div>

                    </section>
                )}


                {/* =====================================================
                    MAIN CONTENT
                ====================================================== */}

                <div className="
                    grid
                    grid-cols-1
                    gap-6
                    lg:grid-cols-5
                ">

                    {/* =================================================
                        BIDS
                    ================================================= */}

                    <section className="lg:col-span-3">

                        <div className="
                            overflow-hidden
                            rounded-2xl
                            border
                            border-slate-200/80
                            bg-white
                            shadow-sm
                        ">

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
                                        bg-emerald-50
                                    ">
                                        <CheckCircle2
                                            size={17}
                                            className="text-emerald-600"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="
                                            text-sm
                                            font-extrabold
                                            text-slate-900
                                        ">
                                            Available Bids
                                        </h2>

                                        <p className="
                                            mt-0.5
                                            text-[10px]
                                            font-medium
                                            text-slate-400
                                        ">
                                            Review pricing and carrier
                                            information
                                        </p>
                                    </div>

                                </div>

                            </div>

                            <div className="p-5 md:p-6">

                                <BidsSection
                                    orderId={order.order_id}
                                    disabled={isAssigned}
                                    currentStatus={
                                        order.current_status
                                    }
                                    onSelectWinner={
                                        handleSelectWinner
                                    }
                                />

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        ORDER SUMMARY
                    ================================================= */}

                    <aside className="lg:col-span-2">

                        <div className="sticky top-20">

                            <OrderSummary
                                order={order}
                            />

                        </div>

                    </aside>

                </div>

            </div>
        </div>
    );
}