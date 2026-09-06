import {
  AlertTriangle,
  CircleAlert,
  CircleCheck,
  Clock3,
  Mail,
} from "lucide-react";

import InfoMini from "./InfoMini";

function AwardWorkflowPanel({
  awardState,
  workflowState,
  selectedBid,
  unsuccessfulBids = [],
  formatMoney,
  formatEta,
  openSupplierResultEmail,
  onOpenBulkUnsuccessfulBccEmail,
  onMarkSelectedNoticeSent,
  onMarkOutcomeNoticeSent,
  onMarkAllOutcomeNoticesSent,
  loading,
}) {
  const state = String(workflowState || "").toLowerCase();

  const selectedSupplierName =
    selectedBid?.supplier ||
    awardState?.selectedSupplier ||
    "-";

  const selectedAmount =
    selectedBid?.amount ??
    awardState?.selectedBidAmount ??
    null;

  const noBidsReceived =
    state === "no_bids_received";

  const shortlistingRequired =
    state === "shortlisting_required";

  const winnerSelectionRequired =
    state === "winner_selection_required";

  const selectedSupplierNoticePending =
    state === "selected_supplier_notice_pending";

  const completed =
    state === "award_completed";

  const winnerNoticeSent = Boolean(
    awardState?.selectedNoticeSentAt ||
      awardState?.selected_notice_sent_at ||
      awardState?.raw?.selected_notice_sent_at ||
      awardState?.raw?.selectedNoticeSentAt
  );

  const isOutcomeNoticeSent = (bid) => {
    const status = String(
      bid?.outcomeNotification?.status ||
        bid?.outcomeNotification?.notification_status ||
        bid?.notificationStatus ||
        bid?.notification_status ||
        ""
    )
      .trim()
      .toLowerCase();

    return status === "sent";
  };

  const pendingUnsuccessfulBids =
    unsuccessfulBids.filter(
      (bid) => !isOutcomeNoticeSent(bid)
    );

  /*
   * 1. NO BIDS RECEIVED
   */
  if (noBidsReceived) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 text-[#DC2626]"
            size={20}
          />

          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              No Bids Received
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Bidding has closed, but no supplier bids were
              received for this order.
            </p>

            <p className="mt-2 text-xs font-medium text-[#DC2626]">
              Operations can extend the bidding period to allow
              suppliers more time to submit bids.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * 2. SHORTLISTING REQUIRED
   */
  if (shortlistingRequired) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <CircleAlert
            className="mt-0.5 text-[#EA580C]"
            size={20}
          />

          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              Shortlisting Required
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Bidding is closed and supplier bids are available.
              Operations must review the submitted bids and
              create the shortlist.
            </p>

            <p className="mt-2 text-xs font-medium text-[#EA580C]">
              After the shortlist is finalized, the order moves
              to Winner Selection Required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * 3. WINNER SELECTION REQUIRED
   */
  if (winnerSelectionRequired) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Clock3
            className="mt-0.5 text-[#1E40AF]"
            size={20}
          />

          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              Winner Selection Required
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              The shortlist has been finalized. Operations must
              review the shortlisted bids and select the winning
              supplier.
            </p>

            <p className="mt-2 text-xs font-medium text-[#1E40AF]">
              Once Operations selects the winner, the winning bid
              is accepted immediately and all remaining bids are
              rejected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * 4. SELECTED SUPPLIER NOTICE PENDING
   */
  if (selectedSupplierNoticePending) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Award Result
          </p>

          <h3 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#1E293B]">
            <Mail
              size={20}
              className="text-[#D97706]"
            />
            Selected Supplier Notice Pending
          </h3>

          <p className="mt-2 text-sm font-medium text-[#D97706]">
            Complete the winner and unsuccessful supplier notifications below.
            The award completes automatically when all required notices are marked as sent.
          </p>
        </div>

        {selectedBid && (
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-amber-100 bg-white/80 p-4 md:grid-cols-4">
            <InfoMini
              label="Winning Supplier"
              value={selectedSupplierName}
            />

            <InfoMini
              label="Winning Bid"
              value={
                selectedAmount !== null &&
                selectedAmount !== undefined
                  ? formatMoney(selectedAmount)
                  : "-"
              }
              green
            />

            <InfoMini
              label="ETA"
              value={formatEta(
                selectedBid?.eta || "-"
              )}
            />

            <InfoMini
              label="Bid Status"
              value="Accepted"
              green
            />
          </div>
        )}

        <div className="mt-4 border-t border-amber-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">
                Supplier Result Notifications
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedBid &&
                openSupplierResultEmail && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      openSupplierResultEmail(
                        selectedBid,
                        "selected"
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-[#052659] bg-white px-4 py-2 text-xs font-semibold text-[#052659] transition hover:bg-[#EFF6FF] disabled:opacity-50"
                  >
                    <Mail size={15} />
                    Winner Email
                  </button>
                )}

              {selectedBid &&
                winnerNoticeSent && (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-[#16A34A]">
                    <CircleCheck size={15} />
                    Winner Notice Sent
                  </span>
                )}

              {selectedBid &&
                !winnerNoticeSent &&
                onMarkSelectedNoticeSent && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onMarkSelectedNoticeSent}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5483B3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CircleCheck size={15} />
                    {loading
                      ? "Saving..."
                      : "Mark Winner Notice Sent"}
                  </button>
                )}
            </div>
          </div>

          {unsuccessfulBids.length === 0 ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <p className="text-sm text-slate-600">
                There are no unsuccessful suppliers to notify.
                After the winner notice is marked as sent, the
                award will complete automatically.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">
                    Unsuccessful Suppliers
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {pendingUnsuccessfulBids.length} notification
                    {pendingUnsuccessfulBids.length === 1
                      ? ""
                      : "s"}{" "}
                    still pending.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onOpenBulkUnsuccessfulBccEmail && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={
                        onOpenBulkUnsuccessfulBccEmail
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-[#052659] bg-white px-4 py-2 text-xs font-semibold text-[#052659] transition hover:bg-[#EFF6FF] disabled:opacity-50"
                    >
                      <Mail size={15} />
                      Email Unsuccessful Suppliers
                    </button>
                  )}

                  {pendingUnsuccessfulBids.length > 0 &&
                    onMarkAllOutcomeNoticesSent && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={
                          onMarkAllOutcomeNoticesSent
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5483B3] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CircleCheck size={15} />
                        {loading
                          ? "Saving..."
                          : "Mark All Unsuccessful Sent"}
                      </button>
                    )}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {unsuccessfulBids.map((bid) => {
                  const sent =
                    isOutcomeNoticeSent(bid);

                  return (
                    <div
                      key={bid.id || bid.bidId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {bid.supplier}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {bid.supplierEmail ||
                            "No email"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            sent
                              ? "bg-green-100 text-[#16A34A]"
                              : "bg-orange-100 text-[#EA580C]"
                          }`}
                        >
                          {sent
                            ? "Sent"
                            : "Pending"}
                        </span>

                        {!sent &&
                          openSupplierResultEmail && (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                openSupplierResultEmail(
                                  bid,
                                  "rejected"
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-[#5483B3] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E40AF] transition hover:bg-[#EFF6FF] disabled:opacity-50"
                            >
                              <Mail size={14} />
                              Open Email
                            </button>
                          )}

                        {!sent &&
                          onMarkOutcomeNoticeSent && (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                onMarkOutcomeNoticeSent(
                                  bid
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#5483B3] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CircleCheck
                                size={14}
                              />
                              Mark as Sent
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /*
   * 5. AWARD COMPLETED
   */
  if (completed) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Award Result
          </p>

          <h3 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#1E293B]">
            <CircleCheck
              size={20}
              className="text-[#16A34A]"
            />
            Award Completed
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Bidding and supplier award communication are complete
            for this order.
          </p>
        </div>

        {selectedBid && (
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-green-100 bg-white/80 p-4 md:grid-cols-4">
            <InfoMini
              label="Winning Supplier"
              value={selectedSupplierName}
            />

            <InfoMini
              label="Winning Bid"
              value={
                selectedAmount !== null &&
                selectedAmount !== undefined
                  ? formatMoney(selectedAmount)
                  : "-"
              }
              green
            />

            <InfoMini
              label="ETA"
              value={formatEta(
                selectedBid?.eta || "-"
              )}
            />

            <InfoMini
              label="Bid Status"
              value="Accepted"
              green
            />
          </div>
        )}
      </div>
    );
  }

  /*
   * UNKNOWN / MISSING BACKEND STATE
   */
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Clock3
          className="mt-0.5 text-[#1E40AF]"
          size={20}
        />

        <div>
          <h3 className="text-base font-semibold text-[#1E293B]">
            Award Workflow
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            No valid award workflow state was returned for this
            order. Refresh the order or check the backend award
            state.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AwardWorkflowPanel;
