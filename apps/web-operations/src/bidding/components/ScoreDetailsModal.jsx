function ScoreDetailsModal({
  bid,
  score,
  formatMoney,
  formatEta,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-2xl shadow-lg w-[520px] max-w-[92vw] p-6">

        <div className="flex justify-between items-start gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#1E293B]">
              Supplier Score Details
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              {bid.supplier}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close score details"
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">

          <ScoreBox
            label="Price Score"
            value={`${score.priceScore} / 40`}
            note={formatMoney(bid.amount)}
          />

          <ScoreBox
            label="ETA Score"
            value={`${score.etaScore} / 20`}
            note={formatEta(bid.eta)}
          />

          <ScoreBox
            label="Rating Score"
            value={`${score.ratingScore} / 20`}
            note={`${Number(
              bid.rating || 0
            ).toFixed(1)} / 5`}
          />

          <ScoreBox
            label="Compliance Score"
            value={`${score.complianceScore} / 20`}
            note={bid.compliance}
          />

        </div>

        <div className="bg-[#EFF6FF] border border-blue-100 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">
              Total Score
            </p>

            <h2 className="text-2xl font-bold text-[#052659] mt-1">
              {score.totalScore} / 100
            </h2>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">
              Score Basis
            </p>

            <p className="text-sm font-semibold text-[#1E293B] mt-1">
              Price 40% + ETA 20% + Rating 20% + Compliance 20%
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#052659] text-white text-sm font-semibold hover:bg-[#5483B3]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  note,
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <h4 className="text-lg font-bold text-[#1E293B] mt-1">
        {value}
      </h4>

      <p className="text-xs text-slate-500 mt-1">
        {note}
      </p>
    </div>
  );
}

export default ScoreDetailsModal;