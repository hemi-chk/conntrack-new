import { useNavigate } from "react-router-dom";
import { Package, Truck, Clipboard, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ✅ TEMP DUMMY DATA (replace later with real data)
const importOrders = [
    { id: 101 },
    { id: 102 },
];

const exportOrders = [
    { id: 1, vehicle: "Truck A", driver: "John", status: "Pending" },
    { id: 2, vehicle: "Truck B", driver: "Mike", status: "In Transit" },
    { id: 3, vehicle: "Truck C", driver: "Alex", status: "Delivered" },
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
        { label: "Import Orders", count: importOrders.length, icon: Package, color: "text-primary" },
        { label: "Export Orders", count: exportOrders.length, icon: Truck, color: "text-green-500" },
        { label: "Requests", count: 5, icon: Clipboard, color: "text-yellow-500" },
        { label: "Clearance Issues", count: 2, icon: AlertTriangle, color: "text-red-500" },
    ];

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Welcome back, Binuwara
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Logistics Handling System Overview
                    </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    {today}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.label} className="hover:shadow-md transition">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.label}
                            </CardTitle>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </CardHeader>

                        <CardContent>
                            <div className="text-3xl font-semibold">
                                {card.count}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Activity Table */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle>Recent Logistics Activity</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {(exportOrders || []).slice(0, 5).map((order) => (
                                    <TableRow key={order.id} className="hover:bg-muted/50">
                                        <TableCell className="font-mono text-sm">
                                            #{order.id}
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant="outline">Export</Badge>
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-sm font-medium">
                                                {order.vehicle || "Standard Truck"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {order.driver || "Pending"}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                                {order.status}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/order/export/${order.id}`)}
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}