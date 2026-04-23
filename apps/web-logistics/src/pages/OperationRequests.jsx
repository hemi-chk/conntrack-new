import { useState } from "react";
import { ClipboardList } from "lucide-react";

// Shadcn
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OperationRequests() {
    const [selectedId, setSelectedId] = useState("REQ-001");

    // ✅ MOCK DATA
    const requests = [
        {
            id: "REQ-001",
            orderId: "ORD-001",
            unread: true,
            message:
                "Please assign a driver ASAP. This shipment is urgent and needs immediate handling.",
        },
        {
            id: "REQ-002",
            orderId: "ORD-002",
            unread: false,
            message:
                "Insurance document is missing. Please upload the required file to proceed.",
        },
    ];

    const selected = requests.find((r) => r.id === selectedId);

    return (
        <div className="p-6 h-[calc(100vh-80px)] bg-white">

            <div className="grid grid-cols-3 gap-4 h-full">

                {/* LEFT: Request List */}
                <Card className="col-span-1 p-2 overflow-y-auto border border-gray-200">

                    <h2 className="font-semibold text-[#1E293B] p-2 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-[#1E40AF]" />
                        Operation Requests
                    </h2>

                    {requests.map((req) => (
                        <div
                            key={req.id}
                            onClick={() => setSelectedId(req.id)}
                            className={`p-3 rounded-lg cursor-pointer mb-2 transition
                ${selectedId === req.id
                                    ? "bg-[#EFF6FF]"
                                    : "hover:bg-gray-100"
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <p className="font-medium text-sm">{req.id}</p>

                                {req.unread && (
                                    <Badge className="bg-[#DC2626] text-white text-xs">
                                        New
                                    </Badge>
                                )}
                            </div>

                            <p className="text-xs text-gray-500">
                                #{req.orderId}
                            </p>

                            <p className="text-sm text-gray-600 mt-1 truncate">
                                {req.message}
                            </p>
                        </div>
                    ))}
                </Card>

                {/* RIGHT: Message Viewer */}
                <Card className="col-span-2 flex flex-col border border-gray-200">

                    {/* Header */}
                    <div className="border-b p-4">
                        <h2 className="font-semibold text-[#1E293B]">
                            {selected.id} - #{selected.orderId}
                        </h2>
                    </div>

                    {/* Full Message */}
                    <div className="p-6 text-sm text-gray-700 leading-relaxed">
                        {selected.message}
                    </div>

                </Card>

            </div>
        </div>
    );
}