function TimerInput({
  label,
  value,
  onChange,
}) {
  return (
    <div>

      <label className="text-xs text-slate-500">
        {label}
      </label>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full border border-slate-200 rounded-md px-2 py-2 text-sm mt-1"
      />

    </div>
  );
}



export default TimerInput;
