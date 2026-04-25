import { useState } from "react";
import { MapPin, Package, User, CheckCircle2, Clock, FileText, Search, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import DocumentsSection from "@/components/DocumentsSection";

export default function Tracking() {
    const [searchOrderId, setSearchOrderId] = useState("");

    // Mock Order Data
    const order = {
        id: "ORD-001",
        type: "IMPORT",
        origin: "Colombo Port",
        destination: "Kandy Warehouse",
    };

    const driver = {
        name: "Kasun Perera",
        phone: "+94 77 123 4567",
        vehicle: "Truck - CAB 1234",
    };

    const stagesData = [
        { id: 1, name: "Port Clearance", location: "Colombo Port", status: "COMPLETED" },
        { id: 2, name: "Transit Hub", location: "Warehouse A", status: "IN_PROGRESS" },
        { id: 3, name: "Regional Check", location: "Kegalle", status: "PENDING" },
        { id: 4, name: "Final Delivery", location: "Kandy Warehouse", status: "PENDING" },
    ];

    // Handle Export vs Import flow direction
    const stages = order.type === "EXPORT" ? [...stagesData].reverse() : stagesData;

    // Documents State
    const [stageDocs, setStageDocs] = useState({
        2: {
            status: "REJECTED",
            remark: "Invoice missing signature. Please re-upload.",
            files: []
        }
    });

    const handleUpload = (stageId, files) => {
        setStageDocs((prev) => ({
            ...prev,
            [stageId]: {
                status: "PENDING", // Moves from REJECTED or NONE to PENDING after upload
                files: files,
                version: (prev[stageId]?.version || 0) + 1,
                lastUpdated: new Date().toISOString()
            }
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Searching for:", searchOrderId);
        // Implement backend fetch logic here
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

            {/* HEADER & SEARCH */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Shipment Tracking</h1>
                    <p className="text-sm text-slate-500">Order ID: <span className="font-mono font-bold text-[#1E40AF]">#{order.id}</span></p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            className="pl-9"
                            value={searchOrderId}
                            onChange={(e) => setSearchOrderId(e.target.value)}
                            placeholder="Search Order ID..."
                        />
                    </div>
                    <Button type="submit" className="bg-[#1E40AF]">Search</Button>
                </form>
            </div>

            {/* STAGES TIMELINE */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">Clearance Progress</h3>

                    {stages.map((stage) => {
                        const doc = stageDocs[stage.id];
                        const isRejected = doc?.status === "REJECTED";
                        const isPending = doc?.status === "PENDING";
                        const isApproved = doc?.status === "APPROVED";
                        const isActive = stage.status === "IN_PROGRESS";

                        return (
                            <div key={stage.id} className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${isActive ? 'ring-2 ring-[#1E40AF]/10 border-[#1E40AF]' : ''}`}>

                                {/* Stage Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${stage.status === "COMPLETED" ? "bg-green-500 text-white" : isActive ? "bg-[#1E40AF] text-white" : "bg-slate-200 text-slate-400"}`}>
                                            {stage.status === "COMPLETED" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{stage.name}</p>
                                            <p className="text-xs text-slate-500">{stage.location}</p>
                                        </div>
                                    </div>
                                    <Badge variant={stage.status === "COMPLETED" ? "success" : isActive ? "default" : "secondary"}>
                                        {stage.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                {/* Status Alerts */}
                                {isRejected && (
                                    <div className="mt-4 bg-red-50 border border-red-100 p-3 rounded-lg flex gap-3 animate-in fade-in">
                                        <AlertTriangle size={18} className="text-red-500 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-red-700">Document Rejected</p>
                                            <p className="text-xs text-red-600">{doc.remark}</p>
                                        </div>
                                    </div>
                                )}

                                {isPending && (
                                    <div className="mt-4 bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-center gap-2">
                                        <Clock size={16} className="text-amber-500" />
                                        <p className="text-xs font-medium text-amber-700">Awaiting approval from Logistics Team...</p>
                                    </div>
                                )}

                                {isApproved && (
                                    <div className="mt-4 bg-green-50 border border-green-100 p-3 rounded-lg flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-green-600" />
                                        <p className="text-xs font-medium text-green-700">All documents verified successfully.</p>
                                    </div>
                                )}

                                {/* Document Upload Section */}
                                {(!isApproved && (isActive || isRejected) && !isPending) && (
                                    <div className="mt-5 pt-5 border-t border-dashed">
                                        <DocumentsSection
                                            stageName={stage.name}
                                            disabled={false}
                                            onFinishUpload={(files) => handleUpload(stage.id, files)}
                                        />
                                    </div>
                                )}

                                {/* Uploaded Files List (Read Only) */}
                                {doc?.files?.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Submitted Files</p>
                                        <div className="flex flex-wrap gap-2">
                                            {doc.files.map((f) => (
                                                <div key={f.id} className="text-[11px] bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-md flex items-center gap-2 text-slate-600">
                                                    <FileText size={12} className="text-[#1E40AF]" />
                                                    {f.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* SIDEBAR: MAP & DRIVER */}
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md flex items-center gap-2">
                                <MapPin size={18} className="text-[#1E40AF]" />
                                Live Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i2365!3i1549!2m3!1e0!2sm!3i605156425!3m8!2sen!3slk!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!5f2')] bg-center"></div>
                                <MapPin className="text-[#1E40AF] animate-bounce z-10" size={32} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md flex items-center gap-2">
                                <User size={18} className="text-[#1E40AF]" />
                                Driver Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Name</span>
                                <span className="font-semibold text-slate-700">{driver.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Vehicle</span>
                                <span className="font-medium text-slate-600">{driver.vehicle}</span>
                            </div>
                            <Button variant="outline" className="w-full text-xs h-9">Contact Driver</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}