import { useState, useEffect, useMemo } from "react";
import { Printer, FileBarChart, Loader2, PackageCheck, User, TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input } from "@/ui";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

// Import the centralized axios instance
import api from "../../config/api";

const STATUS_COLORS = {
    completed: '#10B981',
    in_transit: '#3B82F6',
    pending: '#F59E0B',
    bid_accepted: '#8B5CF6',
    cancelled: '#EF4444'
};

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
            const response = await api.get("/logistics/reports", {
                params: { fromDate, toDate }
            });

            const { orders, stats } = response.data;
            setOrders(orders || []);
            setStats(stats || { total: 0, completedCount: 0, imports: 0, exports: 0 });
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            console.error("Logistics API Error:", errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const handlePrint = () => window.print();

    // Derived Data for Charts
    const statusChartData = useMemo(() => {
        const counts = {};
        orders.forEach(order => {
            const statusKey = order.current_status || 'pending';
            counts[statusKey] = (counts[statusKey] || 0) + 1;
        });
        return Object.keys(counts).map(status => ({
            name: status.replace('_', ' ').toUpperCase(),
            count: counts[status],
            statusKey: status
        }));
    }, [orders]);

    const orderTypeChartData = useMemo(() => {
        let imports = 0;
        let exports = 0;
        let other = 0;
        orders.forEach(order => {
            const type = order.order_type?.toLowerCase();
            if (type === 'import') imports++;
            else if (type === 'export') exports++;
            else other++;
        });
        return [
            { name: 'Imports', value: imports, color: '#1E40AF' },
            { name: 'Exports', value: exports, color: '#3B82F6' },
            ...(other > 0 ? [{ name: 'Other', value: other, color: '#64748B' }] : [])
        ];
    }, [orders]);

    const destinationChartData = useMemo(() => {
        const destinations = {};
        orders.forEach(order => {
            const dest = order.destination_state || 'Unknown';
            destinations[dest] = (destinations[dest] || 0) + 1;
        });
        return Object.keys(destinations)
            .map(dest => ({ name: dest, shipments: destinations[dest] }))
            .sort((a, b) => b.shipments - a.shipments)
            .slice(0, 6);
    }, [orders]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Print specific styles — preserve printable charts & table */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { 
                        margin: 12mm 10mm;
                        size: portrait;
                    }

                    nav, aside, .no-print { display: none !important; }
                    main { margin-left: 0 !important; padding-top: 0 !important; }

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

                    /* Ensures SVG graphics, Recharts bars/lines/pies survive printing in full color */
                    .printable-report svg, 
                    .printable-report .recharts-wrapper, 
                    .printable-report .chart-card {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        break-inside: avoid !important;
                    }

                    .printable-report * {
                        overflow: visible !important;
                    }

                    .chart-grid {
                        display: grid !important;
                        grid-template-cols: repeat(3, 1fr) !important;
                        gap: 12px !important;
                        margin-bottom: 20px !important;
                    }

                    .chart-card {
                        border: 1px solid #cbd5e1 !important;
                        border-radius: 10px !important;
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

                    .print-table col.col-order   { width: 12% !important; }
                    .print-table col.col-customer{ width: 26% !important; }
                    .print-table col.col-route   { width: 28% !important; }
                    .print-table col.col-date    { width: 14% !important; }
                    .print-table col.col-status  { width: 20% !important; }

                    .print-table thead {
                        border-bottom: 2px solid #000 !important;
                    }

                    .print-table tr {
                        border-bottom: 1px solid #d4d4d4 !important;
                        break-inside: avoid !important;
                    }

                    .stat-card {
                        border: 1px solid #000 !important;
                        break-inside: avoid;
                    }

                    .status-badge {
                        border: 1px solid #000 !important;
                        font-weight: 700 !important;
                        font-size: 7.5px !important;
                        white-space: nowrap !important;
                    }
                }
            `}} />

            <div className="printable-report p-6 max-w-7xl mx-auto space-y-6">
                {/* Professional Print Header */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Logistics Operations & Analytics Report</h1>
                            <p className="text-slate-500 text-xs font-medium mt-0.5">ConnTrack Integrated Logistics System</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Report Status</p>
                            <p className="text-xs font-bold uppercase text-blue-900">Official Executive Summary</p>
                        </div>
                    </div>
                    <div className="flex justify-between mt-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        <span>Period: {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}</span>
                        <span>Generated: {new Date().toLocaleString()}</span>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-xl">
                            <FileBarChart className="text-[#1E40AF]" size={26} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Logistics Analytics & Reports</h1>
                            <p className="text-xs text-slate-500 font-medium">Visual trend charts, operational metrics, and printable table manifest</p>
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
                        <Button onClick={handlePrint} className="bg-[#1E40AF] hover:bg-blue-800 text-white gap-2 font-bold shadow-md shadow-blue-200">
                            <Printer size={16} /> Print Full Report
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

                {/* CHARTS & GRAPHICS SECTION */}
                <div className="chart-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Graph 1: Order Status Distribution */}
                    <div className="chart-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <BarChart3 size={16} className="text-[#1E40AF]" />
                                    OrderStatus Distribution
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">Breakdown by fulfillment state</p>
                            </div>
                        </div>
                        <div className="h-52 w-full">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} stroke="#64748B" />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 9 }} stroke="#64748B" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                                            cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {statusChartData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={STATUS_COLORS[entry.statusKey] || '#1E40AF'} 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Graph 2: Import vs Export Ratio */}
                    <div className="chart-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <PieIcon size={16} className="text-[#1E40AF]" />
                                    Import vs Export Ratio
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">Shipment direction breakdown</p>
                            </div>
                        </div>
                        <div className="h-52 w-full flex items-center justify-center">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={orderTypeChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {orderTypeChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={30} 
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Graph 3: Top Freight Destinations */}
                    <div className="chart-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-[#1E40AF]" />
                                    Top Freight Destinations
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">Primary delivery state destinations</p>
                            </div>
                        </div>
                        <div className="h-52 w-full">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={destinationChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} stroke="#64748B" />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 9 }} stroke="#64748B" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="shipments" stroke="#1E40AF" strokeWidth={2} fillOpacity={1} fill="url(#colorShipments)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                </div>

                {/* Data Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden print-table">
                    <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Detailed Logistics Manifest Table</h3>
                        <span className="text-[11px] font-mono text-slate-400">Total Records: {orders.length}</span>
                    </div>
                    <Table>
                        <colgroup>
                            <col className="col-order" />
                            <col className="col-customer" />
                            <col className="col-route" />
                            <col className="col-date" />
                            <col className="col-status" />
                        </colgroup>
                        <TableHeader className="bg-slate-50/80">
                            <TableRow>
                                <TableHead className="px-4 py-3 font-bold text-slate-700">Order ID</TableHead>
                                <TableHead className="font-bold text-slate-700">Customer & Reference</TableHead>
                                <TableHead className="font-bold text-slate-700">Route Details</TableHead>
                                <TableHead className="font-bold text-slate-700">Date</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
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
                <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-200">
                    <div className="space-y-8">
                        <div className="border-b border-slate-300 w-full h-10"></div>
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800">Authorized Signature</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase">Logistics Manager / Department Head</p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="border-b border-slate-300 w-full h-10"></div>
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
        <div className="stat-card bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
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