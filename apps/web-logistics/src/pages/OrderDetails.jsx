import { useState } from "react";
import { Package, MapPin, Truck, ShieldCheck, Info } from "lucide-react";
import BidsSection from "../components/BidsSection";
import DocumentsSection from "../components/DocumentsSection";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderDetails() {
  const [order, setOrder] = useState({
    id: "ORD-001",
    status: "BIDDING_OPEN",
    supplier: null,
    driver: null,
    origin: "Colombo Port, LK",
    destination: "Kandy Central, LK",
  });

  const handleSelectBid = (bid) => {
    setOrder({
      ...order,
      supplier: bid.supplier,
      driver: bid.driver,
      status: "SUPPLIER_SELECTED",
    });
  };

  const isBidSelected = !!order.supplier;
  const isDocumentsUnlocked = isBidSelected;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">

      {/* --- Page Header (Simplified) --- */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="bg-[#1E40AF] p-2.5 rounded-xl text-white shadow-sm">
          <Package size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Order #{order.id}
          </h1>
          <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-0.5">
            Logistics Management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- Left Column: Action Areas --- */}
        <div className="lg:col-span-2 space-y-6">
          <BidsSection
            disabled={isBidSelected}
            onSelectBid={handleSelectBid}
          />

          <DocumentsSection
            disabled={!isDocumentsUnlocked}
            onFinishUpload={(files) => console.log("Files synced:", files)}
          />
        </div>

        {/* --- Right Column: Order Summary Card --- */}
        <div className="relative">
          <Card className="border-slate-200 shadow-sm sticky top-6 overflow-hidden">

            <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Info size={16} className="text-[#1E40AF]" />
                Summary Details
              </h3>

              {/* Route Information */}
              <div className="space-y-5 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                <div className="flex gap-3">
                  <div className="bg-white p-1.5 rounded-md shadow-sm h-fit border border-slate-100">
                    <MapPin size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Origin</p>
                    <p className="text-sm font-bold text-slate-700">{order.origin}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="bg-white p-1.5 rounded-md shadow-sm h-fit border border-slate-100">
                    <Truck size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Destination</p>
                    <p className="text-sm font-bold text-slate-700">{order.destination}</p>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Logistics Supplier</span>
                  <span className={`font-bold ${order.supplier ? "text-slate-900" : "text-slate-400 italic"}`}>
                    {order.supplier || "Not Selected"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Driver</span>
                  <span className={`font-bold ${order.driver ? "text-slate-900" : "text-slate-400 italic"}`}>
                    {order.driver || "Not Assigned"}
                  </span>
                </div>
              </div>

              {isBidSelected && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                    Supplier selection finalized. Documentation portal is now active.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}