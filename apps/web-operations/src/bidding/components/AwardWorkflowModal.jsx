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
  loading,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="max-h-[90vh] w-[900px] max-w-[94vw] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#1E293B]">
              Supplier Award Center
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {orderReference} · {workflowLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close award center"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
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
          loading={loading}
        />

      </div>
    </div>
  );
}

export default AwardWorkflowModal;