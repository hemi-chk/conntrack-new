import { useState, useEffect } from "react";
import { Printer, FileBarChart, Loader2, PackageCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

// Import the centralized axios instance
import api from "../../config/api";

export default function Reports() {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ total: 0, completedCount: 0, imports: 0, exports: 0, successRate: 0 });
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
            {/* Print specific styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    nav, aside, .no-print { display: none !important; }
                    main { margin-left: 0 !important; padding-top: 0 !important; }
                    .printable-report { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; background: white !important; }
                    .print-table { border: 1px solid #e2e8f0 !important; border-radius: 0 !important; }
                    body { background: white !important; }
                    .stat-card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
                    .efficiency-card { background: #f8fafc !important; color: #0f172a !important; border: 1px solid #e2e8f0 !important; }
                    .efficiency-card p, .efficiency-card h2 { color: #0f172a !important; }
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
                            <p className="text-sm font-bold text-emerald-600 uppercase">Official Document</p>
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
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                    <div className="efficiency-card bg-slate-900 text-white rounded-lg p-4 shadow-md">
                        <p className="text-xs font-medium text-slate-400 uppercase mb-2 text-center">Efficiency Rate</p>
                        <h2 className="text-3xl font-bold text-center">{loading ? "..." : `${stats.successRate}%`}</h2>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden print-table">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="px-6 py-4 font-bold text-slate-700">Order ID</TableHead>
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
                                        <TableCell className="px-6 font-mono text-xs text-slate-500 uppercase">
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
                                        <TableCell className="text-xs text-slate-600">
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
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${isCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
            isPending ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
            {status?.replace('_', ' ') || 'Pending'}
        </span>
    );
}