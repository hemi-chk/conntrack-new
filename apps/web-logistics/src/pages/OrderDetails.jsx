import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, MapPin, Truck, ShieldCheck, Info, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BidsSection from "@/components/BidsSection";
import DocumentsSection from "@/components/DocumentsSection";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock order data
  const [order, setOrder] = useState({
    id: id || "ORD-001",
    origin: "Colombo, Sri Lanka",
    destination: "London, UK",
    supplier: null,
    driver: null,
  });

  const [isBidSelected, setIsBidSelected] = useState(false);
  const [isDocumentsUnlocked, setIsDocumentsUnlocked] = useState(false);

  const handleSelectBid = (bid) => {
    setOrder((prev) => ({
      ...prev,
      supplier: bid.supplier,
      driver: bid.driver,
    }));
    setIsBidSelected(true);
    setIsDocumentsUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">

      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
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

        {/* Optional Header Tracking Shortcut (Visible only when assigned) */}
        {isBidSelected && (
          <Button
            variant="outline"
            className="border-blue-200 text-[#1E40AF] hover:bg-blue-50 font-bold"
            onClick={() => navigate("/operations")}
          >
            <Map size={18} className="mr-2" />
            Quick Track
          </Button>
        )}
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

              {/* --- TRACKING BUTTON SECTION --- */}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  disabled={!isBidSelected}
                  className={`w-full py-6 font-bold transition-all duration-300 ${isBidSelected
                      ? "bg-[#1E40AF] hover:bg-[#1E3A8A] text-white shadow-lg shadow-blue-100"
                      : "bg-slate-100 text-slate-400"
                    }`}
                  onClick={() => navigate("/operations")}
                >
                  <Map className={`mr-2 ${isBidSelected ? "animate-pulse" : ""}`} size={20} />
                  {isBidSelected ? "Track Real-time Location" : "Tracking Unavailable"}
                </Button>

                {!isBidSelected && (
                  <p className="text-[10px] text-center text-slate-400 mt-3 font-medium px-4">
                    Tracking will be available once a logistics supplier is selected.
                  </p>
                )}
              </div>

              {isBidSelected && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                    Supplier selection finalized. Documentation portal and tracking are now active.
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