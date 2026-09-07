function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  tag,
  tagClass,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">

      <div className="flex items-start gap-3">

        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-sm text-slate-600">
            {title}
          </p>

          <h3 className="text-xl font-semibold text-[#1E293B] mt-0.5">
            {value}
          </h3>

          <p className="text-sm text-slate-500 mt-1 break-words">
            {subtitle}
          </p>

          {tag && (
            <span
              className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs ${tagClass}`}
            >
              {tag}
            </span>
          )}

        </div>

      </div>

    </div>
  );
}



export default SummaryCard;
