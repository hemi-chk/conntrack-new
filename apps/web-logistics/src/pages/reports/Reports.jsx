import { useState, useEffect } from "react";
import { Printer, FileBarChart, Loader2, PackageCheck, User } from "lucide-react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input } from "@/ui";

// Import the centralized axios instance
import api from "../../config/api";

export default function Reports() {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ total: 0, completedCount: 0, imports: 0, exports: 0 });
    const [loading, setLoading] = useState(true);

    // Dates set to the current project year context (2026)
    const [fromDate, setFromDate] = useState("2026-01-01");
    const [toDate, setToDate] = useState("2026-12-31");

    useEffect(() => {
        fetchReportData();
    }, [fromDate, toDate]);

    async function fetchReportData() {
        setLoading(true);
        try {
            // Axios 'params' handles the ?fromDate=...&toDate=... string for you
            const response = await api.get("/logistics/reports", {
                params: { fromDate, toDate }
            });

            // Destructure data directly from the axios response
            const { orders, stats } = response.data;
            setOrders(orders);
            setStats(stats);
        } catch (err) {
            // Context-aware error handling for a smoother dev experience
            const errorMsg = err.response?.data?.message || err.message;
            console.error("Logistics API Error:", errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Print specific styles — true black & white, professional layout */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 18mm 14mm; }

                    nav, aside, .no-print { display: none !important; }
                    main { margin-left: 0 !important; padding-top: 0 !important; }

                    body {
                        background: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .printable-report {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        background: #fff !important;
                        color: #000 !important;
                        /* Belt-and-suspenders: grayscale filter guarantees no color
                           survives printing even if a utility class ties in specificity
                           with the overrides below. */
                        filter: grayscale(1) contrast(1.15) !important;
                    }

                    /* Force everything inside the report to pure black-on-white so nothing
                       relies on color to be understood — only weight, borders, and case do. */
                    .printable-report * {
                        color: #000 !important;
                        background: #fff !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }

                    /* The shadcn Table wraps <table> in a scrolling div (overflow-auto).
                       On screen that gives a horizontal scrollbar; on paper there is no
                       scrollbar, so anything past the page edge was simply being clipped —
                       that's why Status/Date were disappearing. Force everything visible
                       and let the table shrink to the page width instead. */
                    .printable-report * {
                        overflow: visible !important;
                    }

                    .print-table {
                        border: 1px solid #000 !important;
                        border-radius: 0 !important;
                        width: 100% !important;
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
                        overflow-wrap: break-word !important;
                        white-space: normal !important;
                        line-height: 1.35 !important;
                    }

                    /* Order ID and Date are short, fixed-format values — keep them on
                       one line so row heights stay even down the whole table. Only the
                       naturally longer free-text columns (Customer, Route) may wrap. */
                    .print-table .print-nowrap {
                        white-space: nowrap !important;
                    }

                    /* Explicit proportional column widths so the five columns always
                       add up to the printable page width, never spill past it. */
                    .print-table col.col-order   { width: 10% !important; }
                    .print-table col.col-customer{ width: 24% !important; }
                    .print-table col.col-route   { width: 28% !important; }
                    .print-table col.col-date    { width: 15% !important; }
                    .print-table col.col-status  { width: 23% !important; }

                    .print-table thead {
                        border-bottom: 2px solid #000 !important;
                    }

                    .print-table tr {
                        border-bottom: 1px solid #d4d4d4 !important;
                    }

                    .stat-card {
                        border: 1px solid #000 !important;
                        break-inside: avoid;
                    }

                    .stat-card h2, .stat-card p {
                        color: #000 !important;
                    }

                    /* Status badges lose color in print, so shape/weight/border style
                       carry the distinction instead. */
                    .status-badge {
                        border: 1px solid #000 !important;
                        background: #fff !important;
                        color: #000 !important;
                        font-weight: 700 !important;
                        font-size: 7.5px !important;
                        white-space: nowrap !important;
                        letter-spacing: 0.02em !important;
                    }
                    .status-badge.is-completed {
                        background: #000 !important;
                        color: #fff !important;
                    }
                    .status-badge.is-pending {
                        border-style: dashed !important;
                    }
                }
            `}} />

            <div className="printable-report p-6 max-w-7xl mx-auto space-y-6">
                {/* Professional Print Header */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Logistics Operations Report</h1>
                            <p className="text-slate-500 font-medium mt-1">ConnTrack Integrated Logistics System</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Report Status</p>
                            <p className="text-sm font-bold uppercase">Official Document</p>
                        </div>
                    </div>
                    <div className="flex justify-between mt-8 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span>Period: {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}</span>
                        <span>Generated: {new Date().toLocaleString()}</span>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FileBarChart className="text-[#1E40AF]" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Logistics Reports</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-lg px-2 border border-slate-200">
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-transparent border-none shadow-none focus-visible:ring-0 text-xs w-32"
                            />
                            <span className="text-slate-400 text-xs">to</span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-transparent border-none shadow-none focus-visible:ring-0 text-xs w-32"
                            />
                        </div>
                        <Button onClick={handlePrint} variant="outline" className="gap-2">
                            <Printer size={16} /> Print
                        </Button>
                    </div>
                </div>

                {/* Statistics Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Orders" value={stats.total} loading={loading} />
                    <StatCard
                        title="Completed"
                        value={stats.completedCount}
                        color="text-emerald-600"
                        loading={loading}
                        icon={<PackageCheck size={12} />}
                    />
                    <StatCard title="Imports" value={stats.imports} color="text-blue-600" loading={loading} />
                    <StatCard title="Exports" value={stats.exports} color="text-indigo-600" loading={loading} />
                </div>

                {/* Data Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden print-table">
                    <Table>
                        <colgroup>
                            <col className="col-order" />
                            <col className="col-customer" />
                            <col className="col-route" />
                            <col className="col-date" />
                            <col className="col-status" />
                        </colgroup>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="px-4 py-4 font-bold text-slate-700">Order ID</TableHead>
                                <TableHead className="font-bold text-slate-700">Customer & Reference</TableHead>
                                <TableHead className="font-bold text-slate-700">Route Details</TableHead>
                                <TableHead className="font-bold text-slate-700">Date</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-[#1E40AF]" size={32} />
                                            <p className="text-slate-400 text-sm italic">Generating report data...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">
                                        No logistics data found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.order_id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="px-4 font-mono text-xs text-slate-500 uppercase print-nowrap">
                                            #{String(order.order_id).padStart(5, '0')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-slate-100 p-1 rounded">
                                                    <User size={12} className="text-slate-500" />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-800">{order.customer_name}</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-blue-600 mt-0.5">{order.order_reference}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-medium text-slate-700">
                                                {order.pickup_state} <span className="text-slate-300 mx-1">-</span> {order.destination_state}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider italic">{order.order_type}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600 print-nowrap">
                                            {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <StatusBadge status={order.current_status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Professional Signature Section */}
                <div className="hidden print:grid grid-cols-2 gap-12 mt-20 pt-10 border-t border-slate-200">
                    <div className="space-y-12">
                        <div className="border-b border-slate-300 w-full h-12"></div>
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">Authorized Signature</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase">Logistics Manager / Department Head</p>
                        </div>
                    </div>
                    <div className="space-y-12">
                        <div className="border-b border-slate-300 w-full h-12"></div>
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">Date of Approval</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase">Official Stamp Required</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable UI Components
function StatCard({ title, value, color = "text-slate-900", loading, icon }) {
    return (
        <div className="stat-card bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${color}`}>
                {icon} {title}
            </p>
            <h2 className={`text-3xl font-black ${color}`}>{loading ? "..." : value}</h2>
        </div>
    );
}

function StatusBadge({ status }) {
    const s = status?.toLowerCase();
    const isCompleted = s === 'completed';
    const isPending = s === 'pending';

    return (
        <span className={`status-badge px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${isCompleted ? 'is-completed bg-emerald-100 text-emerald-700 border border-emerald-200' :
            isPending ? 'is-pending bg-amber-100 text-amber-700 border border-amber-200' :
                'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
            {status?.replace('_', ' ') || 'Pending'}
        </span>
    );
}