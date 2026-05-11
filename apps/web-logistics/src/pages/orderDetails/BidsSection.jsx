import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import api from "../../config/api";

export default function BidsSection({ orderId, onSelectWinner }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  const { toast } = useToast();

  // FETCH SHORTLISTED BIDS
  useEffect(() => {
    const fetchShortlistedBids = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `/logistics/orders/${orderId}/shortlisted-bids`
        );

        const data = res.data || [];

        setBids(data);

        // 🔥 If already finalized (only 1 accepted)
        if (data.length === 1 && data[0].selectionStatus === "accepted") {
          setFinalized(true);
          setSelectedId(data[0].id);
        }

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load shortlisted bids.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchShortlistedBids();
  }, [orderId]);

  // FINALIZE WINNER
  const handleConfirmWinner = async () => {
    if (!selectedId || isFinalizing) return;

    const selectedBid = bids.find((b) => b.id === selectedId);

    if (!selectedBid) return;

    setIsFinalizing(true);

    try {
      const response = await api.post(
        `/logistics/orders/${orderId}/finalize`,
        {
          bidId: selectedBid.id,
          selectionId: selectedBid.selectionId
        }
      );

      if (response.status === 200) {
        // 🔥 Show only winner
        setBids([selectedBid]);
        setFinalized(true);

        if (onSelectWinner) onSelectWinner(selectedBid);

        toast({
          title: "Success",
          description: "Carrier successfully selected.",
        });
      }
    } catch (error) {
      setIsFinalizing(false);

      toast({
        variant: "destructive",
        title: "Selection Failed",
        description: "Could not finalize bid selection.",
      });
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="animate-spin text-[#1E40AF]" size={32} />
        <p className="text-slate-500 text-sm font-medium">
          Loading shortlisted bids...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          Final Carrier Selection
          <Badge className="bg-blue-100 text-[#1E40AF] border-none">
            {bids.length} Candidates
          </Badge>
        </h2>

        {finalized && (
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg text-emerald-700 font-bold border border-emerald-200">
            <CheckCircle2 size={18} /> Finalized
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-4">

        {bids.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            No shortlisted bids available
          </div>
        ) : (
          bids.map((bid) => (
            <div
              key={bid.id}
              onClick={() => !finalized && setSelectedId(bid.id)}
              className={`flex justify-between items-center border-2 p-5 rounded-2xl cursor-pointer transition
                ${selectedId === bid.id
                  ? "border-[#1E40AF] bg-blue-50/30"
                  : "border-slate-100 hover:border-slate-200"}
                ${finalized && selectedId !== bid.id ? "hidden" : ""}
              `}
            >
              {/* LEFT */}
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${selectedId === bid.id
                    ? "bg-[#1E40AF] text-white"
                    : "bg-slate-100 text-slate-500"
                    }`}
                >
                  <Truck size={22} />
                </div>

                <div>
                  <p className="font-bold text-lg text-slate-900">
                    {bid.supplierName}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    ★ {bid.rating ? Number(bid.rating).toFixed(1) : "N/A"}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-right">
                <p className="text-xl font-black text-[#1E40AF]">
                  LKR{" "}
                  {bid.amount
                    ? Number(bid.amount).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          ))
        )}

        {/* ACTION */}
        {selectedId && !finalized && (
          <div className="mt-6 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <AlertCircle size={18} className="text-[#1E40AF]" />
              Confirm and assign this carrier?
            </p>

            <Button
              onClick={handleConfirmWinner}
              disabled={isFinalizing}
              className="bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold px-6"
            >
              {isFinalizing ? "Processing..." : "Finalize Selection"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}