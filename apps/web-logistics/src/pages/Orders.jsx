import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiSearch, FiFilter } from "react-icons/fi";

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

// 🎨 Refined Status Badges
const getStatusBadge = (status) => {
    const baseStyles = "font-medium border px-2.5 py-0.5 rounded-full";
    switch (status) {
        case "BIDDING_OPEN":
            return (
                <Badge className={`${baseStyles} bg-blue-50 text-blue-700 border-blue-200`}>
                    Bidding Open
                </Badge>
            );
        case "SUPPLIER_SELECTED":
            return (
                <Badge className={`${baseStyles} bg-[#EFF6FF] text-[#1E40AF] border-blue-200`}>
                    Supplier Selected
                </Badge>
            );
        case "IN_PROGRESS":
            return (
                <Badge className={`${baseStyles} bg-orange-50 text-orange-700 border-orange-200`}>
                    In Progress
                </Badge>
            );
        case "COMPLETED":
            return (
                <Badge className={`${baseStyles} bg-emerald-50 text-emerald-700 border-emerald-200`}>
                    Completed
                </Badge>
            );
        default:
            return <Badge variant="secondary" className={baseStyles}>Unknown</Badge>;
    }
};

export default function OrdersPage({ title, type }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const orders = [
        { id: "ORD-001", type: "import", vehicle: "20ft Container", driver: null, current_status: "BIDDING_OPEN" },
        { id: "ORD-002", type: "export", vehicle: "40ft Container", driver: "John Silva", current_status: "SUPPLIER_SELECTED" },
        { id: "ORD-003", type: "import", vehicle: "Trailer", driver: "Kasun", current_status: "IN_PROGRESS" },
        { id: "ORD-004", type: "export", vehicle: "Mini Truck", driver: "Nimal", current_status: "COMPLETED" },
    ];

    const filteredData = orders.filter((order) => {
        const matchesType = order.type === type;
        const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || order.current_status === statusFilter;
        return matchesType && matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-slate-50/30 p-6 space-y-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                    <p className="text-sm text-slate-500 font-medium">
                        Managing {filteredData.length} active <span className="capitalize">{type}</span> logs
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[240px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder={`Search by ID (e.g. ORD-001)...`}
                            className="pl-10 border-slate-200 focus-visible:ring-[#1E40AF]"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <FiFilter className="text-slate-400" size={18} />
                        <Select onValueChange={setStatusFilter} defaultValue="All">
                            <SelectTrigger className="w-[180px] border-slate-200">
                                <SelectValue placeholder="Status Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="BIDDING_OPEN">Bidding</SelectItem>
                                <SelectItem value="SUPPLIER_SELECTED">Supplier Selected</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table Section */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow>
                            <TableHead className="w-[150px] font-bold text-slate-700">ORDER ID</TableHead>
                            <TableHead className="font-bold text-slate-700">VEHICLE & OPERATOR</TableHead>
                            <TableHead className="font-bold text-slate-700 text-center">CURRENT STATUS</TableHead>
                            <TableHead className="text-right font-bold text-slate-700 pr-6">ACTION</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredData.map((order) => (
                            <TableRow key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                                <TableCell className="font-bold text-[#1E40AF] py-4">
                                    #{order.id}
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-800">{order.vehicle}</span>
                                        <span className="text-xs text-slate-500 font-medium italic">
                                            {order.driver || "Pending Assignment"}
                                        </span>
                                    </div>
                                </TableCell>

                                <TableCell className="text-center">
                                    {getStatusBadge(order.current_status)}
                                </TableCell>

                                <TableCell className="text-right pr-6">
                                    <Link to={`/orders/${order.id}`}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-slate-200 text-slate-600 hover:text-[#1E40AF] hover:bg-[#EFF6FF] hover:border-[#1E40AF]/30 group-hover:shadow-sm"
                                        >
                                            View Logs
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
                        <div className="p-4 bg-slate-50 rounded-full mb-3">
                            <FiSearch className="text-slate-300" size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No logistics records match your current filters.</p>
                        <Button
                            variant="link"
                            className="text-[#1E40AF] mt-1"
                            onClick={() => { setSearch(""); setStatusFilter("All"); }}
                        >
                            Reset all filters
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}