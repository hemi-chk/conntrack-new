import {
    AlertCircle,
    CheckCircle2,
    CircleDollarSign,
    Loader2,
    ShieldCheck,
    Star,
    Trophy,
    Truck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, Button, useToast } from "@conntrack/ui/shadcn";
import api from "../../config/api";

export default function BidsSection({
  orderId,
  onSelectWinner,
  disabled = false,
}) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  const { toast } = useToast();

  // =====================================================
  // FETCH SHORTLISTED BIDS
  // =====================================================

  useEffect(() => {
    const fetchShortlistedBids = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await api.get(
          `/logistics/orders/${orderId}/shortlisted-bids`,
          { timeout: 15000 }
        );

        const data = res.data || [];

        setBids(data);

        // Already finalized
        const acceptedBid = data.find(
          (bid) => bid.selectionStatus === "accepted"
        );

        if (acceptedBid) {
          setFinalized(true);
          setSelectedId(acceptedBid.id);
        }
      } catch (error) {
        console.error("Failed to load shortlisted bids:", error);
        const status = error.response?.status;
        const message = error.response?.data?.message;
        const description = error.code === "ECONNABORTED"
          ? "The bids service took too long to respond."
          : message || `The bids service returned ${status || "an error"}.`;

        setLoadError(description);

        toast({
          variant: "destructive",
          title: "Unable to load bids",
          description,
        });
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchShortlistedBids();
    }
  }, [orderId, retryCount, toast]);

  // =====================================================
  // SELECT BID
  // =====================================================

  const handleSelectBid = (bidId) => {
    if (finalized || disabled || isFinalizing) return;

    setSelectedId(bidId);
  };

  // =====================================================
  // FINALIZE WINNER
  // =====================================================

  const handleConfirmWinner = async () => {
    if (!selectedId || isFinalizing || finalized || disabled) return;

    const selectedBid = bids.find(
      (bid) => bid.id === selectedId
    );

    if (!selectedBid) return;

    try {
      setIsFinalizing(true);

      const response = await api.post(
        `/logistics/orders/${orderId}/finalize`,
        {
          bidId: selectedBid.id,
          selectionId: selectedBid.selectionId,
        }
      );

      if (response.status === 200) {
        // Keep only selected winner
        setBids([selectedBid]);

        setFinalized(true);
        setSelectedId(selectedBid.id);

        if (onSelectWinner) {
          onSelectWinner(selectedBid);
        }

        toast({
          title: "Carrier Selected",
          description:
            `${selectedBid.supplierName} has been successfully selected.`,
        });
      }
    } catch (error) {
      console.error("Finalize bid error:", error);

      toast({
        variant: "destructive",
        title: "Selection Failed",
        description:
          error.response?.data?.message ||
          "Could not finalize the carrier selection.",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-5">
          <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-32 bg-slate-200 rounded mt-2 animate-pulse" />
        </div>

        <div className="p-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="border border-slate-200 rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />

                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-5 w-24 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-200 rounded ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
          <AlertCircle size={24} className="text-red-600" />
        </div>
        <h3 className="mt-4 text-sm font-extrabold text-red-800">
          Unable to load shortlisted bids
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs font-medium text-red-700">
          {loadError}
        </p>
        <Button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="mt-5 h-9 rounded-lg bg-red-700 px-4 text-xs font-bold text-white hover:bg-red-800"
        >
          Retry
        </Button>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bg-slate-50 border-b border-slate-200 px-6 py-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-2">

              <div className="p-2 bg-blue-100 rounded-xl">
                <Trophy
                  size={17}
                  className="text-[#052659]"
                />
              </div>

              <h2 className="text-lg font-extrabold text-slate-900">
                Final Carrier Selection
              </h2>

              <Badge
                className="
                  bg-blue-100
                  text-[#052659]
                  border-none
                  font-bold
                  px-2.5
                "
              >
                {bids.length}
              </Badge>

            </div>

            <p className="text-xs text-slate-500 mt-1 ml-11">
              Review shortlisted carriers and select the best option.
            </p>
          </div>

          {/* FINALIZED STATUS */}

          {finalized && (
            <div
              className="
                inline-flex items-center gap-2
                bg-emerald-50
                border border-emerald-200
                text-emerald-700
                px-3 py-2
                rounded-xl
                text-xs
                font-bold
              "
            >
              <CheckCircle2 size={16} />
              Carrier Selected
            </div>
          )}

        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="p-6">

        {/* EMPTY STATE */}

        {bids.length === 0 ? (
          <div className="py-12 text-center">

            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Truck
                size={25}
                className="text-slate-400"
              />
            </div>

            <h3 className="text-sm font-bold text-slate-700">
              No Shortlisted Bids
            </h3>

            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no shortlisted carrier bids
              available for this order.
            </p>

          </div>
        ) : (

          <div className="space-y-3">

            {/* =================================================
                BID CARDS
            ================================================= */}

            {bids.map((bid) => {

              const isSelected =
                selectedId === bid.id;

              const isWinner =
                finalized && isSelected;

              return (
                <div
                  key={bid.id}
                  onClick={() =>
                    handleSelectBid(bid.id)
                  }
                  className={`
                    relative
                    border-2
                    rounded-2xl
                    p-5
                    transition-all
                    duration-200

                    ${
                      disabled || finalized
                        ? "cursor-default"
                        : "cursor-pointer"
                    }

                    ${
                      isSelected
                        ? "border-[#052659] bg-blue-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/50"
                    }
                  `}
                >

                  {/* WINNER BADGE */}

                  {isWinner && (
                    <div
                      className="
                        absolute
                        -top-3
                        right-4
                        bg-emerald-600
                        text-white
                        text-[10px]
                        font-extrabold
                        uppercase
                        tracking-wider
                        px-3
                        py-1
                        rounded-full
                        shadow-sm
                        flex
                        items-center
                        gap-1
                      "
                    >
                      <CheckCircle2 size={12} />
                      Selected
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

                    {/* LEFT */}

                    <div className="flex items-center gap-4 min-w-0">

                      <div
                        className={`
                          w-12 h-12
                          rounded-xl
                          flex items-center justify-center
                          shrink-0
                          transition-colors

                          ${
                            isSelected
                              ? "bg-[#052659] text-white"
                              : "bg-slate-100 text-slate-500"
                          }
                        `}
                      >
                        <Truck size={21} />
                      </div>

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <h3 className="font-extrabold text-slate-900 truncate">
                            {bid.supplierName ||
                              "Unknown Carrier"}
                          </h3>

                          {isWinner && (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-600 shrink-0"
                            />
                          )}

                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5">

                          {/* RATING */}

                          <div className="flex items-center gap-1 text-xs text-slate-500">

                            <Star
                              size={13}
                              className="text-amber-500 fill-amber-500"
                            />

                            <span className="font-semibold">
                              {bid.rating
                                ? Number(
                                    bid.rating
                                  ).toFixed(1)
                                : "N/A"}
                            </span>

                          </div>

                          <div className="w-1 h-1 bg-slate-300 rounded-full" />

                          <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">

                            <ShieldCheck size={13} />

                            Verified Carrier

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* RIGHT */}

                    <div className="sm:text-right sm:shrink-0">

                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        Bid Amount
                      </p>

                      <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">

                        <CircleDollarSign
                          size={17}
                          className="text-[#052659]"
                        />

                        <p className="text-xl font-black text-[#052659]">
                          LKR{" "}
                          {bid.amount
                            ? Number(
                                bid.amount
                              ).toLocaleString()
                            : "N/A"}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* SELECTED INDICATOR */}

                  {isSelected && !finalized && (
                    <div className="mt-4 pt-3 border-t border-blue-200 flex items-center gap-2">

                      <CheckCircle2
                        size={15}
                        className="text-[#052659]"
                      />

                      <span className="text-xs font-bold text-[#052659]">
                        Carrier selected for confirmation
                      </span>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

        {/* =================================================
            CONFIRMATION AREA
        ================================================= */}

        {selectedId && !finalized && !disabled && (
          <div
            className="
              mt-5
              bg-slate-50
              border
              border-slate-200
              rounded-2xl
              p-4
            "
          >

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div className="flex items-start gap-3">

                <div className="bg-blue-100 p-2 rounded-xl shrink-0">
                  <AlertCircle
                    size={17}
                    className="text-[#052659]"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Ready to finalize?
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5">
                    This carrier will be assigned to this order.
                  </p>
                </div>

              </div>

              <Button
                onClick={handleConfirmWinner}
                disabled={isFinalizing}
                className="
                  h-10
                  px-5
                  rounded-xl
                  bg-[#052659]
                  hover:bg-[#1E40AF]
                  text-white
                  font-bold
                  text-xs
                  shrink-0
                "
              >
                {isFinalizing ? (
                  <>
                    <Loader2
                      size={15}
                      className="mr-2 animate-spin"
                    />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <CheckCircle2
                      size={15}
                      className="mr-2"
                    />
                    Finalize Selection
                  </>
                )}
              </Button>

            </div>
          </div>
        )}

        {/* =================================================
            FINALIZED MESSAGE
        ================================================= */}

        {finalized && (
          <div
            className="
              mt-5
              bg-emerald-50
              border
              border-emerald-200
              rounded-2xl
              p-4
            "
          >
            <div className="flex items-start gap-3">

              <div className="bg-emerald-100 p-2 rounded-xl shrink-0">
                <CheckCircle2
                  size={18}
                  className="text-emerald-700"
                />
              </div>

              <div>
                <p className="text-sm font-extrabold text-emerald-800">
                  Carrier selection completed
                </p>

                <p className="text-xs text-emerald-700 mt-0.5">
                  The selected carrier has been assigned to
                  this order successfully.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}