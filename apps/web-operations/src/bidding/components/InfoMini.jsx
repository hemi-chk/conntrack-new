function InfoMini({
  label,
  value,
  green = false,
}) {
  return (
    <div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`text-sm font-semibold mt-1 break-words ${
          green
            ? "text-[#16A34A]"
            : "text-[#1E293B]"
        }`}
      >
        {value || "-"}
      </p>

    </div>
  );
}



export default InfoMini;
