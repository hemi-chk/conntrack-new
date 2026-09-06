import AwardWorkflowPanel from "./AwardWorkflowPanel";

function AwardWorkflowModal({
  bid,
  awardState,
  workflowState,
  workflowLabel,
  unsuccessfulBids,
  orderReference,
  formatMoney,
  formatEta,
  openSupplierResultEmail,
  onOpenBulkUnsuccessfulBccEmail,
  onMarkSelectedNoticeSent,
  onRecordSupplierResponse,
  onMarkOutcomeNoticeSent,
  onMarkAllOutcomeNoticesSent,
  loading,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-2xl shadow-lg w-[900px] max-w-[94vw] max-h-[90vh] overflow-y-auto p-6">

        <div className="flex justify-between items-start gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#1E293B]">
              Supplier Award Center
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              {orderReference} · {workflowLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close award center"
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <AwardWorkflowPanel
          awardState={awardState}
          workflowState={workflowState}
          workflowLabel={workflowLabel}
          selectedBid={bid}
          unsuccessfulBids={unsuccessfulBids}
          formatMoney={formatMoney}
          formatEta={formatEta}
          openSupplierResultEmail={openSupplierResultEmail}
          onOpenBulkUnsuccessfulBccEmail={
            onOpenBulkUnsuccessfulBccEmail
          }
          onMarkSelectedNoticeSent={
            onMarkSelectedNoticeSent
          }
          onRecordSupplierResponse={
            onRecordSupplierResponse
          }
          onMarkOutcomeNoticeSent={
            onMarkOutcomeNoticeSent
          }
          onMarkAllOutcomeNoticesSent={
            onMarkAllOutcomeNoticesSent
          }
          loading={loading}
        />

      </div>
    </div>
  );
}

export default AwardWorkflowModal;