import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AWARD_STATUS_PROCESS_ORDER,
  BIDDING_ORDERS_PER_PAGE,
} from "../utils/biddingUtils";

function BiddingOrdersTable({
  title,
  subtitle,
  orders,
  expanded,
  onToggle,
  onSelectOrder,
  selectedOrderReference,
  getOrderReference,
  getBidCountForOrder,
  getWinnerForOrder,
  getLogisticsStateForOrder,
  getAwardStateForOrder,
  isLoading,
  actionLabel,
  searchPlaceholder = "Search orders...",
  showWinnerColumns = false,
  tableMode = "created",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [awardStatusFilter, setAwardStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Column visibility by workflow stage:
  // Created Orders: no Bids / no Order Status (both are obvious here).
  // Open Bidding Orders: keep Bids, hide Order Status (already obvious).
  // Result Orders: keep Bids and Order Status plus result-specific columns.
  const showBidsColumn = tableMode !== "created";
  const showOrderStatusColumn = tableMode === "result";

  const formatStatus = (value) =>
    String(value || "-")
      .toLowerCase()
      .trim()
      .replaceAll("-", "_")
      .replaceAll(" ", "_")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const normalizeStatus = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replaceAll("-", "_")
      .replaceAll(" ", "_");

  const formatOrderType = (value) => {
    if (!value) return "-";
    const valueText = String(value).toLowerCase();
    return valueText.charAt(0).toUpperCase() + valueText.slice(1);
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined || Number(value) <= 0) {
      return "-";
    }

    return `LKR ${Number(value).toLocaleString()}`;
  };

  const getLogisticsState = (order) => {
    const award = getAwardStateForOrder?.(order);
    const workflowState = normalizeStatus(award?.awardWorkflowState);

    const labels = {
      bidding_closed_no_bids: "No Bids Received",
      shortlisting_required: "Shortlisting Required",
      shortlist_ready_to_send: "Shortlist Ready - Send to Logistics",
      awaiting_logistics_selection: "Awaiting Logistics Selection",
      selected_supplier_notice_pending: "Selected Notice Pending",
      awaiting_supplier_response: "Awaiting Supplier Response",
      alternate_supplier_selection_required: "Alternate Selection Required",
      unsuccessful_supplier_notifications_pending: "Notifications Pending",
      award_completed: "Award Completed",
    };

    if (!workflowState) {
      return {
        label: "Workflow State Unavailable",
        className: "bg-slate-100 text-slate-600",
      };
    }

    return {
      label: labels[workflowState] || formatStatus(workflowState),
      className:
        workflowState === "award_completed"
          ? "bg-green-100 text-[#16A34A]"
          : [
              "alternate_supplier_selection_required",
              "bidding_closed_no_bids",
            ].includes(workflowState)
          ? "bg-red-100 text-[#DC2626]"
          : [
              "shortlisting_required",
              "shortlist_ready_to_send",
              "selected_supplier_notice_pending",
              "unsuccessful_supplier_notifications_pending",
            ].includes(workflowState)
          ? "bg-orange-100 text-[#EA580C]"
          : "bg-blue-100 text-[#1E40AF]",
    };
  };

  const awardStatusOptions =
    tableMode === "result"
      ? (() => {
          const presentStatuses = Array.from(
            new Set(
              orders
                .map((order) => getLogisticsState(order)?.label)
                .filter(Boolean)
            )
          );

          const orderedKnownStatuses =
            AWARD_STATUS_PROCESS_ORDER.filter((status) =>
              presentStatuses.includes(status)
            );

          const additionalStatuses = presentStatuses
            .filter(
              (status) =>
                !AWARD_STATUS_PROCESS_ORDER.includes(status)
            )
            .sort((a, b) => a.localeCompare(b));

          return [
            ...orderedKnownStatuses,
            ...additionalStatuses,
          ];
        })()
      : [];

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const winner = getWinnerForOrder?.(order);
      const awardStatus = getLogisticsState(order)?.label || "";

      const matchesAwardStatus =
        tableMode !== "result" ||
        awardStatusFilter === "All" ||
        awardStatus === awardStatusFilter;

      if (!matchesAwardStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableValues = [
        getOrderReference(order),
        order?.order_type,
        order?.type,
        order?.pickup_district,
        order?.pickupDistrict,
        order?.pickup_location,
        order?.pickupLocation,
        order?.destination_district,
        order?.destinationDistrict,
        order?.destination_location,
        order?.destinationLocation,
        order?.cargo_type,
        order?.cargoType,
        order?.container_no,
        order?.containerNo,
        order?.vehicle_type,
        order?.vehicleType,
        order?.current_status,
        order?.status,
        order?.driver_name,
        order?.driverName,
        order?.driver_id,
        order?.supplier_name,
        order?.supplier,
        winner?.supplier,
        winner?.amount,
        getBidCountForOrder(order),
        awardStatus,
      ];

      return searchableValues
        .filter((value) => value !== null && value !== undefined)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [
    orders,
    searchTerm,
    awardStatusFilter,
    tableMode,
    getOrderReference,
    getBidCountForOrder,
    getWinnerForOrder,
    getAwardStateForOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / BIDDING_ORDERS_PER_PAGE)
  );

  const activePage = Math.min(currentPage, totalPages);
  const firstOrderIndex =
    (activePage - 1) * BIDDING_ORDERS_PER_PAGE;
  const lastOrderIndex =
    firstOrderIndex + BIDDING_ORDERS_PER_PAGE;

  const paginatedOrders = filteredOrders.slice(
    firstOrderIndex,
    lastOrderIndex
  );

  const showingFrom =
    filteredOrders.length === 0
      ? 0
      : firstOrderIndex + 1;

  const showingTo = Math.min(
    lastOrderIndex,
    filteredOrders.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, awardStatusFilter, orders]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#F8FBFF] transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#EBF4FF] text-[#052659] flex items-center justify-center shrink-0">
            <PackageCheck size={18} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-[#1E293B]">
                {title}
              </h3>

              <span className="min-w-6 h-6 px-2 rounded-full bg-[#052659] text-white text-xs font-semibold flex items-center justify-center">
                {orders.length}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <ChevronDown
          size={20}
          className={`text-[#052659] shrink-0 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
        <div className="px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 max-w-2xl">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-[#F8FBFF] text-sm text-[#1E293B] outline-none focus:border-[#5483B3] focus:ring-2 focus:ring-[#EBF4FF]"
              />
            </div>

            {tableMode === "result" && (
              <select
                value={awardStatusFilter}
                onChange={(e) => setAwardStatusFilter(e.target.value)}
                className="min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1E293B] outline-none focus:border-[#5483B3] focus:ring-2 focus:ring-[#EBF4FF]"
              >
                <option value="All">
                  All Award Statuses
                </option>

                {awardStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {(searchTerm.trim() ||
            (tableMode === "result" && awardStatusFilter !== "All")) && (
            <p className="text-xs text-slate-500 mt-2">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-7 text-center text-sm text-slate-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-7 text-center text-sm text-slate-500">
              No orders found in this section.
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-7 text-center text-sm text-slate-500">
              No orders match your search.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#EFF6FF] text-[#1E293B]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs whitespace-nowrap">
                    Order ID
                  </th>

                  <th className="text-left px-4 py-3 font-semibold text-xs whitespace-nowrap">
                    Type
                  </th>

                  <th className="text-left px-4 py-3 font-semibold text-xs min-w-[220px]">
                    Pickup
                  </th>

                  <th className="text-left px-4 py-3 font-semibold text-xs min-w-[220px]">
                    Destination
                  </th>

                  {showBidsColumn && (
                    <th className="text-center px-4 py-3 font-semibold text-xs whitespace-nowrap">
                      Bids
                    </th>
                  )}

                  {tableMode === "result" && (
                    <th className="text-left px-4 py-3 font-semibold text-xs whitespace-nowrap">
                      Award Status
                    </th>
                  )}

                  {showWinnerColumns && (
                    <>
                      <th className="text-left px-4 py-3 font-semibold text-xs min-w-[190px]">
                        Selected Supplier
                      </th>

                      <th className="text-left px-4 py-3 font-semibold text-xs whitespace-nowrap">
                        Selected Bid
                      </th>
                    </>
                  )}

                  {showOrderStatusColumn && (
                    <th className="text-left px-4 py-3 font-semibold text-xs whitespace-nowrap">
                      Order Status
                    </th>
                  )}

                  <th className="text-center px-4 py-3 font-semibold text-xs whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.map((order) => {
                  const reference = getOrderReference(order);

                  const isSelected =
                    reference &&
                    selectedOrderReference &&
                    String(reference).toLowerCase() ===
                      String(selectedOrderReference).toLowerCase();

                  const winner = getWinnerForOrder?.(order);
                  const logisticsState = getLogisticsState(order);
                  const rowAwardState =
                    getAwardStateForOrder?.(order) || null;
                  const rowSupplierConfirmed =
                    rowAwardState?.supplierConfirmationStatus === "accepted" ||
                    [
                      "unsuccessful_supplier_notifications_pending",
                      "award_completed",
                    ].includes(rowAwardState?.awardWorkflowState);

                  const rowWorkflowState = normalizeStatus(
                    rowAwardState?.awardWorkflowState
                  );

                  const rowPreviousSelectionDeclined =
                    rowWorkflowState ===
                    "alternate_supplier_selection_required";

                  return (
                    <tr
                      key={order.order_id || reference}
                      className={
                        isSelected
                          ? "bg-[#EFF6FF]"
                          : "bg-white hover:bg-slate-50"
                      }
                    >
                      <td className="px-4 py-3 border-t border-slate-100 font-semibold text-[#052659] whitespace-nowrap">
                        {reference || "-"}
                      </td>

                      <td className="px-4 py-3 border-t border-slate-100 text-[#1E293B] whitespace-nowrap">
                        {formatOrderType(order.order_type || order.type)}
                      </td>

                      <td className="px-4 py-3 border-t border-slate-100">
                        <p className="font-medium text-[#1E293B]">
                          {order.pickup_location ||
                            order.pickupLocation ||
                            "-"}
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.pickup_district ||
                            order.pickupDistrict ||
                            "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3 border-t border-slate-100">
                        <p className="font-medium text-[#1E293B]">
                          {order.destination_location ||
                            order.destinationLocation ||
                            "-"}
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.destination_district ||
                            order.destinationDistrict ||
                            "-"}
                        </p>
                      </td>

                      {showBidsColumn && (
                        <td className="px-4 py-3 border-t border-slate-100 text-center">
                          <span className="inline-flex min-w-7 h-7 px-2 items-center justify-center rounded-full bg-[#EBF4FF] text-[#052659] text-xs font-semibold">
                            {getBidCountForOrder(order)}
                          </span>
                        </td>
                      )}

                      {tableMode === "result" && (
                        <td className="px-4 py-3 border-t border-slate-100 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${logisticsState.className}`}
                          >
                            {logisticsState.label}
                          </span>
                        </td>
                      )}

                      {showWinnerColumns && (
                        <>
                          <td className="px-4 py-3 border-t border-slate-100">
                            {winner?.supplier ? (
                              <div>
                                <span className="font-semibold text-[#1E293B]">
                                  {winner.supplier}
                                </span>
                                <p
                                  className={`text-[11px] mt-0.5 font-medium ${
                                    rowPreviousSelectionDeclined
                                      ? "text-[#DC2626]"
                                      : rowSupplierConfirmed
                                      ? "text-[#16A34A]"
                                      : "text-[#1E40AF]"
                                  }`}
                                >
                                  {rowPreviousSelectionDeclined
                                    ? "Previous Selection - Declined"
                                    : rowSupplierConfirmed
                                    ? "Confirmed Supplier"
                                    : "Selected by Logistics"}
                                </p>
                              </div>
                            ) : normalizeStatus(
                                rowAwardState?.awardWorkflowState
                              ) === "awaiting_logistics_selection" ? (
                              <span className="inline-flex px-2.5 py-1 rounded-full bg-orange-50 text-[#EA580C] text-xs font-medium">
                                Awaiting Logistics
                              </span>
                            ) : normalizeStatus(
                                rowAwardState?.awardWorkflowState
                              ) === "alternate_supplier_selection_required" ? (
                              <span className="inline-flex px-2.5 py-1 rounded-full bg-red-50 text-[#DC2626] text-xs font-medium">
                                Selection Required
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">
                                -
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 border-t border-slate-100 text-[#16A34A] font-semibold whitespace-nowrap">
                            {winner ? formatMoney(winner.amount) : "-"}
                          </td>
                        </>
                      )}

                      {showOrderStatusColumn && (
                        <td className="px-4 py-3 border-t border-slate-100 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            {formatStatus(order.current_status || order.status)}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3 border-t border-slate-100 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order)}
                          className="px-3 py-1.5 rounded-lg bg-[#052659] text-white text-xs font-semibold hover:bg-[#5483B3] transition"
                        >
                          {actionLabel}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {showingFrom}â€“{showingTo} of {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "order" : "orders"}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={activePage === 1}
                aria-label="Previous page"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1E293B] transition hover:border-[#052659] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="min-w-[96px] text-center text-sm font-medium text-[#1E293B]">
                Page {activePage} of {totalPages}
              </div>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={activePage === totalPages}
                aria-label="Next page"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1E293B] transition hover:border-[#052659] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}



export default BiddingOrdersTable;
