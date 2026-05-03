import { useState, useEffect, useMemo } from "react";
import {
    Printer,
    FileBarChart,
    Loader2,
    CheckCircle2,
    PackageCheck,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { supabase } from "@/config/supabase";

export default function ReportsPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState("2026-01-01");
    const [toDate, setToDate] = useState("2026-12-31");

    useEffect(() => {
        fetchReportData();
    }, [fromDate, toDate]);

    async function fetchReportData() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .gte('created_at', `${fromDate}T00:00:00Z`)
                .lte('created_at', `${toDate}T23:59:59Z`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error("Supabase Fetch Error:", err.message);
        } finally {
            setLoading(false);
        }
    }

    // Analytics calculations
    const stats = useMemo(() => {
        const total = orders.length;
        const completedCount = orders.filter(o => o.current_status?.toLowerCase() === 'completed').length;
        const imports = orders.filter(o => o.order_type?.toLowerCase() === 'import').length;
        const exports = orders.filter(o => o.order_type?.toLowerCase() === 'export').length;
        const percentage = total > 0 ? ((completedCount / total) * 100).toFixed(1) : "0";

        return { total, completedCount, imports, exports, percentage };
    }, [orders]);

    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .printable-report, .printable-report * { visibility: visible; }
                    .printable-report { position: absolute; left: 0; top: 0; width: 100% !important; }
                    .no-print { display: none !important; }
                    .print-table { page-break-inside: auto; }
                    .print-table tr { page-break-inside: avoid; page-break-after: auto; }
                    @page { size: A4 landscape; margin: 15mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}} />

            <div className="printable-report p-6 max-w-7xl mx-auto space-y-6">
                {/* Professional Header - Print Only */}
                <div className="hidden print:block border-b-4 border-[#1E40AF] pb-6 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-5xl font-black text-[#1E40AF] tracking-tight mb-2">
                                CONNTRACK LOGISTICS
                            </h1>
                            <p className="text-sm uppercase tracking-[0.3em] font-bold text-slate-600">
                                Operational Performance Report
                            </p>
                            <div className="mt-4 text-xs text-slate-600 space-y-1">
                                <p><span className="font-bold">Period:</span> {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}</p>
                                <p><span className="font-bold">Total Records:</span> {stats.total} Orders</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-slate-100 px-4 py-3 rounded-lg">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                                    Report Generated
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {new Date().toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                                <p className="text-[10px] font-mono text-slate-500 mt-2">
                                    REF: REPT-{new Date().getFullYear()}-{String(orders.length).padStart(4, '0')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Header - Screen Only */}
                <div className="no-print">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        {/* Left Section */}
                        <div className="flex items-center gap-4">
                            <div className="bg-[#1E40AF] p-3 rounded-lg">
                                <FileBarChart size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Reports & Analytics
                                </h1>
                                <p className="text-slate-600 text-sm">
                                    Performance metrics and insights
                                </p>
                            </div>
                        </div>

                        {/* Right Section - Date Picker & Print */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Date Range Picker */}
                            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg">
                                <Calendar size={16} className="text-slate-400 ml-2" />
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="border-none bg-transparent h-8 text-xs font-medium focus-visible:ring-0"
                                />
                                <span className="text-slate-400">→</span>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="border-none bg-transparent h-8 text-xs font-medium focus-visible:ring-0"
                                />
                            </div>

                            {/* Print Button */}
                            <Button
                                onClick={handlePrint}
                                className="bg-[#1E40AF] text-white font-medium px-6"
                            >
                                <Printer size={16} className="mr-2" />
                                Print Report
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Simple Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Orders */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">
                            Total Orders
                        </p>
                        <h2 className="text-3xl font-bold text-slate-900">
                            {loading ? "..." : stats.total}
                        </h2>
                    </div>

                    {/* Completed Orders */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <p className="text-xs font-medium text-emerald-600 uppercase mb-2 flex items-center gap-1">
                            <PackageCheck size={12} />
                            Completed
                        </p>
                        <h2 className="text-3xl font-bold text-emerald-600">
                            {loading ? "..." : stats.completedCount}
                        </h2>
                    </div>

                    {/* Import Orders */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <p className="text-xs font-medium text-blue-600 uppercase mb-2">
                            Import Orders
                        </p>
                        <h2 className="text-3xl font-bold text-blue-600">
                            {loading ? "..." : stats.imports}
                        </h2>
                    </div>

                    {/* Export Orders */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <p className="text-xs font-medium text-indigo-600 uppercase mb-2">
                            Export Orders
                        </p>
                        <h2 className="text-3xl font-bold text-indigo-600">
                            {loading ? "..." : stats.exports}
                        </h2>
                    </div>

                    {/* Success Rate */}
                    <div className="bg-slate-900 text-white rounded-lg p-4">
                        <p className="text-xs font-medium text-slate-400 uppercase mb-2">
                            Success Rate
                        </p>
                        <h2 className="text-3xl font-bold text-white">
                            {loading ? "..." : `${stats.percentage}%`}
                        </h2>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden print-table">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 uppercase">
                            Detailed Order Records
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                            {loading ? "Loading..." : `${orders.length} orders in selected period`}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="border-b border-slate-200">
                                    <TableHead className="font-semibold text-slate-900 text-xs px-6 py-3">
                                        ID
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-xs px-4 py-3">
                                        Reference / Type
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-xs px-4 py-3">
                                        Pickup Location
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-xs px-4 py-3">
                                        Destination
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-xs px-4 py-3">
                                        Created Date
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-xs px-4 py-3 text-right">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="animate-spin text-[#1E40AF] h-8 w-8" />
                                                <p className="text-sm font-medium text-slate-600">
                                                    Loading report data...
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <FileBarChart className="h-12 w-12 text-slate-300" />
                                                <p className="text-sm font-medium text-slate-500">
                                                    No records found for this period
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Try adjusting the date range
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order, index) => (
                                        <TableRow
                                            key={order.order_id}
                                            className={`hover:bg-slate-50 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                                }`}
                                        >
                                            <TableCell className="px-6 text-slate-500 font-mono text-xs">
                                                #{String(order.order_id).padStart(4, '0')}
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <div className="font-semibold text-[#1E40AF] text-sm">
                                                    {order.order_reference || 'N/A'}
                                                </div>
                                                <div className="inline-flex items-center mt-1">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${order.order_type?.toLowerCase() === 'import'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-indigo-100 text-indigo-700'
                                                        }`}>
                                                        {order.order_type}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <div className="text-xs font-medium text-slate-700">
                                                    {order.pickup_state || '—'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {order.pickup_country || '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <div className="text-xs font-medium text-slate-700">
                                                    {order.destination_state || '—'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {order.destination_country || '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <div className="text-xs text-slate-600">
                                                    {new Date(order.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium uppercase ${order.current_status?.toLowerCase() === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : order.current_status?.toLowerCase() === 'in_progress'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {order.current_status?.replace('_', ' ') || 'Pending'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer with Signatures - Print Only */}
                <div className="hidden print:block mt-16 pt-8 border-t-2 border-slate-200">
                    <div className="grid grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="border-t-2 border-slate-900 pt-4 mt-16">
                                <p className="text-xs font-bold uppercase text-slate-900">
                                    Prepared By
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Logistics Team</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-slate-900 pt-4 mt-16">
                                <p className="text-xs font-bold uppercase text-slate-900">
                                    Authorized Signature
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Operations Manager</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-slate-900 pt-4 mt-16">
                                <p className="text-xs font-bold uppercase text-slate-900">
                                    Official Seal
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Company Stamp</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 text-center text-xs text-slate-400">
                        <p>This is a computer-generated report from ConnTrack Logistics System</p>
                        <p className="mt-1">For queries, please contact: support@conntrack.com | +1 (555) 123-4567</p>
                    </div>
                </div>
            </div>
        </div>
    );
}