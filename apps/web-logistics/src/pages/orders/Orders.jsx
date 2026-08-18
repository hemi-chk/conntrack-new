import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    FiSearch,
    FiFilter,
    FiLoader,
    FiFileText
} from "react-icons/fi";

// Shadcn components
import {
    Card,
    CardContent,
    Button,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
} from "@/ui";

import api from "../../config/api";

// ---------------- STATUS BADGE ----------------
const getStatusBadge = (status) => {
    const base = "font-semibold border px-3 py-0.5 rounded-full capitalize text-xs bg-blue-50 text-blue-700 border-blue-200 shadow-sm";
    const s = status?.toLowerCase() || "created";
    const displayName = s.replace(/_/g, " ");

    return (
        <Badge className={base}>
            {displayName}
        </Badge>
    );
};

// ---------------- MAIN COMPONENT ----------------
export default function OrdersPage({ title, type }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get(`/logistics/orders?type=${type}`);
                setOrders(res.data || []);
            } catch (err) {
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [type]);

    const filtered = orders.filter((o) => {
        const ref = o.order_reference || "";
        const status = o.current_status || "created";

        return (
            ref.toLowerCase().includes(search.toLowerCase()) &&
            (statusFilter === "All" || status === statusFilter)
        );
    });

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

            {/* HEADER */}
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

            {/* FILTERS */}
            <div className="flex gap-4">
                <Input
                    placeholder="Search order..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </div>

            {/* TABLE */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-10 text-center">
                            <FiLoader className="animate-spin mx-auto" size={28} />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Order</TableHead>
                                    <TableHead className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Route</TableHead>
                                    <TableHead className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                                    <TableHead className="pr-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filtered.map((order) => (
                                    <TableRow key={order.order_id} className="hover:bg-slate-50/50 transition-colors">

                                        {/* ORDER */}
                                        <TableCell className="pl-6 py-4">
                                            <div>
                                                <p className="font-semibold text-[#1E40AF]">
                                                    {order.order_reference}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    #{order.order_id}
                                                </p>
                                            </div>
                                        </TableCell>

                                        {/* ROUTE */}
                                        <TableCell className="px-4 py-4 text-sm font-medium text-slate-600">
                                            {order.pickup_state} - {order.destination_state}
                                        </TableCell>

                                        {/* STATUS */}
                                        <TableCell className="px-4 py-4">
                                            {getStatusBadge(order.current_status)}
                                        </TableCell>

                                        {/* ACTIONS */}
                                        <TableCell className="pr-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* VIEW DETAILS */}
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link to={`/orders/${order.order_id}`}>
                                                        View
                                                    </Link>
                                                </Button>

                                                {/* BIDS */}
                                                <Button size="sm" variant="outline" asChild className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                                    <Link to={`/orders/${order.order_id}/bids`}>
                                                        Bids
                                                    </Link>
                                                </Button>

                                                {/* DOCUMENTS */}
                                                <Button size="sm" variant="outline" asChild className="text-slate-700 border-slate-200 hover:bg-slate-50">
                                                    <Link to={`/orders/${order.order_id}/documents`}>
                                                        <FiFileText className="mr-1" />
                                                        Docs
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
