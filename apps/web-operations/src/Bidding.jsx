import {
  AlertTriangle,
  BadgeDollarSign,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Clock3,
  PackageCheck,
  Send,
  Star,
} from "lucide-react";

import BiddingOrdersTable from "./bidding/components/BiddingOrdersTable";
import AwardWorkflowPanel from "./bidding/components/AwardWorkflowPanel";
import AwardWorkflowModal from "./bidding/components/AwardWorkflowModal";
import ScoreDetailsModal from "./bidding/components/ScoreDetailsModal";
import MiniStatusCard from "./bidding/components/MiniStatusCard";
import OrderTableCell from "./bidding/components/OrderTableCell";
import TimerInput from "./bidding/components/TimerInput";
import SummaryCard from "./bidding/components/SummaryCard";

import useBiddingController from "./bidding/hooks/useBiddingController";

function Bidding(props) {
  const {
    activeTab,
    awardActionLoading,
    awardState,
    bidAcceptedOrders,
    biddingStatusLoaded,
    bids,
    calculateSupplierScore,
    closeBidding,
    confirmCloseBidding,
    confirmTimer,
    createdOrders,
    currentAwardWorkflowLabel,
    currentAwardWorkflowState,
    detailMode,
    displayOrder,
    displayedBids,
    extendTimerPopup,
    fastestEtaBids,
    formatEta,
    formatMoney,
    formatTime,
    freshWinningBid,
    getAwardStateForOrder,
    getBidCountForOrder,
    getBidStatus,
    getComplianceClass,
    getLogisticsStateForOrder,
    getNotificationStatus,
    getOrderReference,
    getRecommendation,
    getSupplierIcon,
    getUnsuccessfulBids,
    getWinnerForOrder,
    highestRatedBid,
    isAwardCompleted,
    isBidResultOrder,
    isBiddingFinalized,
    isBiddingOpen,
    isLoading,
    isOrdersLoading,
    isOutcomeNoticeSent,
    isSupplierConfirmed,
    lowestPriceBid,
    markAllOutcomeNoticesSent,
    markOutcomeNoticeSent,
    markSelectedSupplierNoticeSent,
    maxShortlistCount,
    minShortlistCount,
    onNavigate,
    openBiddingOrders,
    openBulkUnsuccessfulBccEmail,
    openSupplierResultEmail,
    openTimerPopup,
    orders,
    recordSupplierResponse,
    renderStars,
    savingShortlistBidId,
    selectBiddingOrder,
    selectWinningBid,
    selectedBidForDetails,
    selectedOrder,
    selectedOrderReference,
    selectedOrderStatus,
    selectedWinnerSummary,
    sendShortlistedToLogistics,
    sentToLogistics,
    setSelectedBidForDetails,
    setShowBidAcceptedOrders,
    setShowCloseConfirm,
    setShowCreatedOrders,
    setShowOpenBiddingOrders,
    setShowOrderDetails,
    setShowTimerPopup,
    setShowWinnerPopup,
    setSortBy,
    setTimerInput,
    setWinningBid,
    shortlistedBidIds,
    shouldShowAwardWorkflowPanel,
    showBidAcceptedOrders,
    showCloseConfirm,
    showCreatedOrders,
    showOpenBiddingOrders,
    showOrderDetails,
    showTimerPopup,
    showWinnerPopup,
    sortBy,
    timeLeft,
    timerInput,
    timerMode,
    toggleShortlist,
  } = useBiddingController(props);

  return (
    <div className="bg-[#EBF4FF] p-5 min-h-full">
      <div className="max-w-[1500px] mx-auto space-y-4">

        {!detailMode && (
          <>
        <BiddingOrdersTable
          title="Created Orders"
          subtitle="Orders ready to start supplier bidding"
          orders={createdOrders}
          expanded={showCreatedOrders}
          onToggle={() => setShowCreatedOrders((prev) => !prev)}
          onSelectOrder={selectBiddingOrder}
          selectedOrderReference={selectedOrderReference}
          getOrderReference={getOrderReference}
          getBidCountForOrder={getBidCountForOrder}
          getWinnerForOrder={getWinnerForOrder}
          isLoading={isOrdersLoading}
          actionLabel="Open Bidding"
          tableMode="created"
          searchPlaceholder="Search by order ID, route, cargo, container or type..."
        />

        <BiddingOrdersTable
          title="Open Bidding Orders"
          subtitle="Orders currently in the bidding stage"
          orders={openBiddingOrders}
          expanded={showOpenBiddingOrders}
          onToggle={() => setShowOpenBiddingOrders((prev) => !prev)}
          onSelectOrder={selectBiddingOrder}
          selectedOrderReference={selectedOrderReference}
          getOrderReference={getOrderReference}
          getBidCountForOrder={getBidCountForOrder}
          getWinnerForOrder={getWinnerForOrder}
          isLoading={isOrdersLoading}
          actionLabel="View Bids"
          tableMode="open"
          searchPlaceholder="Search by order ID, route, cargo, container or type..."
        />

        <BiddingOrdersTable
          title="Bidding Closed / Result Orders"
          subtitle="Closed bidding and persistent supplier award workflow states"
          orders={bidAcceptedOrders}
          expanded={showBidAcceptedOrders}
          onToggle={() => setShowBidAcceptedOrders((prev) => !prev)}
          onSelectOrder={selectBiddingOrder}
          selectedOrderReference={selectedOrderReference}
          getOrderReference={getOrderReference}
          getBidCountForOrder={getBidCountForOrder}
          getWinnerForOrder={getWinnerForOrder}
          getLogisticsStateForOrder={getLogisticsStateForOrder}
          getAwardStateForOrder={getAwardStateForOrder}
          isLoading={isOrdersLoading}
          actionLabel="View Bid Result"
          tableMode="result"
          searchPlaceholder="Search by order ID, selected supplier, route, container or status..."
          showWinnerColumns
        />
          </>
        )}

        {detailMode && !selectedOrder && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-[#1E293B]">
              Loading bidding workspace...
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Loading the selected order and its bidding workflow.
            </p>
          </div>
        )}

        {detailMode && selectedOrder && (
          <div className="w-full">
            <div className="bg-[#EBF4FF] w-full rounded-2xl shadow-sm border border-white/70 overflow-hidden">
              <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#052659] flex items-center justify-center shrink-0">
                    <PackageCheck className="text-white" size={20} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#1E293B] truncate">
                      {isBidResultOrder
                        ? "Bid Result"
                        : selectedOrderStatus === "created"
                        ? "Open Bidding"
                        : "Bidding Details"}
                    </h2>

                    <p className="text-xs text-slate-500 truncate">
                      {displayOrder.orderReference} ·{" "}
                      {isBidResultOrder
                        ? "Historical bidding result"
                        : selectedOrderStatus === "created"
                        ? "Review this order and start supplier bidding"
                        : "Supplier bidding workspace"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onNavigate &&
                    onNavigate("/bidding")
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#052659] transition hover:bg-[#EBF4FF]"
                  title="Back to Bidding"
                >
                  <ChevronLeft size={16} />
                  Back to Bidding
                </button>
              </div>

              <div className="p-4 md:p-5">
                <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

          <MiniStatusCard
            title="Status"
            value={
              !selectedOrder
                ? "Select Order"
                : !biddingStatusLoaded
                ? "Loading..."
                : currentAwardWorkflowState
                ? currentAwardWorkflowLabel
                : isBiddingOpen
                ? "Bidding Open"
                : activeTab === "Closed"
                ? "Bidding Closed"
                : "Not Started"
            }
            type={
              isAwardCompleted
                ? "success"
                : [
                    "alternate_supplier_selection_required",
                    "bidding_closed_no_bids",
                  ].includes(currentAwardWorkflowState)
                ? "danger"
                : currentAwardWorkflowState
                ? "primary"
                : isBiddingOpen
                ? "success"
                : activeTab === "Closed"
                ? "danger"
                : "neutral"
            }
          />

          <MiniStatusCard
            title="Bidding Timer"
            value={
              !selectedOrder
                ? "-"
                : !biddingStatusLoaded
                ? "Loading..."
                : isBiddingFinalized
                ? "Closed / Locked"
                : isBiddingOpen
                ? formatTime(timeLeft)
                : activeTab === "Closed"
                ? "Closed"
                : "Not Started"
            }
            type={
              isBiddingFinalized || activeTab === "Closed"
                ? "danger"
                : isBiddingOpen
                ? "success"
                : "neutral"
            }
          />

          <MiniStatusCard
            title="Available Bids"
            value={bids.length}
            type="primary"
          />

          <MiniStatusCard
            title="Selected Supplier"
            value={
              selectedWinnerSummary?.supplier
                ? selectedWinnerSummary.supplier
                : currentAwardWorkflowState ===
                  "alternate_supplier_selection_required"
                ? "Selection Required"
                : currentAwardWorkflowState ===
                    "awaiting_logistics_selection"
                ? "Awaiting Logistics"
                : currentAwardWorkflowState
                ? "Not Yet Selected"
                : "Not Selected"
            }
            type={
              isSupplierConfirmed
                ? "success"
                : selectedWinnerSummary?.supplier
                ? "primary"
                : "neutral"
            }
          />

        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-[#1E40AF] flex items-center justify-center shrink-0">

                <PackageCheck
                  className="text-white"
                  size={20}
                />


              </div>

              <div>

                <h3 className="text-base font-semibold text-[#1E293B]">
                  Order Details
                </h3>

                <p className="text-xs text-slate-500">
                  {displayOrder.orderReference}
                </p>

              </div>

            </div>

            <button
              onClick={() =>
                setShowOrderDetails(
                  !showOrderDetails
                )

              }
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#1E40AF] hover:bg-[#EFF6FF] transition"
            >

              <ChevronDown
                size={20}
                className={`transition-transform duration-300 ${
                  showOrderDetails
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

          </div>

          {showOrderDetails && (
            <div className="overflow-x-auto">

              <table className="w-full text-sm table-fixed">

                <tbody>

                  <tr className="border-b border-slate-100">

                    <OrderTableCell
                      label="Order ID"
                      value={displayOrder.orderReference}
                    />

                    <OrderTableCell
                      label="Type"
                      value={displayOrder.orderType}
                    />

                    <OrderTableCell
                      label="Cargo Type"
                      value={displayOrder.cargoType}
                    />

                    <OrderTableCell
                      label="Cargo Weight"
                      value={
                        displayOrder.cargoWeight !== "-"
                          ? `${displayOrder.cargoWeight} kg`
                          : "-"
                      }
                    />

                    <OrderTableCell
                      label="Vehicle Type"
                      value={displayOrder.vehicleType}
                    />

                    <OrderTableCell
                      label="Container No"
                      value={displayOrder.container}
                    />

                  </tr>

                  <tr className="border-b border-slate-100">

                    <OrderTableCell
                      label="Pickup District"
                      value={displayOrder.pickupDistrict}
                    />

                    <OrderTableCell
                      label="Pickup Location"
                      value={displayOrder.pickupLocation}
                      colSpan={2}
                    />

                    <OrderTableCell
                      label="Destination District"
                      value={displayOrder.destinationDistrict}
                    />

                    <OrderTableCell
                      label="Destination Location"
                      value={displayOrder.destinationLocation}
                      colSpan={2}
                    />

                  </tr>

                  <tr>

                    <OrderTableCell
                      label="Pickup Date"
                      value={formatEta(displayOrder.pickupDate)}
                    />

                    <OrderTableCell
                      label="Expected Arrival"
                      value={formatEta(displayOrder.expectedArrival)}
                    />

                    <OrderTableCell
                      label="Current Status"
                      value={
                        selectedOrderStatus
                          ? selectedOrderStatus
                              .replaceAll("_", " ")
                              .replace(/\b\w/g, (char) => char.toUpperCase())
                          : "-"
                      }
                    />

                    <OrderTableCell
                      label="Special Instructions"
                      value={displayOrder.specialInstructions}
                      colSpan={3}
                    />

                  </tr>

                </tbody>

              </table>

            </div>
          )}

        </div>

        {selectedOrder && (
          <div className="space-y-3">

            <div className="flex justify-end items-center gap-2 flex-wrap">

              {selectedOrderStatus === "created" &&
                !isBiddingOpen &&
                !isBiddingFinalized && (
                  <button
                    onClick={openTimerPopup}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#052659] text-white hover:bg-[#5483B3] transition"
                  >
                    Start Bidding
                  </button>
                )}

              {isBiddingOpen && !isBiddingFinalized && (
                <>
                  <button
                    onClick={extendTimerPopup}
                    className="border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium bg-white text-[#052659] hover:bg-[#EFF6FF]"
                  >
                    Extend Timer
                  </button>

                  <button
                    onClick={closeBidding}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#DC2626] text-white hover:bg-red-700"
                  >
                    Close Bidding
                  </button>
                </>
              )}

              {currentAwardWorkflowState === "bidding_closed_no_bids" &&
                !isBiddingOpen &&
                !sentToLogistics && (
                  <button
                    onClick={extendTimerPopup}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#052659] text-white hover:bg-[#5483B3] transition"
                  >
                    Extend Bidding Timer
                  </button>
                )}

              {!isBiddingFinalized &&
                selectedOrderStatus === "open_for_bids" && (
                  <button
                    onClick={sendShortlistedToLogistics}
                    disabled={
                      isBiddingOpen ||
                      bids.length === 0 ||
                      shortlistedBidIds.length === 0 ||
                      shortlistedBidIds.length > 5
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      !isBiddingOpen &&
                      shortlistedBidIds.length >= minShortlistCount &&
                      shortlistedBidIds.length <= maxShortlistCount
                        ? "bg-[#052659] text-white hover:bg-[#5483B3]"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Send size={16} />
                    {bids.length > 0
                      ? `Finalize Shortlist (${shortlistedBidIds.length} selected · min ${minShortlistCount} / max ${maxShortlistCount})`
                      : "Finalize Shortlist"}
                  </button>
                )}

              {isBiddingFinalized && (
                <>
                  <button
                    type="button"
                    disabled
                    className="border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
                  >
                    Timer Locked
                  </button>

                  <button
                    type="button"
                    disabled
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-not-allowed ${
                      isAwardCompleted
                        ? "bg-green-100 text-[#16A34A] border border-green-200"
                        : "bg-blue-50 text-[#052659] border border-blue-100"
                    }`}
                  >
                    {isAwardCompleted ? (
                      <CircleCheck size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    {currentAwardWorkflowLabel}
                  </button>
                </>
              )}

            </div>

            {shouldShowAwardWorkflowPanel && (
              <AwardWorkflowPanel
                awardState={awardState}
                workflowState={currentAwardWorkflowState}
                workflowLabel={currentAwardWorkflowLabel}
                selectedBid={selectedWinnerSummary}
                shortlistedCount={awardState?.draftShortlistCount || 0}
                unsuccessfulBids={getUnsuccessfulBids()}
                formatMoney={formatMoney}
                formatEta={formatEta}
                openSupplierResultEmail={openSupplierResultEmail}
                onOpenBulkUnsuccessfulBccEmail={openBulkUnsuccessfulBccEmail}
                onMarkSelectedNoticeSent={markSelectedSupplierNoticeSent}
                onRecordSupplierResponse={recordSupplierResponse}
                onMarkOutcomeNoticeSent={markOutcomeNoticeSent}
                onMarkAllOutcomeNoticesSent={markAllOutcomeNoticesSent}
                loading={awardActionLoading}
              />
            )}

          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <SummaryCard
            icon={
              <BadgeDollarSign
                className="text-[#16A34A]"
                size={22}
              />
            }
            title="Lowest Price"
            value={
              lowestPriceBid
                ? formatMoney(
                    lowestPriceBid.amount
                  )
                : "-"
            }
            subtitle={
              lowestPriceBid?.supplier ||
              "No bids available"
            }
            tag={
              lowestPriceBid
                ? "Best Price"
                : ""
            }
            tagClass="bg-green-100 text-[#16A34A]"
          />

          <SummaryCard
            icon={
              <Clock3
                className="text-[#1E40AF]"
                size={22}
              />
            }

            title="Fastest ETA"
            value={
              fastestEtaBids.length >
              0
                ? formatEta(
                    fastestEtaBids[0]
                      .eta
                  )
                : "-"
            }
            subtitle={
              fastestEtaBids.length >
              0
                ? fastestEtaBids
                    .map(
                      (bid) =>
                        bid.supplier
                    )
                    .join(", ")
                : "No ETA available"
            }
          />

          <SummaryCard
            icon={
              <Star
                className="text-[#EA580C]"
                size={22}
              />
            }
            title="Highest Rating"
            value={
              highestRatedBid
                ? `${highestRatedBid.rating.toFixed(
                    1
                  )} / 5`
                : "-"
            }
            subtitle={
              highestRatedBid?.supplier ||
              "No ratings available"
            }
            tag={
              highestRatedBid
                ? "Top Rated"
                : ""
            }
            tagClass="bg-orange-100 text-[#EA580C]"
          />

        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-3">

            <h3 className="text-lg font-semibold text-[#1E293B]">
              Supplier Bids Comparison
            </h3>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort supplier bids"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#1E293B] bg-white outline-none focus:border-[#5483B3] focus:ring-2 focus:ring-[#EBF4FF]"
            >
              <option value="Lowest Price">Lowest Price</option>
              <option value="Highest Rating">Highest Rating</option>
              <option value="Compliance">Compliance</option>
            </select>

          </div>

          <div className="overflow-x-auto">

            {isLoading ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading bids...
              </div>
            ) : displayedBids.length ===
              0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                No bids found for this order.
              </div>
            ) : (
              <table className="w-full text-sm border-separate border-spacing-0">

                <thead className="bg-[#EFF6FF] text-[#1E293B]">


                  <tr>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Supplier
                    </th>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Bid Amount
                    </th>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      ETA ↓
                    </th>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Rating
                    </th>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Compliance
                    </th>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Past Performance
                    </th>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Score
                    </th>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Bid Status
                    </th>

                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Notification
                    </th>

                    <th className="text-center px-3 py-3 font-semibold text-[13px]">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {displayedBids.map(
                    (bid) => {
                      const isLowest =
                        lowestPriceBid?.id ===
                        bid.id;


                      const isShortlisted =
                        shortlistedBidIds.some(
                          (id) => Number(id) === Number(bid.id)
                        );

                      const isWinner =
                        freshWinningBid &&
                        Number(freshWinningBid.id) === Number(bid.id);

                      const recommendation =
                        getRecommendation(
                          bid
                        );

                      const score =
                        calculateSupplierScore(
                          bid
                        );

                      return (
                        <tr
                          key={
                            bid.id
                          }
                          className={
                            isWinner
                              ? "bg-green-50"
                              : isShortlisted ||
                                isLowest
                              ? "bg-[#EFF6FF]"
                              : "bg-white"
                          }
                        >

                          <td className="px-3 py-3 border-b border-slate-100">

                            <div className="flex items-center gap-2">

                              {isShortlisted && (
                                <div className="text-[9px] font-bold px-2 py-1 rounded-md w-[78px] text-center bg-[#EFF6FF] text-[#1E40AF] border border-[#1E40AF]">
                                  SHORTLIST
                                </div>
                              )}

                              {isWinner && (
                                <div
                                  className={`text-[9px] font-bold px-2 py-1 rounded-md w-[86px] text-center border ${
                                    isSupplierConfirmed
                                      ? "bg-green-100 text-[#16A34A] border-green-200"
                                      : "bg-blue-100 text-[#1E40AF] border-blue-200"
                                  }`}
                                >
                                  {isSupplierConfirmed ? "CONFIRMED" : "SELECTED"}
                                </div>
                              )}

                              {getSupplierIcon(
                                bid.supplier
                              )}

                              <div>

                                <p className="font-medium text-sm text-[#1E293B]">
                                  {
                                    bid.supplier
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  {
                                    bid.years
                                  }
                                </p>

                                <p className="text-[11px] text-slate-400">

                                  {bid.supplierEmail ||
                                    "No email"}{" "}

                                  {bid.supplierPhone
                                    ? `• ${bid.supplierPhone}`
                                    : "• No phone"}

                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-3 py-3 border-b border-slate-100 text-sm font-medium text-[#16A34A]">
                            {formatMoney(
                              bid.amount
                            )}
                          </td>

                          <td className="px-3 py-3 border-b border-slate-100">

                            <p className="text-sm text-[#1E293B]">
                              {formatEta(
                                bid.eta
                              )}
                            </p>

                            {fastestEtaBids.some(
                              (item) =>
                                item.id ===
                                bid.id
                            ) && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-100 text-[#16A34A] text-xs">
                                Fastest

                              </span>
                            )}

                          </td>

                          <td className="px-3 py-3 border-b border-slate-100">
                            {renderStars(
                              bid.rating
                            )}
                          </td>

                          <td className="px-3 py-3 border-b border-slate-100">

                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs ${getComplianceClass(
                                bid.compliance
                              )}`}
                            >

                              {bid.compliance ===
                                "Verified" ||
                              bid.compliance ===
                                "Completed" ? (
                                <CircleCheck
                                  size={12}
                                />
                              ) : (
                                <CircleAlert
                                  size={12}
                                />
                              )}

                              {
                                bid.compliance
                              }

                            </span>

                          </td>

                          <td className="px-3 py-3 border-b border-slate-100 text-xs text-slate-600 max-w-[220px]">
                            {
                              bid.pastPerformance
                            }
                          </td>

                          <td className="px-3 py-3 border-b border-slate-100">

                            <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1E40AF] text-xs font-semibold">
                              {
                                score.totalScore
                              }
                              /100
                            </span>

                          </td>

                          <td className="px-3 py-3 border-b border-slate-100">

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs ${
                                getBidStatus(bid) === "Shortlisted" ||
                                getBidStatus(bid) === "Selected by Logistics" ||
                                getBidStatus(bid) === "Awaiting Response"
                                  ? "bg-[#EFF6FF] text-[#1E40AF]"
                                  : getBidStatus(bid) === "Confirmed Supplier" ||
                                    getBidStatus(bid) === "Unsuccessful - Notified"
                                  ? "bg-green-100 text-[#16A34A]"
                                  : getBidStatus(bid) === "Supplier Declined" ||
                                    getBidStatus(bid) === "Declined Earlier" ||
                                    getBidStatus(bid) === "Unsuccessful"
                                  ? "bg-red-100 text-[#DC2626]"
                                  : getBidStatus(bid) === "Awaiting Logistics" ||
                                    getBidStatus(bid) === "Available for Alternate"
                                  ? "bg-orange-100 text-[#EA580C]"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {getBidStatus(
                                bid
                              )}
                            </span>

                          </td>

                          <td className="px-3 py-3 border-b border-slate-100 text-xs">
                            {(() => {
                              const notificationStatus =
                                getNotificationStatus(bid);

                              const notificationClass =
                                notificationStatus === "Supplier Confirmed" ||
                                notificationStatus === "Result Sent"
                                  ? "bg-green-100 text-[#16A34A]"
                                  : notificationStatus === "Supplier Declined" ||
                                    notificationStatus ===
                                      "Declined - No Final Result"
                                  ? "bg-red-100 text-[#DC2626]"
                                  : notificationStatus === "Selected Notice Pending" ||
                                    notificationStatus === "Result Pending" ||
                                    notificationStatus === "Awaiting Logistics"
                                  ? "bg-orange-100 text-[#EA580C]"
                                  : notificationStatus === "Selected Notice Sent"
                                  ? "bg-blue-100 text-[#1E40AF]"
                                  : "bg-slate-100 text-slate-600";

                              return (
                                <span
                                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${notificationClass}`}
                                >
                                  {notificationStatus}
                                </span>
                              );
                            })()}
                          </td>

                          <td className="px-3 py-3 border-b border-slate-100 text-center">

                            <div className="flex items-center justify-center gap-2">

                              <button
                                onClick={() =>
                                  setSelectedBidForDetails(
                                    bid
                                  )
                                }
                                className="border border-slate-200 text-[#1E40AF] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#EFF6FF]"
                              >
                                View Details
                              </button>

                              {sentToLogistics &&
                                isShortlisted &&
                                !isWinner &&
                                [
                                  "awaiting_logistics_selection",
                                  "alternate_supplier_selection_required",
                                ].includes(currentAwardWorkflowState) &&
                                getBidStatus(bid) !== "Declined Earlier" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      selectWinningBid(bid)
                                    }
                                    disabled={awardActionLoading}
                                    className="border border-[#052659] bg-[#052659] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#5483B3] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {awardActionLoading
                                      ? "Selecting..."
                                      : currentAwardWorkflowState ===
                                        "alternate_supplier_selection_required"
                                      ? "Select Alternate"
                                      : "Select Winner"}
                                  </button>
                                )}
                              {isWinner ? (
                                <>
                                  {currentAwardWorkflowState ===
                                    "selected_supplier_notice_pending" && (
                                    <button
                                      onClick={() =>
                                        openSupplierResultEmail(bid, "selected")
                                      }
                                      className="border border-blue-200 bg-blue-50 text-[#1E40AF] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100"
                                    >
                                      Open Selected Email
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setWinningBid(bid);
                                      setShowWinnerPopup(true);
                                    }}
                                    className="border border-[#052659] bg-[#052659] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#5483B3]"
                                  >
                                    Award Center
                                  </button>
                                </>
                              ) : !sentToLogistics ? (
                                <button
                                  onClick={() => toggleShortlist(bid.id)}
                                  disabled={
                                    isBiddingOpen ||
                                    savingShortlistBidId !== null ||
                                    bids.length === 0 ||
                                    (!isShortlisted &&
                                      shortlistedBidIds.length >=
                                        maxShortlistCount)
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                    isBiddingOpen
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      : isShortlisted
                                      ? "bg-green-50 text-[#16A34A] border border-green-200 hover:bg-green-100"
                                      : bids.length === 0 ||
                                        shortlistedBidIds.length >= maxShortlistCount
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      : "border border-[#1E40AF] text-[#1E40AF] hover:bg-[#EFF6FF]"
                                  }`}
                                >
                                  {Number(savingShortlistBidId) === Number(bid.id)
                                    ? "Saving..."
                                    : isBiddingOpen
                                    ? "Bidding Open"
                                    : isShortlisted
                                    ? "Remove"
                                    : bids.length === 0
                                    ? "No Bids"
                                    : shortlistedBidIds.length >=
                                      maxShortlistCount
                                    ? "Limit Reached"
                                    : "Shortlist"}
                                </button>
                              ) :
                                !isWinner &&
                                [
                                  "unsuccessful_supplier_notifications_pending",
                                  "award_completed",
                                ].includes(currentAwardWorkflowState) ? (
                                <button
                                  type="button"
                                  disabled
                                  className="border border-slate-200 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed"
                                >
                                  {isOutcomeNoticeSent(bid)
                                    ? "Result Sent"
                                    : "Use Award Center"}
                                </button>
                              ) : isShortlisted &&
                                currentAwardWorkflowState ===
                                  "alternate_supplier_selection_required" ? (
                                <button
                                  disabled
                                  className="border border-orange-200 bg-orange-50 text-[#EA580C] px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed"
                                >
                                  Available for Alternate
                                </button>
                              ) : isShortlisted ? (
                                <button
                                  disabled
                                  className="border border-slate-200 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed"
                                >
                                  Shortlisted
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Not shortlisted
                                </span>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>
            )}

          </div>

        </div>


                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {selectedBidForDetails && (
        <ScoreDetailsModal
          bid={selectedBidForDetails}
          score={calculateSupplierScore(
            selectedBidForDetails
          )}
          formatMoney={formatMoney}
          formatEta={formatEta}
          onClose={() =>
            setSelectedBidForDetails(
              null
            )
          }
        />
      )}

      {showWinnerPopup && freshWinningBid && (
        <AwardWorkflowModal
          bid={freshWinningBid}
          awardState={awardState}
          workflowState={currentAwardWorkflowState}
          workflowLabel={currentAwardWorkflowLabel}
          unsuccessfulBids={getUnsuccessfulBids()}
          orderReference={displayOrder.orderReference}
          formatMoney={formatMoney}
          formatEta={formatEta}
          openSupplierResultEmail={openSupplierResultEmail}
          onOpenBulkUnsuccessfulBccEmail={openBulkUnsuccessfulBccEmail}
          onMarkSelectedNoticeSent={markSelectedSupplierNoticeSent}
          onRecordSupplierResponse={recordSupplierResponse}
          onMarkOutcomeNoticeSent={markOutcomeNoticeSent}
          onMarkAllOutcomeNoticesSent={markAllOutcomeNoticesSent}
          loading={awardActionLoading}
          onClose={() => setShowWinnerPopup(false)}
        />
      )}

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">

          <div className="bg-white rounded-xl shadow-lg w-[380px] p-6">

            <div className="flex items-center gap-3 mb-4">

              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">

                <AlertTriangle
                  className="text-[#DC2626]"
                  size={22}
                />

              </div>

              <div>

                <h3 className="text-lg font-semibold text-[#1E293B]">
                  Close Bidding?
                </h3>

                <p className="text-sm text-slate-500">
                  Are you sure you want to close the bid?
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowCloseConfirm(
                    false
                  )
                }
                className="px-4 py-2 rounded-md border border-slate-200 text-sm text-[#1E293B]"
              >
                Cancel
              </button>

              <button
                onClick={confirmCloseBidding}
                className="px-4 py-2 rounded-md bg-[#DC2626] text-white text-sm"
              >
                Yes, Close Bid
              </button>

            </div>

          </div>

        </div>
      )}

      {showTimerPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">

          <div className="bg-white rounded-xl shadow-lg w-[420px] p-6">

            <h3 className="text-lg font-semibold text-[#1E293B] mb-4">

              {timerMode ===
              "open"
                ? "Set Bidding Timer"
                : "Extend Bidding Timer"}

            </h3>

            <div className="grid grid-cols-4 gap-3 mb-5">

              <TimerInput
                label="Days"
                value={timerInput.days}
                onChange={(value) =>
                  setTimerInput({
                    ...timerInput,
                    days: value,
                  })
                }
              />

              <TimerInput
                label="Hours"
                value={timerInput.hours}
                onChange={(value) =>
                  setTimerInput({
                    ...timerInput,
                    hours: value,
                  })
                }
              />

              <TimerInput
                label="Minutes"
                value={timerInput.minutes}
                onChange={(value) =>
                  setTimerInput({
                    ...timerInput,
                    minutes: value,
                  })
                }
              />

              <TimerInput
                label="Seconds"
                value={timerInput.seconds}
                onChange={(value) =>
                  setTimerInput({
                    ...timerInput,
                    seconds: value,
                  })
                }
              />

            </div>

            <div className="flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowTimerPopup(
                    false
                  )
                }
                className="px-4 py-2 rounded-md border border-slate-200 text-sm text-[#1E293B]"
              >
                Cancel
              </button>

              <button
                onClick={confirmTimer}
                className="px-4 py-2 rounded-md bg-[#052659] text-white text-sm"
              >
                {timerMode ===
                "open"
                  ? "Start Bidding"
                  : "Add Time"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Bidding;
