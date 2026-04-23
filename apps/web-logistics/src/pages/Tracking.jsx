import { useState } from "react";
import { MapPin, Truck, Package, User } from "lucide-react";

// Shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Tracking() {

    // ✅ MOCK DATA
    const order = {
        id: "ORD-001",
        status: "IN_TRANSIT", // PICKED_UP | IN_TRANSIT | DELIVERED
        origin: "Colombo Port",
        destination: "Kandy Warehouse",
    };

    const driver = {
        name: "Kasun Perera",
        phone: "+94 77 123 4567",
        vehicle: "Truck - CAB 1234",
    };

    // 🎯 Progress stages
    const steps = [
        { label: "Picked Up", value: "PICKED_UP" },
        { label: "In Transit", value: "IN_TRANSIT" },
        { label: "Delivered", value: "DELIVERED" },
    ];

    const currentStepIndex = steps.findIndex(
        (s) => s.value === order.status
    );

    return (
        <div className="p-6 space-y-6 bg-white">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-[#1E293B]">
                    Tracking
                </h1>
                <p className="text-sm text-gray-500">
                    Track shipment progress and location
                </p>
            </div>

            {/* Top Cards */}
            <div className="grid md:grid-cols-2 gap-4">

                {/* Order Card */}
                <Card className="border border-gray-200">
                    <CardHeader className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-[#1E40AF]" />
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm">
                        <p><strong>ID:</strong> #{order.id}</p>
                        <p><strong>From:</strong> {order.origin}</p>
                        <p><strong>To:</strong> {order.destination}</p>
                        <Badge className="bg-[#EFF6FF] text-[#1E40AF]">
                            {order.status.replace("_", " ")}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Driver Card */}
                <Card className="border border-gray-200">
                    <CardHeader className="flex items-center gap-2">
                        <User className="h-5 w-5 text-[#1E40AF]" />
                        <CardTitle>Driver Details</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {driver.name}</p>
                        <p><strong>Phone:</strong> {driver.phone}</p>
                        <p><strong>Vehicle:</strong> {driver.vehicle}</p>
                    </CardContent>
                </Card>

            </div>

            {/* Progress Tracker */}
            <Card className="border border-gray-200">
                <CardHeader>
                    <CardTitle>Shipment Progress</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="flex items-center justify-between relative">

                        {/* Line */}
                        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 z-0"></div>

                        {steps.map((step, index) => {
                            const isActive = index <= currentStepIndex;

                            return (
                                <div key={step.value} className="flex flex-col items-center z-10 w-full">

                                    {/* Circle */}
                                    <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs
                      ${isActive ? "bg-[#1E40AF]" : "bg-gray-300"}`}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Label */}
                                    <p
                                        className={`mt-2 text-sm ${isActive ? "text-[#1E293B]" : "text-gray-400"
                                            }`}
                                    >
                                        {step.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card className="border border-gray-200">
                <CardHeader>
                    <CardTitle>Live Location</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="h-[350px] bg-[#EFF6FF] flex items-center justify-center rounded-lg border border-dashed border-[#1E40AF]/30">
                        <div className="text-center text-gray-500">
                            <MapPin className="mx-auto mb-2 h-6 w-6 text-[#1E40AF]" />
                            Map Integration (Google Maps / Mapbox)
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}