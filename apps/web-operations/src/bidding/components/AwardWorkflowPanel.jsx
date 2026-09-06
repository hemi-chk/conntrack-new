import {
  AlertTriangle,
  CircleAlert,
  CircleCheck,
  Clock3,
  Mail,
  Send,
} from "lucide-react";

import InfoMini from "./InfoMini";

function AwardWorkflowPanel({
  awardState,
  workflowState,
  workflowLabel,
  selectedBid,
  shortlistedCount = 0,
  unsuccessfulBids = [],
  formatMoney,
  formatEta,
  openSupplierResultEmail,
  onOpenBulkUnsuccessfulBccEmail,
  onMarkSelectedNoticeSent,
  onRecordSupplierResponse,
  onMarkOutcomeNoticeSent,
  onMarkAllOutcomeNoticesSent,
  loading,
}) {
  const state = String(
    workflowState || ""
  ).toLowerCase();

  const pendingCount = Number(
    awardState?.pendingUnsuccessfulNotices ||
      unsuccessfulBids.filter(
        (bid) =>
          bid.outcomeNotification?.status !==
          "sent"
      ).length ||
      0
  );

  const sentCount = Number(
    awardState?.sentUnsuccessfulNotices ||
      unsuccessfulBids.filter(
        (bid) =>
          bid.outcomeNotification?.status ===
          "sent"
      ).length ||
      0
  );

  const selectedSupplierName =
    selectedBid?.supplier ||
    awardState?.selectedSupplier ||
    "-";

  const selectedAmount =
    selectedBid?.amount ??
    awardState?.selectedBidAmount ??
    null;

  const noBidsReceived =
    state === "bidding_closed_no_bids";

  const shortlistingRequired =
    state === "shortlisting_required";

  const shortlistReady =
    state === "shortlist_ready_to_send";

  const winnerSelectionRequired =
    !state ||
    state === "awaiting_logistics_selection";

  const selectedNoticePending =
    state ===
    "selected_supplier_notice_pending";

  const awaitingResponse =
    state === "awaiting_supplier_response";

  const alternateRequired =
    state ===
    "alternate_supplier_selection_required";

  const unsuccessfulPending =
    state ===
    "unsuccessful_supplier_notifications_pending";

  const completed =
    state === "award_completed";

  if (noBidsReceived) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="text-[#DC2626] mt-0.5"
            size={20}
          />

          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              No Bids Received
            </h3>

            <p className="text-sm text-slate-600 mt-1">
              Bidding has closed, but no supplier
              bids were received for this order.
              There is nothing to shortlist yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (shortlistingRequired) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <CircleAlert
            className="text-[#EA580C] mt-0.5"
            size={20}
          />

          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              Shortlisting Required
            </h3>

            <p className="text-sm text-slate-600 mt-1">
              Bidding is closed. Operations must
              review the supplier bids below and
              create the required shortlist before
              continuing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (shortlistReady) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Send
            className="text-[#EA580C] mt-0.5"
            size={20}
          />

          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              Shortlist Ready - Finalize
            </h3>

            <p className="text-sm text-slate-600 mt-1">
              {Number(shortlistedCount || 0)}{" "}
              supplier
              {Number(shortlistedCount || 0) === 1
                ? ""
                : "s"}{" "}
              shortlisted. Finalize the shortlist
              to continue to winner selection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (winnerSelectionRequired) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Clock3
            className="text-[#1E40AF] mt-0.5"
            size={20}
          />

          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              Winner Selection Required
            </h3>

            <p className="text-sm text-slate-600 mt-1">
              The shortlist has been finalized.
              Operations must now select the winning
              supplier from the shortlisted bids.
              Supplier result notifications must not
              be sent yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${
        completed
          ? "bg-green-50 border-green-200"
          : alternateRequired
          ? "bg-red-50 border-red-200"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Award Workflow
          </p>

          <h3 className="text-lg font-bold text-[#1E293B] mt-1">
            {workflowLabel}
          </h3>

          {selectedSupplierName !== "-" && (
            <p className="text-sm text-slate-600 mt-1">
              Selected supplier:{" "}
              {selectedSupplierName}
            </p>
          )}
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            completed
              ? "bg-green-100 text-[#16A34A]"
              : alternateRequired
              ? "bg-red-100 text-[#DC2626]"
              : selectedNoticePending ||
                unsuccessfulPending
              ? "bg-orange-100 text-[#EA580C]"
              : "bg-blue-100 text-[#1E40AF]"
          }`}
        >
          {completed ? (
            <CircleCheck size={14} />
          ) : (
            <Clock3 size={14} />
          )}

          {workflowLabel}
        </span>
      </div>

      {selectedBid && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-white/70 border border-slate-100 rounded-xl p-4">
          <InfoMini
            label="Supplier"
            value={selectedSupplierName}
          />

          <InfoMini
            label="Bid Amount"
            value={
              selectedAmount !== null &&
              selectedAmount !== undefined
                ? formatMoney(selectedAmount)
                : "-"
            }
            green={
              completed ||
              unsuccessfulPending
            }
          />

          <InfoMini
            label="ETA"
            value={formatEta(
              selectedBid?.eta || "-"
            )}
          />

          <InfoMini
            label="Supplier Response"
            value={
              awardState?.supplierConfirmationStatus
                ? awardState.supplierConfirmationStatus
                    .replaceAll("_", " ")
                    .replace(
                      /\b\w/g,
                      (char) =>
                        char.toUpperCase()
                    )
                : awaitingResponse
                ? "Pending"
                : "-"
            }
          />
        </div>
      )}

      {selectedNoticePending &&
        selectedBid && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-[#1E293B]">
              Operations action required
            </p>

            <p className="text-sm text-slate-600 mt-1">
              Send the selected supplier notice.
              Opening Gmail alone does not mark the
              notice as sent.
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() =>
                  openSupplierResultEmail(
                    selectedBid,
                    "selected"
                  )
                }
                className="px-4 py-2 rounded-lg border border-[#1E40AF] text-[#1E40AF] bg-white text-sm font-semibold hover:bg-[#EFF6FF]"
              >
                <Mail
                  size={15}
                  className="inline mr-2"
                />
                Open Email
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={
                  onMarkSelectedNoticeSent
                }
                className="px-4 py-2 rounded-lg bg-[#052659] text-white text-sm font-semibold disabled:opacity-50"
              >
                <CircleCheck
                  size={15}
                  className="inline mr-2"
                />

                {loading
                  ? "Saving..."
                  : "Mark Selected Notice as Sent"}
              </button>
            </div>
          </div>
        )}

      {awaitingResponse && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-[#1E293B]">
            Awaiting Supplier Response
          </p>

          <p className="text-sm text-slate-600 mt-1">
            Record the response only after the
            selected supplier actually accepts or
            rejects the award. Do not notify
            unsuccessful suppliers yet.
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                onRecordSupplierResponse(
                  "accepted"
                )
              }
              className="px-4 py-2 rounded-lg bg-[#16A34A] text-white text-sm font-semibold disabled:opacity-50"
            >
              Record Accepted
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                onRecordSupplierResponse(
                  "rejected"
                )
              }
              className="px-4 py-2 rounded-lg bg-[#DC2626] text-white text-sm font-semibold disabled:opacity-50"
            >
              Record Rejected
            </button>
          </div>
        </div>
      )}

      {alternateRequired && (
        <div className="mt-4 bg-white border border-red-100 rounded-xl p-4">
          <div className="flex gap-3 items-start">
            <AlertTriangle
              className="text-[#DC2626] mt-0.5"
              size={20}
            />

            <div>
              <p className="text-sm font-semibold text-[#DC2626]">
                Supplier Declined
              </p>

              <p className="text-sm text-slate-600 mt-1">
                The previously selected supplier
                declined the award. Operations must
                now select an alternate supplier
                from the remaining shortlisted
                bids. Do not send unsuccessful
                supplier notifications yet.
              </p>
            </div>
          </div>
        </div>
      )}

      {(unsuccessfulPending ||
        completed) && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">
                Unsuccessful Supplier Notifications
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {completed
                  ? "All required result notifications have been completed."
                  : `${pendingCount} notification${
                      pendingCount === 1
                        ? ""
                        : "s"
                    } remaining · ${sentCount} sent`}
              </p>
            </div>

            {!completed && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={
                    onOpenBulkUnsuccessfulBccEmail
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-[#052659] bg-white px-4 py-2 text-xs font-semibold text-[#052659] transition hover:bg-[#EFF6FF]"
                  title="Open one BCC email for all unsuccessful suppliers"
                >
                  <Mail size={15} />
                  Email All (BCC)
                </button>

                {pendingCount > 0 && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={
                      onMarkAllOutcomeNoticesSent
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5483B3] disabled:cursor-not-allowed disabled:opacity-50"
                    title="Mark every pending unsuccessful supplier notification as sent"
                  >
                    <CircleCheck
                      size={15}
                    />

                    {loading
                      ? "Saving..."
                      : "Mark All as Sent"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {unsuccessfulBids.length ===
            0 ? (
              <p className="text-sm text-slate-500">
                No unsuccessful supplier
                notification records were returned
                by the backend.
              </p>
            ) : (
              unsuccessfulBids.map(
                (bid) => {
                  const sent =
                    bid.outcomeNotification
                      ?.status === "sent";

                  return (
                    <div
                      key={bid.id}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-3 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {bid.supplier}
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {bid.supplierEmail ||
                            "No email"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
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
                          !completed && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openSupplierResultEmail(
                                    bid,
                                    "rejected"
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-[#DC2626] text-xs font-semibold hover:bg-red-100"
                              >
                                Open Email
                              </button>

                              <button
                                type="button"
                                disabled={
                                  loading
                                }
                                onClick={() =>
                                  onMarkOutcomeNoticeSent(
                                    bid
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#052659] text-white text-xs font-semibold disabled:opacity-50"
                              >
                                Mark as Sent
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AwardWorkflowPanel;