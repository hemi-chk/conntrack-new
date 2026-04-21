import { useState } from "react";
import { CheckCircle2, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BidsSection({ disabled, onSelectBid }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);

  const bids = [
    { id: 1, supplier: "ABC Logistics", price: 500, driver: "John Perera" },
    { id: 2, supplier: "XYZ Transport", price: 450, driver: "Mike Silva" },
  ];

  const handleOpenConfirmation = (bid) => {
    setSelectedBid(bid);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (selectedBid) {
      onSelectBid(selectedBid);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          Supplier Bids
          <Badge variant="secondary" className="bg-blue-100 text-[#1E40AF] border-none font-bold">
            {bids.length}
          </Badge>
        </h2>

        {disabled && (
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <CheckCircle2 size={16} />
            Selection Finalized
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        {bids.map((bid) => (
          <div
            key={bid.id}
            className={`flex justify-between items-center border border-slate-200 p-4 rounded-xl transition-all ${disabled ? "opacity-75 bg-slate-50/50" : "hover:border-blue-300 hover:shadow-sm bg-white"
              }`}
          >
            <div className="space-y-1">
              <p className="font-bold text-slate-800">{bid.supplier}</p>
              <div className="flex items-center gap-4">
                <p className="text-xl font-bold text-[#1E40AF]">
                  ${bid.price.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                  <User size={14} className="text-slate-400" />
                  <span>{bid.driver}</span>
                </div>
              </div>
            </div>

            <Button
              disabled={disabled}
              onClick={() => handleOpenConfirmation(bid)}
              className="px-6 rounded-lg font-bold bg-[#1E40AF] hover:bg-[#1E3A8A] text-white shadow-sm"
            >
              {disabled ? "Selected" : "Select Bid"}
            </Button>
          </div>
        ))}

        {!bids.length && (
          <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Awaiting supplier responses...
          </div>
        )}
      </div>

      {/* --- Confirmation Modal --- */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <AlertCircle className="h-6 w-6 text-[#1E40AF]" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-slate-900">
              Confirm Selection
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500 py-2">
              Are you sure you want to select <span className="font-bold text-slate-800">{selectedBid?.supplier}</span> for this order? This action will finalize the handler for this delivery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold"
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}