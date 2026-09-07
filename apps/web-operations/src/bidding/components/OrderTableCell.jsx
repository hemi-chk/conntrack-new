function OrderTableCell({
  label,
  value,
  colSpan = 1,
}) {
  return (
    <td
      colSpan={colSpan}
      className="px-5 py-4 align-top min-w-[150px]"
    >

      <p className="text-xs text-slate-500 mb-1">
        {label}
      </p>

      <p className="text-sm font-semibold text-[#1E293B] break-words">
        {value || "-"}
      </p>

    </td>
  );
}



export default OrderTableCell;
