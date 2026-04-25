import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, Map, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BidsSection from "@/components/BidsSection";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ Order State
  const [order, setOrder] = useState({
    id: id || "ORD-001",
    origin: "Colombo, Sri Lanka",
    destination: "London, UK",
    supplier: null,
  });

  const [selectedBid, setSelectedBid] = useState(null);

  // ✅ Logistics marks winner (UI only)
  const handleSelectWinner = (bid) => {
    setSelectedBid(bid);

    setOrder((prev) => ({
      ...prev,
      supplier: bid.supplier,
    }));
  };

  const isAssigned = !!selectedBid;

  return (
    <div className="min-h-screen bg-[#EFF6FF] p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#1E40AF] p-2.5 rounded-xl text-white shadow-sm">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">
              Order #{order.id}
            </h1>
            <p className="text-xs text-slate-500 uppercase font-semibold">
              Logistics Management
            </p>
          </div>
        </div>

        {isAssigned && (
          <Button
            variant="outline"
            className="border-blue-200 text-[#1E40AF] hover:bg-[#EFF6FF]"
            onClick={() => navigate("/tracking")}
          >
            <Map size={18} className="mr-2" />
            Quick Track
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <BidsSection
            disabled={isAssigned}
            onSelectWinner={handleSelectWinner}
          />
        </div>

        {/* RIGHT SUMMARY */}
        <div>
          <Card className="border border-slate-200 shadow-sm rounded-xl sticky top-24">
            <CardContent className="p-6 space-y-6">

              <h3 className="font-semibold text-[#1E293B] flex items-center gap-2 text-sm uppercase">
                <Info size={16} className="text-[#1E40AF]" />
                Summary
              </h3>

              {/* Route */}
              <div className="space-y-4 bg-white border border-slate-100 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-slate-400">Origin</p>
                  <p className="font-semibold text-[#1E293B]">{order.origin}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Destination</p>
                  <p className="font-semibold text-[#1E293B]">{order.destination}</p>
                </div>
              </div>

              {/* Supplier */}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Supplier</span>
                <span className="font-semibold text-[#1E293B]">
                  {order.supplier || "Not Selected"}
                </span>
              </div>

              {/* Tracking */}
              <Button
                disabled={!isAssigned}
                className={`w-full ${isAssigned
                    ? "bg-[#1E40AF] hover:bg-[#1E3A8A] text-white"
                    : "bg-slate-100 text-slate-400"
                  }`}
                onClick={() => navigate("/tracking")}
              >
                <Map size={18} className="mr-2" />
                {isAssigned ? "Track Shipment" : "Tracking Locked"}
              </Button>

              {/* Status */}
              {isAssigned && (
                <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 p-3 rounded-lg flex gap-2">
                  <ShieldCheck className="text-[#16A34A]" size={16} />
                  <p className="text-xs text-[#16A34A]">
                    Supplier selected. Tracking is now available.
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