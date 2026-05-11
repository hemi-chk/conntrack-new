import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Search, MapPin, Clock, AlertCircle, User, Truck, Phone,
    Building2, Globe, Star, Navigation, ShieldCheck, CheckCircle2, Loader2
} from 'lucide-react';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "../../config/api";

const TrackingPage = () => {
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const [orderId, setOrderId] = useState(urlId || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Shipment Flows
    const flows = {
        import: ['port', 'freezone', 'boi_gate', 'yard', 'delivered'],
        export: ['yard', 'boi_gate', 'freezone', 'port', 'delivered']
    };

    const statusMap = {
        at_port: 'port',
        loading: 'yard',
        departed: 'boi_gate',
        in_transit: 'boi_gate',
        at_freezone: 'freezone',
        delivered: 'delivered'
    };

    const labels = {
        port: 'Port Arrival',
        yard: 'Yard / Warehouse',
        boi_gate: 'BOI Clearance',
        freezone: 'Free Zone',
        delivered: 'Final Delivery'
    };

    const handleSearch = useCallback(async (searchId) => {
        const idToSearch = searchId || orderId;
        if (!idToSearch) return;

        setLoading(true);
        setNotFound(false);

        try {
            const res = await api.get(`/logistics/tracking/order/${idToSearch}`);
            if (res.data.trackingAvailable) {
                setData(res.data);
            } else {
                setData(null);
                setNotFound(true);
            }
        } catch (err) {
            setData(null);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    // Auto-search if ID is in URL
    useEffect(() => {
        if (urlId) {
            handleSearch(urlId);
        }
    }, [urlId, handleSearch]);

    const normalizeStatus = (status) => statusMap[status] || status;
    const getStatusIndex = (status, type) => {
        const mapped = normalizeStatus(status);
        return flows[type]?.indexOf(mapped) ?? -1;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-8 max-w-7xl mx-auto">

            {/* HEADER & SEARCH ACTION BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Navigation className="text-[#1E40AF]" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Shipment Tracker</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            placeholder="Enter Order ID..."
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-10 h-10 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                        />
                    </div>
                    <Button 
                        onClick={() => handleSearch()} 
                        disabled={loading} 
                        className="h-10 bg-[#1E40AF] hover:bg-blue-800 font-bold px-6"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Track"}
                    </Button>
                </div>
            </div>

            {/* NOT FOUND STATE */}
            {notFound && (
                <Card className="max-w-xl mx-auto border-dashed border-2 bg-white mt-10">
                    <CardContent className="p-12 flex flex-col items-center text-center space-y-4">
                        <div className="bg-red-50 p-4 rounded-full text-red-500">
                            <AlertCircle size={48} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Shipment Not Found</h3>
                            <p className="text-slate-500 mt-1">Please verify the Order ID or contact the operations team.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TRACKING CONTENT */}
            {data && (
                <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* MAIN STATUS PANEL */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                            <div className="bg-slate-50 p-8 border-b border-slate-100">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[#1E40AF]">
                                            <ShieldCheck size={16} />
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Shipment Status</span>
                                        </div>
                                        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                                            {data.order_details?.order_reference}
                                        </CardTitle>
                                    </div>
                                    <Badge className="bg-[#1E40AF] text-white px-4 py-1.5 rounded-lg text-xs font-bold">
                                        {data.order_details?.order_type?.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-8 md:p-12 space-y-12">
                                {/* CUSTOM STEPPER */}
                                <div className="relative">
                                    {/* Connecting Line Backdrop */}
                                    <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-slate-100 rounded-full" />
                                    
                                    {/* Active Connecting Line */}
                                    <div 
                                        className="absolute top-5 left-[10%] h-1 bg-blue-600 rounded-full transition-all duration-1000"
                                        style={{ 
                                            width: `${(getStatusIndex(data.tracking_details.status, data.order_details?.order_type) / (flows[data.order_details?.order_type].length - 1)) * 80}%` 
                                        }}
                                    />

                                    <div className="flex justify-between items-start relative z-10">
                                        {flows[data.order_details?.order_type].map((step, i) => {
                                            const currentIdx = getStatusIndex(data.tracking_details.status, data.order_details?.order_type);
                                            const isDone = i <= currentIdx;
                                            const isActive = i === currentIdx;

                                            return (
                                                <div key={step} className="flex flex-col items-center group">
                                                    <div className={`w-11 h-11 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-xl
                                                        ${isDone ? 'bg-[#1E40AF] border-blue-100 text-white' : 'bg-white border-slate-100 text-slate-300'}
                                                        ${isActive ? 'ring-4 ring-blue-400/20 scale-125 z-20' : ''}
                                                    `}>
                                                        {isDone ? <CheckCircle2 size={20} /> : <span className="font-bold text-sm">{i + 1}</span>}
                                                    </div>
                                                    <p className={`text-[10px] md:text-xs mt-4 font-bold uppercase tracking-tight text-center max-w-[80px]
                                                        ${isDone ? 'text-slate-900' : 'text-slate-300'}
                                                    `}>
                                                        {labels[step] || step}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* LIVE FEED CARDS */}
                                <div className="grid md:grid-cols-2 gap-6 pt-6">
                                    <div className="bg-[#F8FAFC] border border-slate-100 p-6 rounded-xl space-y-3">
                                        <div className="flex items-center gap-2 text-[#1E40AF]">
                                            <MapPin size={18} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Current Location</span>
                                        </div>
                                        <p className="text-xl font-bold text-slate-900 tracking-tight">
                                            {data.tracking_details.location}
                                        </p>
                                    </div>

                                    <div className="bg-[#F8FAFC] border border-slate-100 p-6 rounded-xl space-y-3">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Clock size={18} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Last Sync</span>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-800 tracking-tight">
                                                {new Date(data.tracking_details.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {new Date(data.tracking_details.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* SIDEBAR ASSETS */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* ASSET DETAIL COMPONENT */}
                        {[
                            { title: 'Supplier Partner', icon: Building2, content: data.supplier_details?.company_name, sub: data.supplier_details?.contact_number, color: 'blue' },
                            { title: 'Dedicated Driver', icon: User, content: data.driver_details.name, sub: `License: ${data.driver_details.license}`, color: 'indigo' },
                            { title: 'Assigned Vehicle', icon: Truck, content: data.vehicle_details?.number, sub: `${data.vehicle_details?.type} • ${data.vehicle_details?.condition}`, color: 'slate' }
                        ].map((asset, idx) => (
                            <Card key={idx} className="border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <asset.icon size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{asset.title}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <p className="text-lg font-bold text-slate-800 leading-tight">{asset.content || 'N/A'}</p>
                                    <p className="text-xs font-medium text-slate-500">{asset.sub}</p>
                                    {asset.title === 'Supplier Partner' && (
                                        <div className="flex items-center gap-1 text-amber-500 mt-2">
                                            <Star size={12} fill="currentColor" />
                                            <span className="text-xs font-bold">{data.supplier_details?.rating || 0}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
};

export default TrackingPage;