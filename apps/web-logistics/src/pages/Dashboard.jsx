import { useNavigate } from "react-router-dom";
import {
    Package,
    Truck,
    Clipboard,
    AlertTriangle,
    ArrowRight,
    Activity,
    Calendar
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ✅ TEMP DATA
const importOrders = [{ id: 101 }, { id: 102 }];

const exportOrders = [
    { id: "EXP-2401", vehicle: "Truck A-442", driver: "John Perera", status: "In Transit", date: "Oct 24" },
    { id: "EXP-2402", vehicle: "Truck B-901", driver: "Mike Silva", status: "Pending", date: "Oct 25" },
    { id: "EXP-2403", vehicle: "Truck C-112", driver: "Alex Fernando", status: "Delivered", date: "Oct 23" },
];

export default function Dashboard() {
    const navigate = useNavigate();

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const cards = [
        {
            label: "Import Orders",
            count: importOrders.length,
            icon: Package,
            color: "text-blue-600",
            border: "border-t-blue-600",
        },
        {
            label: "Export Orders",
            count: exportOrders.length,
            icon: Truck,
            color: "text-emerald-600",
            border: "border-t-emerald-600",
        },
        {
            label: "Pending Requests",
            count: 5,
            icon: Clipboard,
            color: "text-orange-600",
            border: "border-t-orange-600",
        },
        {
            label: "Clearance Issues",
            count: 2,
            icon: AlertTriangle,
            color: "text-red-600",
            border: "border-t-red-600",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-8">

            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Dashboard Overview
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Welcome back, <span className="text-[#1E40AF]">Binuwara</span> • Monitoring logistics flow
                    </p>
                </div>

                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                    <Calendar size={16} className="text-[#1E40AF]" />
                    {today}
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                </div>
            </div>

            {/* --- Stats Cards --- */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card
                        key={card.label}
                        className={`border-t-4 ${card.border} border-x-slate-200 border-b-slate-200 shadow-sm hover:shadow-md transition-shadow`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {card.label}
                            </CardTitle>
                            <card.icon className={`h-5 w-5 ${card.color} opacity-80`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{card.count}</div>
                            <p className="text-xs text-slate-400 mt-1">+12% from last month</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* --- Main Table Section --- */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#EFF6FF] rounded-lg">
                            <Activity className="h-5 w-5 text-[#1E40AF]" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-slate-800">Recent Logistics Activity</CardTitle>
                            <p className="text-xs text-slate-500">Latest updates from your export fleet</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-[#1E40AF] border-blue-100 hover:bg-blue-50">
                        View All
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[120px] font-semibold text-slate-700">Order ID</TableHead>
                                <TableHead className="font-semibold text-slate-700">Category</TableHead>
                                <TableHead className="font-semibold text-slate-700">Details</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {exportOrders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    className="hover:bg-slate-50/80 transition-colors group"
                                >
                                    <TableCell className="font-bold text-sm text-[#1E40AF]">
                                        {order.id}
                                    </TableCell>

                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 px-2 py-0.5">
                                            Export
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">{order.vehicle}</span>
                                            <span className="text-xs text-slate-500">{order.driver}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-500' :
                                                order.status === 'In Transit' ? 'bg-amber-500' : 'bg-slate-300'
                                                }`} />
                                            <span className="text-sm font-medium text-slate-600">{order.status}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1E40AF]"
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                        >
                                            Details <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {exportOrders.length === 0 && (
                        <div className="py-12 text-center text-slate-400 italic">
                            No recent logistics activity found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}