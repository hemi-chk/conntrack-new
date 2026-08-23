import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Truck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Clock3,
  Star,
  FileCheck2,
  Trophy,
  XCircle,
  Eye,
} from "lucide-react";

import { Button, Badge, useToast } from "@/ui";
import api from "../../config/api";

export default function BidsSection({ orderId, onSelectWinner }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  const { toast } = useToast();

  // ---------------------------------------------------------
  // NORMALIZE STATUS
  // Supports:
  // SHORTLISTED
  // WINNER
  // REJECTED
  // and old backend values like accepted
  // ---------------------------------------------------------
  const getBidStatus = (bid) => {
    const rawStatus =
      bid.selectionStatus ||
      bid.status ||
      (bid.selected === true ? "WINNER" : "SHORTLISTED");

    const status = String(rawStatus || "SHORTLISTED").toUpperCase();

    if (
      status === "WINNER" ||
      status === "ACCEPTED" ||
      status === "SELECTED"
    ) {
      return "WINNER";
    }

    if (
      status === "REJECTED" ||
      status === "DECLINED" ||
      status === "NOT_SELECTED" ||
      status === "NOT SELECTED"
    ) {
      return "REJECTED";
    }

    return "SHORTLISTED";
  };

  // ---------------------------------------------------------
  // FETCH SHORTLISTED BIDS SENT BY OPERATIONS
  // ---------------------------------------------------------
  const fetchShortlistedBids = useCallback(
    async (showLoader = true) => {
      if (!orderId) return;

      try {
        if (showLoader) {
          setLoading(true);
        }

        const res = await api.get(
          `/logistics/orders/${orderId}/shortlisted-bids`
        );

        let data = res?.data || [];

        // Supports backend responses such as:
        // { bids: [...] }
        // { data: [...] }
        if (!Array.isArray(data)) {
          data = data.bids || data.data || [];
        }

        setBids(data);

        // Check whether Logistics has already selected a winner
        const winner = data.find(
          (bid) => getBidStatus(bid) === "WINNER"
        );

        if (winner) {
          setFinalized(true);
          setSelectedId(winner.id);
        } else {
          setFinalized(false);
          setSelectedId(null);
        }
      } catch (error) {
        console.error("Failed to fetch shortlisted bids:", error);

        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load shortlisted bids.",
        });

        setBids([]);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [orderId]
  );

  useEffect(() => {
    fetchShortlistedBids();
  }, [fetchShortlistedBids]);

  // ---------------------------------------------------------
  // SELECT BID
  // Logistics can select ONLY SHORTLISTED bids
  // ---------------------------------------------------------
  const handleSelectBid = (bid) => {
    if (finalized) return;

    const status = getBidStatus(bid);

    if (status !== "SHORTLISTED") return;

    setSelectedId(bid.id);
  };

  // ---------------------------------------------------------
  // FINALIZE WINNER
  // ---------------------------------------------------------
  const handleConfirmWinner = async () => {
    if (!selectedId || isFinalizing || finalized) return;

    const selectedBid = bids.find((bid) => bid.id === selectedId);

    if (!selectedBid) {
      toast({
        variant: "destructive",
        title: "Bid Not Found",
        description: "The selected bid could not be found.",
      });

      return;
    }

    if (getBidStatus(selectedBid) !== "SHORTLISTED") {
      toast({
        variant: "destructive",
        title: "Invalid Selection",
        description: "Only shortlisted bids can be selected as winner.",
      });

      return;
    }

    try {
      setIsFinalizing(true);

      const response = await api.post(
        `/logistics/orders/${orderId}/finalize`,
        {
          bidId: selectedBid.id,
          selectionId: selectedBid.selectionId,
        }
      );

      if (response.status === 200 || response.status === 201) {
        /*
          IMPORTANT:

          Backend should update:

          selected bid:
          status = WINNER

          other 4 shortlisted bids:
          status = REJECTED

          Then we fetch again so Logistics sees the REAL
          database result instead of temporary frontend state.
        */

        await fetchShortlistedBids(false);

        setFinalized(true);

        if (onSelectWinner) {
          onSelectWinner(selectedBid);
        }

        toast({
          title: "Winner Selected",
          description: `${selectedBid.supplierName || "Carrier"} has been selected successfully.`,
        });
      }
    } catch (error) {
      console.error("Winner selection failed:", error);

      toast({
        variant: "destructive",
        title: "Selection Failed",
        description:
          error?.response?.data?.message ||
          "Could not finalize bid selection.",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  // ---------------------------------------------------------
  // FORMAT HELPERS
  // ---------------------------------------------------------
  const formatAmount = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "N/A";
    }

    return Number(amount).toLocaleString();
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (bid) => {
    const status = getBidStatus(bid);

    if (status === "WINNER") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
          <Trophy size={13} className="mr-1" />
          Winner
        </Badge>
      );
    }

    if (status === "REJECTED") {
      return (
        <Badge className="bg-red-50 text-red-600 border border-red-200">
          <XCircle size={13} className="mr-1" />
          Rejected
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-50 text-[#1E40AF] border border-blue-200">
        Shortlisted
      </Badge>
    );
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2
          className="animate-spin text-[#1E40AF]"
          size={32}
        />

        <p className="text-slate-500 text-sm font-medium">
          Loading shortlisted bids...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="bg-slate-50 px-6 py-5 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">
                Final Carrier Selection
              </h2>

              <Badge className="bg-blue-100 text-[#1E40AF] border-none">
                {bids.length}{" "}
                {bids.length === 1 ? "Candidate" : "Candidates"}
              </Badge>
            </div>

            <p className="text-sm text-slate-500 mt-1">
              Review the bids shortlisted by the Operations Team
              and select one final carrier.
            </p>
          </div>

          {finalized ? (
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg text-emerald-700 font-bold border border-emerald-200">
              <CheckCircle2 size={18} />
              Decision Finalized
            </div>
          ) : bids.length > 0 ? (
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg text-amber-700 font-semibold border border-amber-200">
              <Clock3 size={18} />
              Awaiting Decision
            </div>
          ) : null}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-5">
        {/* NO BIDS */}
        {bids.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Truck size={26} className="text-slate-400" />
            </div>

            <p className="font-semibold text-slate-600">
              No shortlisted bids available
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Shortlisted bids sent by Operations will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* INFO */}
            {!finalized && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <AlertCircle
                  size={20}
                  className="text-[#1E40AF] mt-0.5 shrink-0"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Select the final carrier
                  </p>

                  <p className="text-sm text-slate-600 mt-1">
                    These candidates were shortlisted and sent by
                    the Operations Team. Compare the bid details
                    before confirming the winner.
                  </p>
                </div>
              </div>
            )}

            {/* BID LIST */}
            <div className="space-y-4">
              {bids.map((bid) => {
                const status = getBidStatus(bid);

                const isWinner = status === "WINNER";
                const isRejected = status === "REJECTED";
                const isSelected =
                  selectedId === bid.id && !finalized;

                return (
                  <div
                    key={bid.id}
                    onClick={() => handleSelectBid(bid)}
                    className={`
                      border-2 rounded-2xl transition overflow-hidden

                      ${!finalized && status === "SHORTLISTED"
                        ? "cursor-pointer"
                        : "cursor-default"
                      }

                      ${isWinner
                        ? "border-emerald-400 bg-emerald-50/50"
                        : isRejected
                          ? "border-slate-200 bg-slate-50/60"
                          : isSelected
                            ? "border-[#1E40AF] bg-blue-50/40"
                            : "border-slate-200 hover:border-slate-300"
                      }
                    `}
                  >
                    <div className="p-5">
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

                        {/* SUPPLIER */}
                        <div className="flex items-center gap-4 min-w-[230px]">

                          <div
                            className={`
                              p-3 rounded-xl

                              ${isWinner
                                ? "bg-emerald-600 text-white"
                                : isSelected
                                  ? "bg-[#1E40AF] text-white"
                                  : "bg-slate-100 text-slate-500"
                              }
                            `}
                          >
                            {isWinner ? (
                              <Trophy size={22} />
                            ) : (
                              <Truck size={22} />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-lg text-slate-900">
                                {bid.supplierName ||
                                  bid.supplier_name ||
                                  "Unknown Supplier"}
                              </p>

                              {getStatusBadge(bid)}
                            </div>

                            {bid.supplierEmail && (
                              <p className="text-xs text-slate-400 mt-1">
                                {bid.supplierEmail}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* BID AMOUNT */}
                        <div className="min-w-[130px]">
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            Bid Amount
                          </p>

                          <p className="text-xl font-black text-[#1E40AF] mt-1">
                            LKR {formatAmount(bid.amount)}
                          </p>
                        </div>

                        {/* ETA */}
                        <div className="min-w-[120px]">
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            ETA
                          </p>

                          <div className="flex items-center gap-1.5 mt-1 text-slate-700 font-semibold">
                            <Clock3 size={15} />

                            {formatDate(
                              bid.eta ||
                              bid.estimatedArrival ||
                              bid.estimated_arrival ||
                              bid.deliveryDate
                            )}
                          </div>
                        </div>

                        {/* RATING */}
                        <div className="min-w-[90px]">
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            Rating
                          </p>

                          <div className="flex items-center gap-1.5 mt-1">
                            <Star
                              size={16}
                              className="text-amber-500"
                            />

                            <span className="font-bold text-slate-700">
                              {bid.rating
                                ? Number(bid.rating).toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* SCORE */}
                        <div className="min-w-[90px]">
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            Score
                          </p>

                          <p className="font-bold text-slate-700 mt-1">
                            {bid.score !== undefined &&
                              bid.score !== null
                              ? `${bid.score}/100`
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* EXTRA DETAILS */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-200">

                        {/* COMPLIANCE */}
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            Compliance
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <ShieldCheck
                              size={16}
                              className="text-emerald-600"
                            />

                            <span className="text-sm font-medium text-slate-700">
                              {bid.compliance ||
                                bid.complianceStatus ||
                                bid.compliance_status ||
                                "Not Reviewed"}
                            </span>
                          </div>
                        </div>

                        {/* PAST PERFORMANCE */}
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            Past Performance
                          </p>

                          <p className="text-sm text-slate-700 mt-1">
                            {bid.pastPerformance ||
                              bid.past_performance ||
                              "No previous performance data"}
                          </p>
                        </div>

                        {/* VEHICLE / SERVICE */}
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            Vehicle / Service
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <FileCheck2
                              size={16}
                              className="text-[#1E40AF]"
                            />

                            <span className="text-sm font-medium text-slate-700">
                              {bid.vehicleType ||
                                bid.vehicle_type ||
                                bid.serviceType ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SELECTED INDICATOR */}
                      {isSelected && (
                        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#1E40AF]">
                          <CheckCircle2 size={17} />
                          Selected for final confirmation
                        </div>
                      )}

                      {/* WINNER MESSAGE */}
                      {isWinner && (
                        <div className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700">
                          <Trophy size={17} />
                          Final carrier selected by Logistics
                        </div>
                      )}

                      {/* REJECTED MESSAGE */}
                      {isRejected && finalized && (
                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                          <XCircle size={17} />
                          Not selected as final carrier
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FINAL CONFIRMATION */}
            {selectedId && !finalized && (
              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="text-[#1E40AF] mt-0.5"
                    />

                    <div>
                      <p className="font-bold text-slate-800">
                        Confirm Final Carrier
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        Once confirmed, this supplier will become
                        the winner and the other shortlisted bids
                        will be marked as rejected.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleConfirmWinner}
                    disabled={isFinalizing}
                    className="bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold px-7 min-w-[180px]"
                  >
                    {isFinalizing ? (
                      <span className="flex items-center gap-2">
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Processing...
                      </span>
                    ) : (
                      "Confirm Winner"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* FINALIZED MESSAGE */}
            {finalized && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    size={21}
                    className="text-emerald-600"
                  />

                  <div>
                    <p className="font-bold text-emerald-800">
                      Logistics Decision Completed
                    </p>

                    <p className="text-sm text-emerald-700 mt-1">
                      The final carrier decision has been saved and
                      is now available to the Operations Team.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}