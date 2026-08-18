import React, { useState, useEffect } from 'react';
import {
  MapPin, Clock, ShieldCheck, CheckCircle2, Loader2, Navigation, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardTitle, Badge } from "@/ui";
import api from "../../config/api";
import ContainerMap from "./ContainerMap";

const TrackingMeter = ({ orderId, orderType }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Flows:
  // Export: Yard -> BOI Gate -> Freezone -> Port
  // Import: Port -> Freezone -> BOI Gate -> Yard
  const flows = {
    export: ['yard', 'boi_gate', 'freezone', 'port'],
    import: ['port', 'freezone', 'boi_gate', 'yard']
  };

  const statusMap = {
    yard: 'yard',
    loading: 'yard',
    boi_gate: 'boi_gate',
    departed: 'boi_gate',
    in_transit: 'boi_gate',
    freezone: 'freezone',
    at_freezone: 'freezone',
    port: 'port',
    at_port: 'port',
    delivered: 'yard' // or final destination
  };

  const labels = {
    yard: 'Yard',
    boi_gate: 'BOI Gate',
    freezone: 'Freezone',
    port: 'Port'
  };

  useEffect(() => {
    async function fetchTracking() {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(false);
        const res = await api.get(`/logistics/tracking/order/${orderId}`);
        if (res.data && res.data.trackingAvailable) {
          setTrackingData(res.data);
        } else {
          setTrackingData(null);
        }
      } catch (err) {
        console.error("Error fetching tracking meter data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchTracking();
  }, [orderId]);

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-xl bg-white p-6">
        <div className="flex items-center justify-center py-6 gap-2 text-slate-500">
          <Loader2 className="animate-spin text-blue-600" size={20} />
          <span className="text-sm font-medium">Loading tracking status...</span>
        </div>
      </Card>
    );
  }

  const currentType = (orderType || trackingData?.order_details?.order_type || 'export').toLowerCase();
  const currentFlow = flows[currentType] || flows.export;

  // Determine current status step index
  const currentStatusRaw = trackingData?.tracking_details?.status || '';
  const normalizedStatus = statusMap[currentStatusRaw] || currentStatusRaw;
  const currentIdx = currentFlow.indexOf(normalizedStatus);

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-slate-50/75 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#1E40AF]">
          <Navigation size={16} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Container Tracking Meter</span>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold capitalize">
          {currentType} Flow
        </Badge>
      </div>

      <CardContent className="p-6 md:p-8 space-y-8">
        {!trackingData ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-medium">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>No container tracking data recorded yet.</span>
          </div>
        ) : (
          <>
            {/* Tracking Stepper */}
            <div className="relative px-2 pt-2 pb-4">
              {/* Line background */}
              <div className="absolute top-7 left-[12%] right-[12%] h-1 bg-slate-100 rounded-full" />

              {/* Active Line */}
              <div
                className="absolute top-7 left-[12%] h-1 bg-blue-600 rounded-full transition-all duration-700"
                style={{
                  width: currentIdx >= 0
                    ? `${(currentIdx / (currentFlow.length - 1)) * 76}%`
                    : '0%'
                }}
              />

              <div className="flex justify-between items-start relative z-10">
                {currentFlow.map((stepKey, idx) => {
                  const isDone = currentIdx >= 0 && idx <= currentIdx;
                  const isActive = currentIdx === idx;

                  return (
                    <div key={stepKey} className="flex flex-col items-center group">
                      <div
                        className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-md ${isDone
                            ? 'bg-[#1E40AF] border-blue-100 text-white'
                            : 'bg-white border-slate-200 text-slate-300'
                          } ${isActive ? 'ring-4 ring-blue-400/20 scale-110' : ''}`}
                      >
                        {isDone ? <CheckCircle2 size={18} /> : <span className="font-bold text-xs">{idx + 1}</span>}
                      </div>

                      <p
                        className={`text-xs mt-3 font-bold uppercase tracking-tight text-center ${isDone ? 'text-slate-800' : 'text-slate-400'
                          }`}
                      >
                        {labels[stepKey] || stepKey}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Details Cards */}
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#F8FAFC] border border-slate-100 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[#1E40AF]">
                  <MapPin size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current Location</span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {trackingData.tracking_details?.location || 'Unknown Location'}
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-slate-100 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Sync Time</span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {trackingData.tracking_details?.timestamp
                    ? `${new Date(trackingData.tracking_details.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${new Date(trackingData.tracking_details.timestamp).toLocaleDateString()})`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Live Container Map */}
            <ContainerMap
              latitude={trackingData.tracking_details?.latitude}
              longitude={trackingData.tracking_details?.longitude}
              locationName={trackingData.tracking_details?.location}
              status={trackingData.tracking_details?.status}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingMeter;
