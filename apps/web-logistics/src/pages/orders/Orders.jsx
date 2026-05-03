import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiSearch, FiFilter, FiLoader, FiAlertCircle, FiTruck, FiGlobe } from "react-icons/fi";

// Shadcn components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status) => {
    const baseStyles = "font-medium border px-2.5 py-0.5 rounded-full capitalize";
    const s = status?.toLowerCase() || "created";

    switch (s) {
        case "created":
        case "open_for_bids":
            return <Badge className={`${baseStyles} bg-blue-50 text-blue-700 border-blue-200`}>{s.replace(/_/g, ' ')}</Badge>;
        case "bid_accepted":
        case "driver_assigned":
            return <Badge className={`${baseStyles} bg-indigo-50 text-indigo-700 border-indigo-200`}>{s.replace(/_/g, ' ')}</Badge>;
        case "in_transit":
        case "at_freezone":
        case "at_port":
            return <Badge className={`${baseStyles} bg-orange-50 text-orange-700 border-orange-200`}>{s.replace(/_/g, ' ')}</Badge>;
        case "completed":
            return <Badge className={`${baseStyles} bg-emerald-50 text-emerald-700 border-emerald-200`}>Completed</Badge>;
        case "cancelled":
            return <Badge variant="destructive" className={baseStyles}>Cancelled</Badge>;
        default:
            return <Badge variant="secondary" className={baseStyles}>{s}</Badge>;
    }
};

export default function OrdersPage({ title, type }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`http://localhost:5000/api/logistics/orders?type=${type}`);
                if (!response.ok) throw new Error(`Server Error: ${response.status}`);
                const data = await response.json();
                setOrders(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching orders:", error);
                setError(error.message);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [type]);

    const filteredData = (orders || []).filter((order) => {
        const ref = order?.order_reference || "";
        const status = order?.current_status || "created";
        const matchesSearch = ref.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-slate-50/30 p-6 space-y-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                    <p className="text-sm text-slate-500 font-medium">
                        {loading ? "Syncing..." : `Showing ${filteredData.length} records`}
                    </p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[240px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search Reference (e.g., REF-001)..."
                            className="pl-10 border-slate-200 focus-visible:ring-[#1E40AF]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <FiFilter className="text-slate-400" size={18} />
                        <Select onValueChange={setStatusFilter} value={statusFilter}>
                            <SelectTrigger className="w-[180px] border-slate-200">
                                <SelectValue placeholder="Status Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="created">Created</SelectItem>
                                <SelectItem value="open_for_bids">Open for Bids</SelectItem>
                                <SelectItem value="in_transit">In Transit</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <FiLoader className="animate-spin text-[#1E40AF]" size={30} />
                        <p className="text-slate-500 text-sm font-medium">Accessing ConnTrack Database...</p>
                    </div>
                ) : error ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <FiAlertCircle className="text-red-500 mb-2" size={40} />
                        <h3 className="text-lg font-bold text-slate-900">Connection Failed</h3>
                        <p className="text-slate-500 max-w-xs">{error}</p>
                        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-700 px-6">REFERENCE</TableHead>
                                    <TableHead className="font-bold text-slate-700">ROUTE & CARGO</TableHead>
                                    <TableHead className="font-bold text-slate-700">TYPE</TableHead>
                                    <TableHead className="font-bold text-slate-700 text-center">STATUS</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 pr-6">ACTION</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((order) => (
                                    <TableRow key={order.order_id} className="hover:bg-blue-50/30 transition-colors group">
                                        <TableCell className="font-bold text-[#1E40AF] py-4 px-6">
                                            {order.order_reference || `ID: ${order.order_id}`}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                                    <span>{order.pickup_state || order.pickup_country}</span>
                                                    <FiArrowRight size={12} className="text-slate-400" />
                                                    <span>{order.destination_state || order.destination_country}</span>
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {order.cargo_type} • {order.cargo_weight ? `${order.cargo_weight}kg` : "Weight N/A"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="w-fit text-[10px] py-0 border-slate-300">
                                                    {order.vehicle_type}
                                                </Badge>
                                                <span className="text-xs text-slate-400 font-mono">
                                                    {order.container_no || "No Container"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(order.current_status)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Link to={`/orders/${order.order_id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-200 text-slate-600 hover:text-[#1E40AF] hover:bg-[#EFF6FF] hover:border-[#1E40AF]/30"
                                                >
                                                    Details
                                                    <FiArrowRight className="ml-2 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredData.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center">
                                <FiSearch className="text-slate-200 mb-2" size={40} />
                                <p className="text-slate-500 font-medium">No {type} orders found.</p>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}