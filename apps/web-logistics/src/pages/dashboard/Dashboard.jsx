import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package, Truck, AlertTriangle,
    ArrowRight, Activity, Calendar, Loader2, RefreshCcw, CheckCircle2, Navigation,
    Eye
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import api from "../../config/api";

export default function Dashboard() {
    const navigate = useNavigate();

    const [data, setData] = useState({
        importOrdersCount: 0,
        exportOrdersCount: 0,
        recentActivity: [],
        stats: { inTransitCount: 0, completedOrders: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get("/logistics/dashboard-summary");
            const result = response.data;

            setData({
                importOrdersCount: result?.importOrdersCount ?? 0,
                exportOrdersCount: result?.exportOrdersCount ?? 0,
                recentActivity: result?.recentActivity || [],
                stats: {
                    inTransitCount: result?.stats?.inTransitCount ?? 0,
                    completedOrders: result?.stats?.completedOrders ?? 0
                }
            });
        } catch (err) {
            console.error("Dashboard Load Error:", err);
            const errorMessage = err.response?.data?.message || "Failed to sync with logistics server";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const cards = [
        { label: "Import Orders", count: data.importOrdersCount, icon: Package, color: "text-blue-600", border: "border-t-blue-600" },
        { label: "Export Orders", count: data.exportOrdersCount, icon: Truck, color: "text-emerald-600", border: "border-t-emerald-600" },
        { label: "In Transit", count: data.stats.inTransitCount, icon: Truck, color: "text-amber-500", border: "border-t-amber-500" },
        { label: "Completed Deliveries", count: data.stats.completedOrders, icon: CheckCircle2, color: "text-indigo-600", border: "border-t-indigo-600" },
    ];

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-[#1E40AF]" />
                <p className="text-sm font-medium text-slate-500 animate-pulse">Syncing fleet data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="p-4 bg-red-50 rounded-full"><AlertTriangle className="h-10 w-10 text-red-600" /></div>
                <div className="text-center">
                    <h2 className="text-lg font-bold text-slate-900">Connection Failed</h2>
                    <p className="text-sm text-slate-500 max-w-xs">{error}</p>
                </div>
                <Button onClick={loadDashboard} variant="outline" className="gap-2"><RefreshCcw size={16} /> Retry Connection</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Logistics Overview</h1>
                    <p className="text-sm text-slate-500 font-medium">Welcome back, <span className="text-[#1E40AF]">Binuwara</span></p>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                    <Calendar size={16} className="text-[#1E40AF]" />
                    {today}
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.label} className={`border-t-4 ${card.border} border-x-slate-200 border-b-slate-200 shadow-sm hover:shadow-md transition-all`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.label}</CardTitle>
                            <card.icon className={`h-5 w-5 ${card.color} opacity-80`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{card.count ?? 0}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#EFF6FF] rounded-lg">
                            <Activity className="h-5 w-5 text-[#1E40AF]" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-slate-800">Recent Activity</CardTitle>

                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold">Order ID</TableHead>
                                <TableHead className="font-semibold">Reference</TableHead>
                                <TableHead className="font-semibold">Type</TableHead>
                                <TableHead className="font-semibold">Asset / Driver</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.recentActivity?.length > 0 ? (
                                data.recentActivity.map((order) => (
                                    <TableRow key={order.order_id} className="hover:bg-slate-50/80 group">
                                        <TableCell className="font-medium text-slate-500 text-xs">
                                            #{order.order_id}
                                        </TableCell>
                                        <TableCell className="font-bold text-[#1E40AF]">
                                            {order.order_reference || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={order.order_type === 'import'
                                                    ? "bg-purple-50 text-purple-700 border-purple-100"
                                                    : "bg-blue-50 text-blue-700 border-blue-100"}
                                            >
                                                {(order.order_type || "Unknown").toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-700">{order.vehicle_number || "Unassigned"}</span>
                                                <span className="text-xs text-slate-500">{order.driver_name || "No driver assigned"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${order.current_status === 'completed' ? 'bg-emerald-500' :
                                                    order.current_status === 'in_transit' ? 'bg-blue-500' :
                                                        order.current_status === 'at_port' ? 'bg-amber-500' : 'bg-slate-300'
                                                    }`} />
                                                <span className="text-sm font-medium capitalize text-slate-600">{(order.current_status || "pending").replace('_', ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="transition-all hover:bg-blue-50 text-[#1E40AF] gap-2 border-blue-200"
                                                onClick={() => navigate(`/orders/${order.order_id}`)}
                                            >
                                                <Package size={14} /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Package className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="italic">No active logistics records found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}