import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    FiSearch,
    FiFilter,
    FiLoader,
    FiFileText
} from "react-icons/fi";

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

import api from "../../config/api";

// ---------------- STATUS BADGE ----------------
const getStatusBadge = (status) => {
    const base = "font-medium border px-2.5 py-0.5 rounded-full capitalize";
    const s = status?.toLowerCase() || "created";

    switch (s) {
        case "created":
        case "open_for_bids":
            return (
                <Badge className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>
                    {s.replace(/_/g, " ")}
                </Badge>
            );
        case "bid_accepted":
        case "driver_assigned":
            return (
                <Badge className={`${base} bg-indigo-50 text-indigo-700 border-indigo-200`}>
                    {s.replace(/_/g, " ")}
                </Badge>
            );
        case "in_transit":
            return (
                <Badge className={`${base} bg-orange-50 text-orange-700 border-orange-200`}>
                    In Transit
                </Badge>
            );
        case "completed":
            return (
                <Badge className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>
                    Completed
                </Badge>
            );
        default:
            return <Badge variant="secondary" className={base}>{s}</Badge>;
    }
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
                                    <TableHead>Order</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filtered.map((order) => (
                                    <TableRow key={order.order_id}>

                                        {/* ORDER */}
                                        <TableCell>
                                            <div>
                                                <p className="font-bold text-[#1E40AF]">
                                                    {order.order_reference}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    #{order.order_id}
                                                </p>
                                            </div>
                                        </TableCell>

                                        {/* ROUTE */}
                                        <TableCell>
                                            {order.pickup_state} - {order.destination_state}
                                        </TableCell>

                                        {/* STATUS */}
                                        <TableCell>
                                            {getStatusBadge(order.current_status)}
                                        </TableCell>

                                        {/* ACTIONS */}
                                        <TableCell className="text-right space-x-2">

                                            {/* VIEW DETAILS */}
                                            <Link to={`/orders/${order.order_id}`}>
                                                <Button size="sm" variant="outline">
                                                    View
                                                </Button>
                                            </Link>

                                            {/* BIDS */}
                                            <Link to={`/orders/${order.order_id}/bids`}>
                                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                                    Bids
                                                </Button>
                                            </Link>

                                            {/* DOCUMENTS */}
                                            <Link to={`/orders/${order.order_id}/documents`}>
                                                <Button size="sm" variant="secondary">
                                                    <FiFileText className="mr-1" />
                                                    Docs
                                                </Button>
                                            </Link>

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