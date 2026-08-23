import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  Gavel,
  Package,
  Plus,
  RefreshCw,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// Operations backend base URL.
// Uses the hosted API when VITE_API_URL is configured and localhost during local development.
const API_BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000"
}/api/operations`;


function Dashboard({ onNavigate }) {
  // =========================================================
  // DATA STATES
  // =========================================================
  const [orders, setOrders] = useState([]);
  const [issues, setIssues] = useState([]);
  const [trackingRecords, setTrackingRecords] = useState([]);

  // =========================================================
  // UI STATES
  // =========================================================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Summary card filter used to filter the Order Overview table
  const [summaryFilter, setSummaryFilter] = useState("all");

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================
  useEffect(() => {
    fetchDashboardData(true);

    // Quiet refresh so dashboard stays current during evaluation
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // FETCH DASHBOARD DATA
  // =========================================================
  const fetchDashboardData = async (showFullLoader = false) => {
    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setErrorMessage("");

      const [ordersRes, issuesRes, trackingRes] =
        await Promise.allSettled([
          fetch(`${API_BASE_URL}/orders`),
          fetch(`${API_BASE_URL}/issues`),
          fetch(`${API_BASE_URL}/tracking-all-debug`),
        ]);

      // -------------------------
      // ORDERS
      // -------------------------
      if (
        ordersRes.status === "fulfilled" &&
        ordersRes.value.ok
      ) {
        const ordersData =
          await ordersRes.value.json();

        setOrders(
          Array.isArray(ordersData)
            ? ordersData
            : []
        );
      } else {
        setOrders([]);
      }

      // -------------------------
      // ISSUES
      // -------------------------
      if (
        issuesRes.status === "fulfilled" &&
        issuesRes.value.ok
      ) {
        const issuesData =
          await issuesRes.value.json();

        setIssues(
          Array.isArray(issuesData)
            ? issuesData
            : []
        );
      } else {
        setIssues([]);
      }

      // -------------------------
      // TRACKING
      // -------------------------
      if (
        trackingRes.status === "fulfilled" &&
        trackingRes.value.ok
      ) {
        const trackingData =
          await trackingRes.value.json();

        if (Array.isArray(trackingData)) {
          setTrackingRecords(
            trackingData
          );
        } else if (
          Array.isArray(
            trackingData?.data
          )
        ) {
          setTrackingRecords(
            trackingData.data
          );
        } else {
          setTrackingRecords([]);
        }
      } else {
        setTrackingRecords([]);
      }
    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error
      );

      setErrorMessage(
        "Dashboard data could not be loaded. Please check the backend connection."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // NORMALIZE ORDERS
  // =========================================================
  const normalizedOrders =
    useMemo(() => {
      return orders.map(
        (order) => {
          const supplier =
            order.supplier_name ||
            order.supplier ||
            order.suppliers
              ?.company_name ||
            "";

          return {
            id:
              order.order_id,

            orderReference:
              order.order_reference ||
              "N/A",

            type:
              formatType(
                order.order_type
              ),

            supplier,

            pickup:
              order.pickup_location ||
              order.pickup_district ||
              order.pickup ||
              "-",

            destination:
              order.destination_location ||
              order.destination_district ||
              order.destination ||
              "-",

            status:
              order.current_status ||
              "created",

            expectedArrival:
              order.expected_arrival ||
              null,

            createdAt:
              order.created_at ||
              null,

            raw:
              order,
          };
        }
      );
    }, [orders]);

  // =========================================================
  // DASHBOARD SUMMARY COUNTS
  // =========================================================
  const dashboardStats =
    useMemo(() => {
      const activeOrders =
        normalizedOrders.filter(
          (order) => {
            const status =
              normalizeStatus(
                order.status
              );

            return ![
              "completed",
              "cancelled",
              "canceled",
            ].includes(status);
          }
        ).length;

      const openForBids =
        normalizedOrders.filter(
          (order) =>
            [
              "open_for_bids",
              "bidding_open",
            ].includes(
              normalizeStatus(
                order.status
              )
            )
        ).length;

      const inTracking =
        normalizedOrders.filter(
          (order) =>
            isTrackingReadyStatus(
              order.status
            ) &&
            normalizeStatus(
              order.status
            ) !==
              "completed"
        ).length;

      const completedOrders =
        normalizedOrders.filter(
          (order) =>
            normalizeStatus(
              order.status
            ) ===
            "completed"
        ).length;

      // Count only unresolved issues
      const issueCount =
        issues.filter((issue) => {
          const status =
            normalizeStatus(
              issue.status
            );

          return ![
            "resolved",
            "closed",
          ].includes(status);
        }).length;

      return {
        activeOrders,
        openForBids,
        inTracking,
        completedOrders,
        issueCount,
      };
    }, [
      normalizedOrders,
      issues,
    ]);

  // =========================================================
  // SORTED / RECENT ORDERS
  // =========================================================
  const sortedOrders =
    useMemo(() => {
      return [
        ...normalizedOrders,
      ].sort((a, b) => {
        const aTime =
          a.createdAt
            ? new Date(
                a.createdAt
              ).getTime()
            : 0;

        const bTime =
          b.createdAt
            ? new Date(
                b.createdAt
              ).getTime()
            : 0;

        return (
          bTime -
          aTime
        );
      });
    }, [normalizedOrders]);

  // Normal dashboard view shows the latest 8 orders
  const recentOrders =
    useMemo(() => {
      return sortedOrders.slice(0, 8);
    }, [sortedOrders]);

  // When a summary card is selected, show every matching order
  // so the table count matches the number shown on the card.
  const displayedOrders =
    useMemo(() => {
      if (
        summaryFilter ===
        "active"
      ) {
        return sortedOrders.filter(
          (order) => {
            const status =
              normalizeStatus(
                order.status
              );

            return ![
              "completed",
              "cancelled",
              "canceled",
            ].includes(status);
          }
        );
      }

      if (
        summaryFilter ===
        "bidding"
      ) {
        return sortedOrders.filter(
          (order) =>
            [
              "open_for_bids",
              "bidding_open",
            ].includes(
              normalizeStatus(
                order.status
              )
            )
        );
      }

      if (
        summaryFilter ===
        "tracking"
      ) {
        return sortedOrders.filter(
          (order) =>
            [
              "driver_assigned",
              "in_transit",
              "at_freezone",
              "at_port",
            ].includes(
              normalizeStatus(
                order.status
              )
            )
        );
      }

      if (
        summaryFilter ===
        "completed"
      ) {
        return sortedOrders.filter(
          (order) =>
            normalizeStatus(
              order.status
            ) ===
            "completed"
        );
      }

      return recentOrders;
    }, [
      recentOrders,
      sortedOrders,
      summaryFilter,
    ]);

  // Click the same card again to clear its filter.
  const toggleSummaryFilter =
    (filterName) => {
      setSummaryFilter(
        (current) =>
          current ===
          filterName
            ? "all"
            : filterName
      );
    };

  // =========================================================
  // NEEDS ATTENTION
  //
  // Only show meaningful operational actions.
  // =========================================================
  const attentionOrders =
    useMemo(() => {
      const priority = {
        issue_reported: 1,
        issue: 1,
        bid_accepted: 2,
        open_for_bids: 3,
        bidding_open: 3,
        created: 4,
      };

      return normalizedOrders
        .filter((order) => {
          const status =
            normalizeStatus(
              order.status
            );

          return [
            "issue_reported",
            "issue",
            "bid_accepted",
            "open_for_bids",
            "bidding_open",
            "created",
          ].includes(status);
        })
        .sort((a, b) => {
          const aStatus =
            normalizeStatus(
              a.status
            );

          const bStatus =
            normalizeStatus(
              b.status
            );

          const rankDifference =
            (priority[
              aStatus
            ] || 99) -
            (priority[
              bStatus
            ] || 99);

          if (
            rankDifference !==
            0
          ) {
            return rankDifference;
          }

          return (
            new Date(
              b.createdAt ||
                0
            ).getTime() -
            new Date(
              a.createdAt ||
                0
            ).getTime()
          );
        })
        .slice(0, 5);
    }, [normalizedOrders]);

  // =========================================================
  // LATEST TRACKING UPDATES
  // =========================================================
  const latestTracking =
    useMemo(() => {
      return [
        ...trackingRecords,
      ]
        .sort(
          (a, b) =>
            new Date(
              b.recorded_at ||
                0
            ).getTime() -
            new Date(
              a.recorded_at ||
                0
            ).getTime()
        )
        .slice(0, 4);
    }, [trackingRecords]);

  // =========================================================
  // NAVIGATION HELPERS
  // =========================================================

  // View order
  const handleViewOrder = (
    order
  ) => {
    sessionStorage.setItem(
      "selectedOrder",
      JSON.stringify({
        order_id:
          order.id,

        order_reference:
          order.orderReference,
      })
    );

    onNavigate(
      "/orders"
    );
  };

  // Open order in Bidding page
  const handleOpenBidding = (
    order
  ) => {
    sessionStorage.setItem(
      "biddingOrder",
      JSON.stringify({
        order_id:
          order.id,

        dbId:
          order.id,

        id:
          order.orderReference,

        order_reference:
          order.orderReference,

        orderReference:
          order.orderReference,

        type:
          order.type,

        order_type:
          String(
            order.type ||
              ""
          ).toLowerCase(),

        pickup:
          order.pickup,

        destination:
          order.destination,

        supplier:
          order.supplier,

        status:
          order.status,

        expectedArrival:
          order.expectedArrival,
      })
    );

    onNavigate(
      "/bidding"
    );
  };

  // Open tracking only when workflow has reached tracking stage
  const handleTrackOrder = (
    order
  ) => {
    if (
      !isTrackingReadyStatus(
        order.status
      )
    ) {
      return;
    }

    sessionStorage.setItem(
      "trackingOrder",
      JSON.stringify({
        id:
          order.orderReference,

        dbId:
          order.id,

        order_id:
          order.id,

        order_reference:
          order.orderReference,

        type:
          order.type,

        supplier:
          order.supplier ||
          getCarrierStageLabel(
            order
          ),

        pickup:
          order.pickup,

        destination:
          order.destination,

        status:
          order.status,

        expectedDay:
          order.expectedArrival ||
          "N/A",
      })
    );

    onNavigate(
      "/tracking"
    );
  };

  // Action button inside Needs Attention
  const handleAttentionAction =
    (order) => {
      const status =
        normalizeStatus(
          order.status
        );

      if (
        status ===
          "issue_reported" ||
        status ===
          "issue"
      ) {
        onNavigate(
          "/issues"
        );

        return;
      }

      if (
        [
          "created",
          "open_for_bids",
          "bidding_open",
          "bid_accepted",
        ].includes(status)
      ) {
        handleOpenBidding(
          order
        );

        return;
      }

      handleViewOrder(
        order
      );
    };

  // Click latest tracking row
  const handleTrackingRecord =
    (record) => {
      const recordOrderId =
        Number(
          record.order_id
        );

      const order =
        normalizedOrders.find(
          (item) =>
            Number(
              item.id
            ) ===
            recordOrderId
        );

      if (
        order &&
        isTrackingReadyStatus(
          order.status
        )
      ) {
        handleTrackOrder(
          order
        );
      }
    };

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="h-full overflow-auto bg-[#EBF4FF] p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ===================================================
            HEADER
        =================================================== */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Operations overview for orders, bidding, tracking, and issues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <button
              onClick={() =>
                fetchDashboardData(
                  false
                )
              }
              disabled={
                refreshing
              }
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#1E40AF] hover:bg-[#EFF6FF] ${
                refreshing
                  ? "cursor-not-allowed opacity-60"
                  : ""
              }`}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              onClick={() =>
                onNavigate(
                  "/create"
                )
              }
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#1E40AF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1E3A8A]"
            >
              <Plus
                size={16}
              />

              Create New Order
            </button>

          </div>


        </div>

        {/* ===================================================
            ERROR
        =================================================== */}
        {errorMessage && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#EA580C]">
            {errorMessage}
          </div>
        )}

        {/* ===================================================
            SUMMARY CARDS
        =================================================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <DashboardMiniCard
            title="Active Orders"
            value={
              dashboardStats.activeOrders
            }
            icon={
              Package
            }
            loading={
              loading
            }
            color="purple"
            active={
              summaryFilter ===
              "active"
            }
            onClick={() =>
              toggleSummaryFilter(
                "active"
              )
            }
          />

          <DashboardMiniCard
            title="Open for Bids"
            value={
              dashboardStats.openForBids
            }
            icon={
              Gavel
            }
            loading={
              loading
            }
            color="indigo"
            active={
              summaryFilter ===
              "bidding"
            }
            onClick={() =>
              toggleSummaryFilter(
                "bidding"
              )
            }
          />

          <DashboardMiniCard
            title="In Tracking"
            value={
              dashboardStats.inTracking
            }
            icon={
              Truck
            }
            loading={
              loading
            }
            color="cyan"
            active={
              summaryFilter ===
              "tracking"
            }
            onClick={() =>
              toggleSummaryFilter(
                "tracking"
              )
            }
          />

          <DashboardMiniCard
            title="Completed"
            value={
              dashboardStats.completedOrders
            }
            icon={
              CheckCircle
            }
            loading={
              loading
            }
            color="green"
            active={
              summaryFilter ===
              "completed"
            }
            onClick={() =>
              toggleSummaryFilter(
                "completed"
              )
            }
          />

          <DashboardMiniCard
            title="Open Issues"
            value={
              dashboardStats.issueCount
            }
            icon={
              AlertCircle
            }
            loading={
              loading
            }
            color="red"
            active={false}
            onClick={() =>
              onNavigate(
                "/issues"
              )
            }
          />

        </div>

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">

          {/* =================================================
              ORDER OVERVIEW
          ================================================= */}
          <div className="self-start rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-lg font-semibold text-[#1E293B]">
                  Order Overview
                </h3>

                <p className="text-sm text-slate-500">
                  {getOverviewFilterLabel(
                    summaryFilter
                  )}
                </p>
              </div>

              {summaryFilter !==
                "all" && (
                <button
                  type="button"
                  onClick={() =>
                    setSummaryFilter(
                      "all"
                    )
                  }
                  className="w-fit rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E40AF] hover:bg-[#EFF6FF]"
                >
                  Clear Filter
                </button>
              )}

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-[#EFF6FF] text-[#1E293B]">


                  <tr>

                    <th className="px-5 py-3 text-left font-semibold">
                      Order ID
                    </th>

                    <th className="px-5 py-3 text-left font-semibold">
                      Type
                    </th>

                    <th className="px-5 py-3 text-left font-semibold">
                      Route
                    </th>

                    <th className="px-5 py-3 text-left font-semibold">
                      Carrier / Stage
                    </th>

                    <th className="px-5 py-3 text-left font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left font-semibold">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-200">

                  {loading ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="px-5 py-8 text-center text-slate-500"
                      >
                        Loading dashboard data...
                      </td>

                    </tr>

                  ) : displayedOrders.length >
                    0 ? (


                    displayedOrders.map(
                      (order) => {
                        const status =
                          normalizeStatus(
                            order.status
                          );

                        const canOpenBidding =
                          [
                            "created",
                            "open_for_bids",
                            "bidding_open",
                            "bid_accepted",
                          ].includes(
                            status
                          );

                        const canTrack =
                          isTrackingReadyStatus(
                            order.status
                          );

                        return (
                          <tr
                            key={
                              order.orderReference
                            }
                            className="hover:bg-slate-50"
                          >

                            <td className="px-5 py-4 font-semibold text-[#1E293B]">
                              {
                                order.orderReference
                              }
                            </td>

                            <td className="px-5 py-4">

                              <span className="rounded-lg bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
                                {
                                  order.type
                                }
                              </span>

                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {
                                order.pickup
                              }{" "}
                              →{" "}
                              {
                                order.destination
                              }
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {getCarrierStageLabel(
                                order
                              )}
                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={`${statusColor(
                                  order.status
                                )} whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold`}
                              >
                                {formatStatus(
                                  order.status
                                )}
                              </span>

                            </td>

                            <td className="px-5 py-4">

                              <div className="flex flex-wrap gap-2">

                                <button
                                  onClick={() =>
                                    handleViewOrder(
                                      order
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#1E40AF] hover:bg-[#EFF6FF]"
                                >
                                  <Eye
                                    size={14}
                                  />

                                  View
                                </button>

                                {canOpenBidding && (
                                  <button
                                    onClick={() =>
                                      handleOpenBidding(
                                        order
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1E40AF] hover:bg-blue-100"
                                  >
                                    <Gavel
                                      size={14}
                                    />

                                    {status ===
                                    "bid_accepted"
                                      ? "Bid Result"
                                      : "Bidding"}
                                  </button>
                                )}

                                {canTrack ? (

                                  <button
                                    onClick={() =>
                                      handleTrackOrder(
                                        order
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#1E40AF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A8A]"
                                  >
                                    Track

                                    <ArrowRight
                                      size={14}
                                    />
                                  </button>

                                ) : (

                                  <button
                                    disabled
                                    title="Tracking becomes available after driver assignment"
                                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400"
                                  >
                                    Track

                                    <ArrowRight
                                      size={14}
                                    />
                                  </button>

                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )


                  ) : (

                    <tr>

                      <td
                        colSpan="6"
                        className="px-5 py-8 text-center text-slate-500"
                      >
                        No orders found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}
          <div className="space-y-6">

            {/* ===============================================
                NEEDS ATTENTION
            =============================================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-semibold text-[#1E293B]">
                    Needs Attention
                  </h3>

                  <p className="text-xs text-slate-500">
                    Actionable Operations tasks
                  </p>

                </div>

                <AlertCircle
                  size={18}
                  className="text-[#EA580C]"
                />

              </div>

              <div className="space-y-3">

                {attentionOrders.length >
                0 ? (

                  attentionOrders.map(
                    (order) => (

                      <div
                        key={
                          order.orderReference
                        }
                        className={`rounded-xl border p-3 ${attentionCardClass(
                          order.status
                        )}`}
                      >

                        <div className="flex items-center justify-between gap-3">

                          <div className="min-w-0">

                            <p className="font-semibold text-[#1E293B]">
                              {
                                order.orderReference
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {attentionMessage(
                                order
                              )}
                            </p>

                          </div>

                          <button
                            onClick={() =>
                              handleAttentionAction(
                                order
                              )
                            }
                            className="shrink-0 text-xs font-semibold text-[#1E40AF]"
                          >
                            {attentionActionLabel(
                              order.status
                            )}
                          </button>

                        </div>


                      </div>

                    )
                  )

                ) : (

                  <p className="text-sm text-slate-500">
                    No urgent operational items.
                  </p>

                )}

              </div>

            </div>

            {/* ===============================================
                LATEST TRACKING
            =============================================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-semibold text-[#1E293B]">
                    Latest Tracking Updates
                  </h3>

                  <p className="text-xs text-slate-500">
                    Most recent shipment movements
                  </p>

                </div>

                <Clock
                  size={18}
                  className="text-[#1E40AF]"
                />


              </div>

              <div className="space-y-3">

                {latestTracking.length >
                0 ? (

                  latestTracking.map(
                    (record) => {
                      const recordOrder =
                        normalizedOrders.find(
                          (item) =>
                            Number(
                              item.id
                            ) ===
                            Number(
                              record.order_id
                            )
                        );

                      const canOpenTracking =
                        recordOrder &&
                        isTrackingReadyStatus(
                          recordOrder.status
                        );

                      return (

                        <button
                          type="button"
                          key={
                            record.tracking_id
                          }
                          onClick={() =>
                            handleTrackingRecord(
                              record
                            )
                          }
                          disabled={
                            !canOpenTracking
                          }
                          className={`w-full rounded-xl border border-slate-200 p-3 text-left ${
                            canOpenTracking
                              ? "hover:border-blue-200 hover:bg-[#EFF6FF]"
                              : "cursor-default"
                          }`}
                        >

                          <p className="font-semibold text-[#1E293B]">
                            {getTrackingOrderReference(
                              record
                            )}
                          </p>

                          <p className="text-xs text-slate-500">
                            {record.current_location ||
                              "Unknown location"}{" "}
                            •{" "}
                            {formatStatus(
                              record.status
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(
                              record.recorded_at
                            )}
                          </p>

                        </button>

                      );
                    }
                  )

                ) : (

                  <p className="text-sm text-slate-500">
                    No tracking updates available.
                  </p>

                )}

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// ============================================================
// MINI SUMMARY CARD
// ============================================================
function DashboardMiniCard({
  title,
  value,
  icon: Icon,
  loading,
  color,
  active = false,
  onClick,
}) {
  const colorClasses = {
    purple:
      "bg-purple-100 text-purple-700",

    indigo:
      "bg-indigo-100 text-indigo-700",

    blue:
      "bg-blue-100 text-blue-700",

    cyan:
      "bg-cyan-100 text-cyan-700",

    orange:
      "bg-orange-100 text-[#EA580C]",

    yellow:
      "bg-yellow-100 text-yellow-700",

    green:
      "bg-green-100 text-[#16A34A]",

    red:
      "bg-red-100 text-[#DC2626]",

    gray:
      "bg-gray-200 text-gray-600",

  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all ${
        active
          ? "border-[#1E40AF] ring-2 ring-blue-100"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      } ${
        loading
          ? "cursor-wait"
          : "cursor-pointer"
      }`}
    >

      <div className="flex items-center justify-between gap-3">

        <div className="min-w-0">

          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-[#1E293B]">
            {loading
              ? "..."
              : value}
          </h3>

        </div>

        <div
          className={`shrink-0 rounded-xl p-3 ${
            colorClasses[
              color
            ] ||
            colorClasses.blue
          }`}
        >
          <Icon
            size={20}
          />

        </div>

      </div>

    </button>
  );
}

// ============================================================
// STATUS HELPERS
// ============================================================

// Normalizes database status values
function normalizeStatus(
  status
) {
  return String(
    status ||
      ""
  )
    .toLowerCase()
    .trim()
    .replaceAll(
      " ",
      "_"
    )
    .replaceAll(
      "-",
      "_"
    );
}

// Friendly status label for UI
function formatStatus(
  status
) {
  const normalized =
    normalizeStatus(
      status
    );

  const labels = {
    created:
      "Created",

    open_for_bids:
      "Open For Bids",

    bidding_open:
      "Open For Bids",

    bid_accepted:
      "Bid Accepted",

    driver_assigned:
      "Driver Assigned",

    in_transit:
      "In Transit",

    at_port:
      "At Port",

    at_freezone:
      "At Freezone",

    completed:
      "Completed",

    issue_reported:
      "Issue Reported",

    issue:
      "Issue Reported",

    cancelled:
      "Cancelled",

    canceled:
      "Cancelled",
  };

  if (
    labels[
      normalized
    ]
  ) {
    return labels[
      normalized
    ];
  }

  if (!status) {
    return "N/A";
  }

  return String(
    status
  )
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

// Order type label
function formatType(
  type
) {
  if (!type) {
    return "N/A";
  }

  return String(
    type
  ).replace(
    /\b\w/g,
    (char) =>
      char.toUpperCase()
  );
}

// Status badge colors
function statusColor(
  status
) {
  const normalized =
    normalizeStatus(
      status
    );

  if (
    normalized ===
    "created"
  ) {
    return "bg-purple-100 text-purple-700";

  }

  if (
    normalized ===
      "open_for_bids" ||
    normalized ===
      "bidding_open"
  ) {
    return "bg-indigo-100 text-indigo-700";
  }

  if (
    normalized ===
    "bid_accepted"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  if (
    normalized ===
    "driver_assigned"
  ) {
    return "bg-cyan-100 text-cyan-700";
  }

  if (
    normalized ===
    "in_transit"
  ) {
    return "bg-[#EFF6FF] text-[#1E40AF]";
  }

  if (
    normalized ===
    "at_freezone"
  ) {
    return "bg-orange-100 text-[#EA580C]";
  }

  if (
    normalized ===
    "at_port"
  ) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (
    normalized ===
    "completed"
  ) {
    return "bg-green-100 text-[#16A34A]";
  }

  if (
    normalized ===
      "cancelled" ||
    normalized ===
      "canceled"
  ) {
    return "bg-red-100 text-[#DC2626]";
  }

  if (
    normalized ===
      "issue_reported" ||
    normalized ===
      "issue"
  ) {
    return "bg-red-100 text-[#DC2626]";
  }

  if (
    normalized ===
    "archived"
  ) {
    return "bg-gray-200 text-gray-600";
  }

  return "bg-slate-100 text-slate-600";
}

// Only these stages should allow Tracking button
function isTrackingReadyStatus(
  status
) {
  return [
    "driver_assigned",
    "in_transit",
    "at_port",
    "at_freezone",
    "completed",
  ].includes(
    normalizeStatus(
      status
    )
  );
}

// ============================================================
// CARRIER / STAGE LABEL
// ============================================================
function getCarrierStageLabel(
  order
) {
  // If backend already provides real assigned supplier,
  // always show the supplier name.
  if (
    order.supplier
  ) {
    return order.supplier;
  }

  const status =
    normalizeStatus(
      order.status
    );

  if (
    status ===
    "created"
  ) {
    return "Awaiting bidding";
  }

  if (
    status ===
      "open_for_bids" ||
    status ===
      "bidding_open"
  ) {
    return "Bidding in progress";
  }

  if (
    status ===
    "bid_accepted"
  ) {
    return "Bid accepted";
  }

  if (
    status ===
    "driver_assigned"
  ) {
    return "Carrier assigned";
  }

  if (
    [
      "in_transit",
      "at_port",
      "at_freezone",
      "completed",
    ].includes(status)
  ) {
    return "Assigned carrier";
  }

  return "Not assigned";
}

// ============================================================
// NEEDS ATTENTION HELPERS
// ============================================================
function attentionMessage(
  order
) {
  const status =
    normalizeStatus(
      order.status
    );

  if (
    status ===
    "created"
  ) {
    return "Order created • bidding not started";
  }

  if (
    status ===
      "open_for_bids" ||
    status ===
      "bidding_open"
  ) {
    return "Bidding active • review supplier bids";
  }

  if (
    status ===
    "bid_accepted"
  ) {
    return "Bid accepted • review bidding result";
  }

  if (
    status ===
      "issue_reported" ||
    status ===
      "issue"
  ) {
    return "Issue reported • action required";
  }

  return `${formatStatus(
    order.status
  )} • ${getCarrierStageLabel(
    order
  )}`;
}

function attentionActionLabel(
  status
) {
  const normalized =
    normalizeStatus(
      status
    );

  if (
    normalized ===
    "created"
  ) {
    return "Open Bidding";
  }

  if (
    normalized ===
      "open_for_bids" ||
    normalized ===
      "bidding_open"
  ) {
    return "Review Bids";
  }

  if (
    normalized ===
    "bid_accepted"
  ) {
    return "View Bid";
  }

  if (
    normalized ===
      "issue_reported" ||
    normalized ===
      "issue"
  ) {
    return "Resolve";
  }

  return "View";
}

function attentionCardClass(
  status
) {
  const normalized =
    normalizeStatus(
      status
    );

  if (
    normalized ===
      "issue_reported" ||
    normalized ===
      "issue"
  ) {
    return "border-red-100 bg-red-50";
  }

  if (
    normalized ===
    "bid_accepted"
  ) {
    return "border-blue-100 bg-blue-50";
  }

  if (
    normalized ===
      "open_for_bids" ||
    normalized ===
      "bidding_open"
  ) {
    return "border-indigo-100 bg-indigo-50";
  }

  if (
    normalized ===
    "created"
  ) {
    return "border-purple-100 bg-purple-50";
  }

  return "border-slate-200 bg-slate-50";
}

// ============================================================
// TRACKING HELPERS
// ============================================================
function getTrackingOrderReference(
  record
) {
  return (
    record.orders
      ?.order_reference ||
    record.order_reference ||
    `Order #${record.order_id}`
  );
}

function getOverviewFilterLabel(
  filter
) {
  switch (filter) {
    case "active":
      return "Showing all active orders";

    case "bidding":
      return "Showing orders currently open for bids";

    case "tracking":
      return "Showing orders currently in tracking stages";

    case "completed":
      return "Showing completed orders";

    default:
      return "Latest operational orders and their current workflow stage";
  }
}

function formatDateTime(
  value
) {
  if (!value) {
    return "N/A";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-US",
    {
      month:
        "short",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}

export default Dashboard;