import {
    ArrowDownToLine,
    ArrowUpFromLine,
    BarChart3,
    CalendarDays,
    Download,
    FileBarChart,
    Loader2,
    PackageCheck,
    PieChart as PieIcon,
    Truck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
    Button,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/ui";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import api from "../../config/api";

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_COLORS = {
    created: "#64748B",
    open_for_bids: "#F59E0B",
    bid_accepted: "#8B5CF6",
    driver_assigned: "#06B6D4",
    in_transit: "#3B82F6",
    completed: "#10B981",
    cancelled: "#EF4444",
};

const STATUS_ORDER = [
    "created",
    "open_for_bids",
    "bid_accepted",
    "driver_assigned",
    "in_transit",
    "completed",
    "cancelled",
];

const STATUS_LABELS = {
    created: "Created",
    open_for_bids: "Open Bids",
    bid_accepted: "Bid Accepted",
    driver_assigned: "Driver Assigned",
    in_transit: "In Transit",
    completed: "Completed",
    cancelled: "Cancelled",
};

const CARGO_COLORS = [
    "#1E40AF",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#64748B",
];

/* =========================================================
   MAIN REPORT COMPONENT
========================================================= */

export default function Reports() {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completedCount: 0,
        imports: 0,
        exports: 0,
    });

    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState("");

    const [fromDate, setFromDate] = useState("2026-01-01");
    const [toDate, setToDate] = useState("2026-12-31");

    useEffect(() => {
        fetchReportData();
    }, [fromDate, toDate]);

    async function fetchReportData() {
        setLoading(true);

        try {
            const response = await api.get("/logistics/reports", {
                params: {
                    fromDate,
                    toDate,
                },
            });

            const { orders, stats } = response.data;

            setOrders(orders || []);

            setStats(
                stats || {
                    total: 0,
                    completedCount: 0,
                    imports: 0,
                    exports: 0,
                }
            );
        } catch (err) {
            const errorMsg =
                err.response?.data?.message || err.message;

            console.error("Logistics API Error:", errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const handleDownloadPdf = async () => {
        setPdfLoading(true);
        setPdfError("");

        try {
            try {
                const response = await api.get("/logistics/reports/pdf", {
                    params: { fromDate, toDate },
                    responseType: "blob",
                });
                const url = URL.createObjectURL(response.data);
                const link = document.createElement("a");
                link.href = url;
                link.download = `logistics-report-${fromDate}-to-${toDate}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
                return;
            } catch (err) {
                if (err.response?.status !== 404) throw err;
            }

            const { jsPDF } = await import("jspdf");
            const pdfDocument = new jsPDF();
            const pageWidth = pdfDocument.internal.pageSize.getWidth();
            const pageHeight = pdfDocument.internal.pageSize.getHeight();
            const margin = 14;
            let y = 18;

            pdfDocument.setTextColor(18, 53, 91);
            pdfDocument.setFontSize(18);
            pdfDocument.setFont("helvetica", "bold");
            pdfDocument.text("LOGISTICS OPERATIONS REPORT", margin, y);
            y += 7;
            pdfDocument.setTextColor(100, 116, 139);
            pdfDocument.setFontSize(9);
            pdfDocument.setFont("helvetica", "normal");
            pdfDocument.text("ConnTrack Integrated Logistics System", margin, y);
            y += 6;
            pdfDocument.line(margin, y, pageWidth - margin, y);
            y += 7;
            pdfDocument.text(`Reporting period: ${fromDate} to ${toDate}`, margin, y);
            y += 5;
            pdfDocument.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
            y += 10;

            const metrics = [
                ["Total orders", stats.total],
                ["Completed", stats.completedCount],
                ["Imports", stats.imports],
                ["Exports", stats.exports],
            ];
            const metricWidth = (pageWidth - margin * 2 - 9) / 4;
            metrics.forEach(([label, value], index) => {
                const x = margin + index * (metricWidth + 3);
                pdfDocument.setFillColor(248, 250, 252);
                pdfDocument.setDrawColor(226, 232, 240);
                pdfDocument.roundedRect(x, y, metricWidth, 18, 2, 2, "FD");
                pdfDocument.setTextColor(100, 116, 139);
                pdfDocument.setFontSize(7);
                pdfDocument.setFont("helvetica", "bold");
                pdfDocument.text(label.toUpperCase(), x + 3, y + 6);
                pdfDocument.setTextColor(18, 53, 91);
                pdfDocument.setFontSize(13);
                pdfDocument.text(String(value), x + 3, y + 14);
            });
            y += 28;

            const drawTableHeader = () => {
                pdfDocument.setFillColor(18, 53, 91);
                pdfDocument.rect(margin, y, pageWidth - margin * 2, 8, "F");
                pdfDocument.setTextColor(255, 255, 255);
                pdfDocument.setFontSize(7);
                pdfDocument.setFont("helvetica", "bold");
                ["Order ID", "Customer", "Route", "Date", "Status"].forEach((label, index) => {
                    pdfDocument.text(label, [margin + 3, margin + 25, margin + 68, margin + 145, margin + 170][index], y + 5);
                });
                y += 8;
            };

            pdfDocument.setTextColor(18, 53, 91);
            pdfDocument.setFontSize(12);
            pdfDocument.setFont("helvetica", "bold");
            pdfDocument.text("Order Manifest", margin, y);
            y += 5;
            drawTableHeader();

            orders.forEach((order, index) => {
                if (y > pageHeight - 22) {
                    pdfDocument.addPage();
                    y = 18;
                    drawTableHeader();
                }

                if (index % 2 === 0) {
                    pdfDocument.setFillColor(248, 250, 252);
                    pdfDocument.rect(margin, y, pageWidth - margin * 2, 8, "F");
                }

                const route = order.route || `${order.pickup_location || order.pickup_district || "N/A"} -> ${order.destination_location || order.destination_district || "N/A"}`;
                const values = [
                    `#${String(order.order_id).padStart(5, "0")}`,
                    order.customer_name || "Unknown Customer",
                    route,
                    order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A",
                    (order.current_status || "created").replace(/_/g, " "),
                ];
                pdfDocument.setTextColor(30, 41, 59);
                pdfDocument.setFontSize(7);
                pdfDocument.setFont("helvetica", "normal");
                values.forEach((value, valueIndex) => {
                    const x = [margin + 3, margin + 25, margin + 68, margin + 145, margin + 170][valueIndex];
                    const width = [20, 40, 74, 22, 25][valueIndex];
                    pdfDocument.text(pdfDocument.splitTextToSize(String(value), width)[0], x, y + 5);
                });
                y += 8;
            });

            pdfDocument.save(`logistics-report-${fromDate}-to-${toDate}.pdf`);
        } catch (err) {
            console.error("Logistics PDF Error:", err);
            setPdfError("Failed to download the logistics report PDF.");
        } finally {
            setPdfLoading(false);
        }
    };

    /* =========================================================
       DERIVED DATA
    ========================================================= */

    const statusChartData = useMemo(() => {
        const counts = {};

        orders.forEach((order) => {
            const statusKey = order.current_status || "created";

            counts[statusKey] =
                (counts[statusKey] || 0) + 1;
        });

        return STATUS_ORDER
            .filter(
                (statusKey) =>
                    counts[statusKey] !== undefined
            )
            .map((statusKey) => ({
                name:
                    STATUS_LABELS[statusKey] ||
                    statusKey.replace(/_/g, " "),
                count: counts[statusKey],
                statusKey,
            }));
    }, [orders]);

    const cargoChartData = useMemo(() => {
        const categories = {};

        orders.forEach((order) => {
            const cargo =
                order.cargo_type || "General Freight";

            categories[cargo] =
                (categories[cargo] || 0) + 1;
        });

        return Object.keys(categories)
            .map((cargo, index) => ({
                name: cargo,
                value: categories[cargo],
                color:
                    CARGO_COLORS[
                        index % CARGO_COLORS.length
                    ],
            }))
            .sort((a, b) => b.value - a.value);
    }, [orders]);

    const destinationChartData = useMemo(() => {
        const destinations = {};

        orders.forEach((order) => {
            const destination =
                order.destination_location ||
                order.destination_district ||
                order.destination_state ||
                "Unspecified Hub";

            destinations[destination] =
                (destinations[destination] || 0) + 1;
        });

        return Object.keys(destinations)
            .map((destination) => ({
                name:
                    destination.length > 18
                        ? `${destination.substring(
                              0,
                              18
                          )}...`
                        : destination,

                fullName: destination,

                shipments:
                    destinations[destination],
            }))
            .sort(
                (a, b) =>
                    b.shipments - a.shipments
            )
            .slice(0, 5);
    }, [orders]);

    const completionRate = useMemo(() => {
        if (!stats.total) return 0;

        return Math.round(
            (stats.completedCount / stats.total) * 100
        );
    }, [stats]);

    const importPercentage = useMemo(() => {
        if (!stats.total) return 0;

        return Math.round(
            (stats.imports / stats.total) * 100
        );
    }, [stats]);

    const exportPercentage = useMemo(() => {
        if (!stats.total) return 0;

        return Math.round(
            (stats.exports / stats.total) * 100
        );
    }, [stats]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* =================================================
                PRINT STYLES
            ================================================= */}

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    @media print {

                        @page {
                            margin: 12mm 10mm;
                            size: portrait;
                        }

                        nav,
                        aside,
                        .no-print {
                            display: none !important;
                        }

                        main {
                            margin-left: 0 !important;
                            padding-top: 0 !important;
                        }

                        body {
                            background: #fff !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .printable-report {
                            padding: 0 !important;
                            margin: 0 !important;
                            width: 100% !important;
                            max-width: none !important;
                            background: #fff !important;
                            color: #000 !important;
                        }

                        .printable-report svg,
                        .printable-report .recharts-wrapper,
                        .printable-report .chart-card,
                        .printable-report .stat-card {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            break-inside: avoid !important;
                        }

                        .printable-report * {
                            overflow: visible !important;
                        }

                        .chart-grid {
                            display: grid !important;
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 12px !important;
                            margin-bottom: 20px !important;
                        }

                        .destination-chart {
                            grid-column: span 2 !important;
                        }

                        .chart-card {
                            border: 1px solid #cbd5e1 !important;
                            border-radius: 8px !important;
                            padding: 10px !important;
                            background: #fff !important;
                            break-inside: avoid !important;
                        }

                        .print-table {
                            border: 1px solid #000 !important;
                            border-radius: 0 !important;
                            width: 100% !important;
                            break-inside: auto !important;
                        }

                        .print-table table {
                            width: 100% !important;
                            table-layout: fixed !important;
                            border-collapse: collapse !important;
                            font-size: 9.5px !important;
                        }

                        .print-table th,
                        .print-table td {
                            padding: 6px 8px !important;
                            vertical-align: top !important;
                            word-wrap: break-word !important;
                            line-height: 1.35 !important;
                        }

                        .print-table .print-nowrap {
                            white-space: nowrap !important;
                        }

                        .print-table col.col-order {
                            width: 12% !important;
                        }

                        .print-table col.col-customer {
                            width: 26% !important;
                        }

                        .print-table col.col-route {
                            width: 28% !important;
                        }

                        .print-table col.col-date {
                            width: 14% !important;
                        }

                        .print-table col.col-status {
                            width: 20% !important;
                        }

                        .print-table thead {
                            border-bottom: 2px solid #000 !important;
                        }

                        .print-table tr {
                            border-bottom: 1px solid #d4d4d4 !important;
                            break-inside: avoid !important;
                        }

                        .status-badge {
                            border: 1px solid #000 !important;
                            font-weight: 700 !important;
                            font-size: 7.5px !important;
                            white-space: nowrap !important;
                        }

                        .stat-card {
                            border: 1px solid #000 !important;
                        }
                    }
                `,
                }}
            />

            <div className="printable-report max-w-7xl mx-auto p-5 md:p-6 space-y-6">

                {/* =================================================
                    PRINT HEADER
                ================================================= */}

                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                Logistics Operations Report
                            </h1>

                            <p className="text-xs text-slate-500 font-medium mt-1">
                                ConnTrack Integrated Logistics System
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Report Type
                            </p>

                            <p className="text-xs font-bold uppercase text-blue-900">
                                Official Executive Summary
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between mt-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        <span>
                            Period:{" "}
                            {formatDate(fromDate)} -{" "}
                            {formatDate(toDate)}
                        </span>

                        <span>
                            Generated:{" "}
                            {new Date().toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* =================================================
                    PAGE HEADER / FILTER
                ================================================= */}

                <section className="no-print bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <FileBarChart
                                    size={22}
                                    className="text-[#1E40AF]"
                                />
                            </div>

                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                                    Logistics Reports
                                </h1>

                                <p className="text-sm text-slate-500 mt-1">
                                    Monitor orders, shipments and operational performance.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">

                            <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-2 px-2">
                                    <CalendarDays
                                        size={15}
                                        className="text-slate-500"
                                    />

                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                        Period
                                    </span>
                                </div>

                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) =>
                                        setFromDate(
                                            e.target.value
                                        )
                                    }
                                    className="w-36 bg-white border-slate-200 text-xs"
                                />

                                <span className="text-xs font-bold text-slate-400">
                                    →
                                </span>

                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) =>
                                        setToDate(
                                            e.target.value
                                        )
                                    }
                                    className="w-36 bg-white border-slate-200 text-xs"
                                />
                            </div>

                            <Button
                                onClick={handleDownloadPdf}
                                disabled={pdfLoading || loading}
                                className="h-11 px-4 bg-emerald-700 hover:bg-emerald-800 rounded-xl font-bold"
                            >
                                <Download size={16} />
                                {pdfLoading ? "Creating PDF..." : "Download PDF"}
                            </Button>
                        </div>
                    </div>
                    {pdfError && (
                        <p className="mt-3 text-right text-xs font-semibold text-red-600">
                            {pdfError}
                        </p>
                    )}
                </section>

                {/* =================================================
                    KPI CARDS
                ================================================= */}

                <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">

                    <StatCard
                        title="Total Orders"
                        value={stats.total}
                        subtitle="All orders in period"
                        icon={
                            <FileBarChart size={18} />
                        }
                        color="blue"
                        loading={loading}
                    />

                    <StatCard
                        title="Completed"
                        value={stats.completedCount}
                        subtitle={`${completionRate}% completion rate`}
                        icon={
                            <PackageCheck size={18} />
                        }
                        color="green"
                        loading={loading}
                    />

                    <StatCard
                        title="Imports"
                        value={stats.imports}
                        subtitle={`${importPercentage}% of total orders`}
                        icon={
                            <ArrowDownToLine size={18} />
                        }
                        color="indigo"
                        loading={loading}
                    />

                    <StatCard
                        title="Exports"
                        value={stats.exports}
                        subtitle={`${exportPercentage}% of total orders`}
                        icon={
                            <ArrowUpFromLine size={18} />
                        }
                        color="purple"
                        loading={loading}
                    />

                </section>

                {/* =================================================
                    ANALYTICS HEADER
                ================================================= */}

                <div className="flex items-center justify-between pt-1">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Operational Analytics
                        </h2>

                        <p className="text-xs text-slate-500 mt-0.5">
                            Visual overview of current logistics activity
                        </p>
                    </div>
                </div>

                {/* =================================================
                    CHART GRID
                ================================================= */}

                <section className="chart-grid grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* STATUS CHART */}

                    <div className="chart-card min-w-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                        <ChartHeader
                            icon={
                                <BarChart3
                                    size={17}
                                    className="text-[#1E40AF]"
                                />
                            }
                            title="Order Status Overview"
                            description="Orders grouped by operational stage"
                        />

                        <div className="h-64 mt-4">

                            {loading ? (
                                <ChartLoading />
                            ) : statusChartData.length === 0 ? (
                                <EmptyChart />
                            ) : (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                    minWidth={0}
                                    minHeight={0}
                                >
                                    <BarChart
                                        data={statusChartData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -20,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#E2E8F0"
                                        />

                                        <XAxis
                                            dataKey="name"
                                            tick={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                            }}
                                            stroke="#64748B"
                                            interval={0}
                                            angle={-18}
                                            textAnchor="end"
                                            height={55}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                            }}
                                            stroke="#64748B"
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "#0F172A",
                                                border: "none",
                                                borderRadius:
                                                    "10px",
                                                color: "#fff",
                                                fontSize:
                                                    "12px",
                                            }}
                                            cursor={{
                                                fill: "#F1F5F9",
                                            }}
                                            formatter={(value) => [
                                                `${value} orders`,
                                                "Volume",
                                            ]}
                                        />

                                        <Bar
                                            dataKey="count"
                                            radius={[
                                                6,
                                                6,
                                                0,
                                                0,
                                            ]}
                                        >
                                            {statusChartData.map(
                                                (
                                                    entry,
                                                    index
                                                ) => (
                                                    <Cell
                                                        key={`status-${index}`}
                                                        fill={
                                                            STATUS_COLORS[
                                                                entry
                                                                    .statusKey
                                                            ] ||
                                                            "#1E40AF"
                                                        }
                                                    />
                                                )
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}

                        </div>
                    </div>

                    {/* CARGO CHART */}

                    <div className="chart-card min-w-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                        <ChartHeader
                            icon={
                                <PieIcon
                                    size={17}
                                    className="text-[#1E40AF]"
                                />
                            }
                            title="Cargo Distribution"
                            description="Shipment volume by cargo classification"
                        />

                        <div className="h-64 mt-4">

                            {loading ? (
                                <ChartLoading />
                            ) : cargoChartData.length === 0 ? (
                                <EmptyChart />
                            ) : (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                    minWidth={0}
                                    minHeight={0}
                                >
                                    <PieChart>
                                        <Pie
                                            data={cargoChartData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={48}
                                            outerRadius={78}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {cargoChartData.map(
                                                (
                                                    entry,
                                                    index
                                                ) => (
                                                    <Cell
                                                        key={`cargo-${index}`}
                                                        fill={
                                                            entry.color
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>

                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "#0F172A",
                                                border: "none",
                                                borderRadius:
                                                    "10px",
                                                color: "#fff",
                                                fontSize:
                                                    "12px",
                                            }}
                                            formatter={(
                                                value
                                            ) => [
                                                `${value} shipments`,
                                                "Volume",
                                            ]}
                                        />

                                        <Legend
                                            verticalAlign="bottom"
                                            height={40}
                                            iconType="circle"
                                            wrapperStyle={{
                                                fontSize:
                                                    "10px",
                                                fontWeight: 700,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}

                        </div>
                    </div>

                    {/* DESTINATION CHART */}

                    <div className="chart-card destination-chart min-w-0 lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

                        <div className="flex items-start justify-between">

                            <ChartHeader
                                icon={
                                    <Truck
                                        size={17}
                                        className="text-[#1E40AF]"
                                    />
                                }
                                title="Top Delivery Destinations"
                                description="Highest-volume freight destinations"
                            />

                            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide">
                                Top 5 Hubs
                            </span>

                        </div>

                        <div className="h-64 mt-4">

                            {loading ? (
                                <ChartLoading />
                            ) : destinationChartData.length ===
                              0 ? (
                                <EmptyChart />
                            ) : (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                    minWidth={0}
                                    minHeight={0}
                                >
                                    <BarChart
                                        layout="vertical"
                                        data={
                                            destinationChartData
                                        }
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 10,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                            stroke="#E2E8F0"
                                        />

                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            tick={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                            }}
                                            stroke="#64748B"
                                        />

                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tick={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                            }}
                                            stroke="#64748B"
                                            width={100}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "#0F172A",
                                                border: "none",
                                                borderRadius:
                                                    "10px",
                                                color: "#fff",
                                                fontSize:
                                                    "12px",
                                            }}
                                            labelFormatter={(
                                                label,
                                                payload
                                            ) =>
                                                payload?.[0]
                                                    ?.payload
                                                    ?.fullName ||
                                                label
                                            }
                                            formatter={(
                                                value
                                            ) => [
                                                `${value} deliveries`,
                                                "Volume",
                                            ]}
                                        />

                                        <Bar
                                            dataKey="shipments"
                                            fill="#1E40AF"
                                            radius={[
                                                0,
                                                7,
                                                7,
                                                0,
                                            ]}
                                            barSize={20}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}

                        </div>
                    </div>

                </section>

                {/* =================================================
                    MANIFEST HEADER
                ================================================= */}

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pt-2">

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Detailed Logistics Manifest
                        </h2>

                        <p className="text-xs text-slate-500 mt-0.5">
                            Complete order records for the selected period
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">
                            Showing
                        </span>

                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold">
                            {orders.length}
                        </span>

                        <span className="text-slate-500">
                            records
                        </span>
                    </div>

                </div>

                {/* =================================================
                    DATA TABLE
                ================================================= */}

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print-table">

                    <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileBarChart
                                    size={14}
                                    className="text-blue-700"
                                />
                            </div>

                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Order Records
                            </h3>
                        </div>

                        <span className="text-[11px] font-mono text-slate-500 font-bold">
                            {orders.length} Records
                        </span>
                    </div>

                    <div className="overflow-x-auto">

                        <Table>
                            <colgroup>
                                <col className="col-order" />
                                <col className="col-customer" />
                                <col className="col-route" />
                                <col className="col-date" />
                                <col className="col-status" />
                            </colgroup>

                            <TableHeader className="bg-slate-50">

                                <TableRow className="border-slate-200">

                                    <TableHead className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                        Order ID
                                    </TableHead>

                                    <TableHead className="text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                        Customer
                                    </TableHead>

                                    <TableHead className="text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                        Route
                                    </TableHead>

                                    <TableHead className="text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                        Date
                                    </TableHead>

                                    <TableHead className="text-right text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                        Status
                                    </TableHead>

                                </TableRow>

                            </TableHeader>

                            <TableBody>

                                {loading ? (
                                    <TableRow>

                                        <TableCell
                                            colSpan={5}
                                            className="h-56 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <Loader2
                                                        className="animate-spin text-[#1E40AF]"
                                                        size={22}
                                                    />
                                                </div>

                                                <div>
                                                    <p className="text-sm text-slate-700 font-bold">
                                                        Generating report
                                                        data...
                                                    </p>

                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Please wait
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>

                                        <TableCell
                                            colSpan={5}
                                            className="h-48 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <FileBarChart
                                                        size={20}
                                                        className="text-slate-400"
                                                    />
                                                </div>

                                                <p className="text-sm text-slate-700 font-semibold">
                                                    No logistics data found
                                                </p>

                                                <p className="text-xs text-slate-400">
                                                    Try selecting a different date range.
                                                </p>
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                ) : (
                                    orders.map((order) => (
                                        <TableRow
                                            key={
                                                order.order_id
                                            }
                                            className="hover:bg-slate-50 transition-colors border-slate-100"
                                        >

                                            {/* ORDER ID */}

                                            <TableCell className="px-5 py-4">
                                                <span className="font-mono text-xs text-slate-700 font-bold uppercase print-nowrap">
                                                    #
                                                    {String(
                                                        order.order_id
                                                    ).padStart(
                                                        5,
                                                        "0"
                                                    )}
                                                </span>
                                            </TableCell>

                                            {/* CUSTOMER */}

                                            <TableCell className="py-4">

                                                <div className="flex items-center gap-2.5">

                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {getInitials(
                                                                order.customer_name
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">
                                                            {order.customer_name ||
                                                                "Unknown Customer"}
                                                        </p>

                                                        <p className="text-[10px] font-mono text-blue-700 font-bold mt-0.5">
                                                            {order.order_reference ||
                                                                "No reference"}
                                                        </p>
                                                    </div>

                                                </div>

                                            </TableCell>

                                            {/* ROUTE */}

                                            <TableCell className="py-4">

                                                <div className="text-xs font-semibold text-slate-800">
                                                    {order.route ||
                                                        `${
                                                            order.pickup_location ||
                                                            order.pickup_district ||
                                                            "N/A"
                                                        } → ${
                                                            order.destination_location ||
                                                            order.destination_district ||
                                                            "N/A"
                                                        }`}
                                                </div>

                                                <div className="mt-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                        {order.order_type ||
                                                            "Order"}
                                                    </span>
                                                </div>

                                            </TableCell>

                                            {/* DATE */}

                                            <TableCell className="py-4 text-xs text-slate-600 font-semibold print-nowrap">
                                                {formatTableDate(
                                                    order.created_at
                                                )}
                                            </TableCell>

                                            {/* STATUS */}

                                            <TableCell className="py-4 text-right">
                                                <StatusBadge
                                                    status={
                                                        order.current_status
                                                    }
                                                />
                                            </TableCell>

                                        </TableRow>
                                    ))
                                )}

                            </TableBody>

                        </Table>

                    </div>
                </div>

                {/* =================================================
                    PRINT SIGNATURE SECTION
                ================================================= */}

                <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-200">

                    <div className="space-y-8">
                        <div className="border-b border-slate-300 w-full h-10" />

                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">
                                Authorized Signature
                            </p>

                            <p className="text-[10px] text-slate-400 mt-1 uppercase">
                                Logistics Manager / Department Head
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="border-b border-slate-300 w-full h-10" />

                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">
                                Date of Approval
                            </p>

                            <p className="text-[10px] text-slate-400 mt-1 uppercase">
                                Official Stamp Required
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    title,
    value,
    subtitle,
    icon,
    color = "blue",
    loading,
}) {
    const colors = {
        blue: {
            icon: "bg-blue-50 text-blue-700",
            value: "text-blue-700",
        },

        green: {
            icon: "bg-emerald-50 text-emerald-700",
            value: "text-emerald-700",
        },

        indigo: {
            icon: "bg-indigo-50 text-indigo-700",
            value: "text-indigo-700",
        },

        purple: {
            icon: "bg-purple-50 text-purple-700",
            value: "text-purple-700",
        },
    };

    const theme = colors[color] || colors.blue;

    return (
        <div className="stat-card bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">

            <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {title}
                    </p>

                    <p
                        className={`text-2xl md:text-3xl font-black tracking-tight mt-2 ${theme.value}`}
                    >
                        {loading ? (
                            <span className="text-slate-300">
                                ...
                            </span>
                        ) : (
                            value
                        )}
                    </p>

                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                        {subtitle}
                    </p>

                </div>

                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.icon}`}
                >
                    {icon}
                </div>

            </div>

        </div>
    );
}

