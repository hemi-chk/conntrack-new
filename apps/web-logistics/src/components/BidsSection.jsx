import { useState } from "react";
import { CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BidsSection({ disabled, onSelectWinner }) {
  const [selectedId, setSelectedId] = useState(null);

  // ✅ MOCK SHORTLISTED BIDS (from operations)
  const bids = [
    { id: 1, supplier: "ABC Logistics", price: 500 },
    { id: 2, supplier: "XYZ Transport", price: 450 },
    { id: 3, supplier: "Fast Cargo", price: 480 },
  ];

  const handleSelect = (bid) => {
    setSelectedId(bid.id);
    onSelectWinner(bid); // send to parent
  };

  const isLocked = disabled || selectedId !== null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          Shortlisted Bids
          <Badge className="bg-blue-100 text-[#1E40AF] border-none font-bold">
            {bids.length}
          </Badge>
        </h2>

        {selectedId && (
          <div className="flex items-center gap-1 text-emerald-600 font-semibold text-sm">
            <CheckCircle2 size={16} />
            Winner Selected
          </div>
        )}
      </div>

      {/* Bids List */}
      <div className="p-5 space-y-3">
        {bids.map((bid) => {
          const isWinner = selectedId === bid.id;
          const isRejected = selectedId && selectedId !== bid.id;

          return (
            <div
              key={bid.id}
              className={`flex justify-between items-center border p-4 rounded-xl transition
                ${isWinner ? "border-emerald-300 bg-emerald-50" : ""}
                ${isRejected ? "opacity-60 bg-slate-50" : ""}
              `}
            >
              {/* Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">
                    {bid.supplier}
                  </p>

                  {isWinner && (
                    <Badge className="bg-[#16A34A]/10 text-[#16A34A]">
                      Winner
                    </Badge>
                  )}

                  {isRejected && (
                    <Badge className="bg-[#DC2626]/10 text-[#DC2626]">
                      Rejected
                    </Badge>
                  )}
                </div>

                <p className="text-xl font-bold text-[#1E40AF]">
                  ${bid.price}
                </p>
              </div>

              {/* Action */}
              <Button
                disabled={isLocked}
                onClick={() => handleSelect(bid)}
                className="bg-[#1E40AF] text-white hover:bg-[#1E3A8A]"
              >
                Select Winner
              </Button>
            </div>
          );
        })}

        {!bids.length && (
          <div className="text-center py-6 text-slate-400">
            No shortlisted bids
          </div>
        )}
      </div>
    </div>
  );
}