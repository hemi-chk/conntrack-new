import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Package, User, CheckCircle2, Clock, FileText, Search, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/config/supabase";
import DocumentsSection from "./DocumentsSection";

export default function Tracking() {
    const { id } = useParams(); // Get order ID from URL
    const [order, setOrder] = useState(null);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchTrackingData();
    }, [id]);

    async function fetchTrackingData() {
        setLoading(true);
        try {
            // 1. Fetch Order & Driver
            const { data: orderData } = await supabase
                .from('orders')
                .select('*, order_assignments(drivers(*), vehicles(*))')
                .eq('order_id', id)
                .single();

            setOrder(orderData);

            // 2. Fetch Stages based on order type + Documents for this order
            const { data: stagesData } = await supabase
                .from('tracking_stages')
                .select(`
                    *,
                    documents (
                        document_id, file_url, status, rejection_remark
                    )
                `)
                .eq('order_type', orderData.order_type)
                .order('sequence_order', { ascending: true });

            setStages(stagesData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleUploadComplete = () => {
        fetchTrackingData(); // Refresh to show pending status
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Shipment Tracking</h1>
                    <p className="text-sm text-slate-500">Reference: <span className="font-mono font-bold text-blue-600">#{order.order_reference}</span></p>
                </div>
                <Badge className="h-fit">{order.current_status.replace('_', ' ')}</Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* TIMELINE */}
                <div className="lg:col-span-2 space-y-6">
                    {stages.map((stage, index) => {
                        // Logic: A stage is "In Progress" if previous are completed and it has no approved docs
                        const doc = stage.documents?.[0];
                        const isApproved = doc?.status === 'approved';
                        const isRejected = doc?.status === 'rejected';
                        const isPending = doc?.status === 'pending';

                        return (
                            <div key={stage.stage_id} className="relative pl-8 pb-8 last:pb-0">
                                {/* Vertical Connector Line */}
                                {index !== stages.length - 1 && (
                                    <div className={`absolute left-[11px] top-7 w-[2px] h-full ${isApproved ? 'bg-green-500' : 'bg-slate-200'}`} />
                                )}

                                {/* Icon */}
                                <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center z-10 
                                    ${isApproved ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                                    {isApproved ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                </div>

                                <Card className={`${isRejected ? 'border-red-200 ring-1 ring-red-50' : ''}`}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{stage.stage_name}</h4>
                                                <p className="text-xs text-slate-500">Required documentation for clearance</p>
                                            </div>
                                            {doc && (
                                                <Badge variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}>
                                                    {doc.status}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Error/Remark Box */}
                                        {isRejected && (
                                            <div className="mt-4 bg-red-50 p-3 rounded-lg flex gap-3 border border-red-100">
                                                <AlertTriangle className="text-red-500 shrink-0" size={16} />
                                                <p className="text-xs text-red-700"><b>Rejected:</b> {doc.rejection_remark}</p>
                                            </div>
                                        )}

                                        {/* Upload Logic: Show if no doc, or if rejected */}
                                        {(!doc || isRejected) && (
                                            <div className="mt-4 pt-4 border-t border-dashed">
                                                <DocumentsSection
                                                    orderId={id}
                                                    stageId={stage.stage_id}
                                                    onUpload={handleUploadComplete}
                                                />
                                            </div>
                                        )}

                                        {isPending && (
                                            <p className="mt-3 text-xs text-amber-600 flex items-center gap-2">
                                                <Clock size={14} /> Waiting for admin verification...
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>

                {/* SIDEBAR */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Driver & Vehicle</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{order.order_assignments?.[0]?.drivers?.first_name || "Unassigned"}</p>
                                    <p className="text-xs text-slate-500">{order.order_assignments?.[0]?.vehicles?.vehicle_number}</p>
                                </div>
                            </div>
                            <Button className="w-full bg-blue-600">Call Driver</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}