/* =========================================================
   CHART HEADER
========================================================= */

function ChartHeader({
    icon,
    title,
    description,
}) {
    return (
        <div className="flex items-start gap-3">

            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                {icon}
            </div>

            <div>
                <h3 className="text-sm font-bold text-slate-900">
                    {title}
                </h3>

                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {description}
                </p>
            </div>

        </div>
    );
}

/* =========================================================
   CHART LOADING
========================================================= */

function ChartLoading() {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-2">
            <Loader2
                size={22}
                className="animate-spin text-blue-600"
            />

            <span className="text-xs text-slate-400 font-medium">
                Loading analytics...
            </span>
        </div>
    );
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart() {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <BarChart3
                size={28}
                className="text-slate-300"
            />

            <p className="text-xs text-slate-400 font-medium mt-2">
                No data available
            </p>
        </div>
    );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
    const normalizedStatus =
        status?.toLowerCase() || "created";

    const label =
        STATUS_LABELS[normalizedStatus] ||
        normalizedStatus.replace(/_/g, " ");

    const color =
        STATUS_COLORS[normalizedStatus] ||
        "#64748B";

    return (
        <span
            className="status-badge inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wide border"
            style={{
                color,
                backgroundColor: `${color}15`,
                borderColor: `${color}30`,
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                    backgroundColor: color,
                }}
            />

            {label}
        </span>
    );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

function formatTableDate(date) {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

function getInitials(name) {
    if (!name) return "CU";

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
}