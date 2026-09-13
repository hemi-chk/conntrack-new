import {
  PackageCheck,
} from "lucide-react";

function MiniStatusCard({
  title,
  value,
  type = "neutral",
}) {
  const styles = {
    success: {
      box:
        "bg-green-50 border-green-100",
      icon:
        "bg-green-100 text-[#16A34A]",
      value:
        "text-[#16A34A]",
    },

    danger: {
      box:
        "bg-red-50 border-red-100",
      icon:
        "bg-red-100 text-[#DC2626]",
      value:
        "text-[#DC2626]",
    },

    primary: {
      box:
        "bg-blue-50 border-blue-100",
      icon:
        "bg-[#EFF6FF] text-[#1E40AF]",
      value:
        "text-[#1E40AF]",

    },

    neutral: {
      box:
        "bg-white border-slate-200",
      icon:
        "bg-slate-100 text-slate-600",
      value:
        "text-[#1E293B]",
    },
  };

  const selected =
    styles[type] ||
    styles.neutral;

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 shadow-sm flex items-center justify-between w-full max-w-[240px] min-h-[70px] ${selected.box}`}
    >

      <div className="min-w-0">

        <p className="text-[11px] text-slate-500">
          {title}
        </p>

        <h3
          className={`text-base font-semibold mt-0.5 ${selected.value}`}
        >
          {value}
        </h3>

      </div>

      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${selected.icon}`}
      >
        <PackageCheck size={15} />
      </div>

    </div>
  );
}



export default MiniStatusCard;
