import {
  AlertTriangle,
  BadgeDollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Copy,
  Mail,
  MessageSquare,
  PackageCheck,
  Phone,
  Search,
  Send,
  Star
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const BIDDING_ORDERS_PER_PAGE = 6;

const AWARD_STATUS_PROCESS_ORDER = [
  "No Bids Received",
  "Shortlisting Required",
  "Shortlist Ready - Send to Logistics",
  "Awaiting Logistics Selection",
  "Selected Notice Pending",
  "Awaiting Supplier Response",
  "Alternate Selection Required",
  "Notifications Pending",
  "Award Completed",
];

function Bidding() {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";
  // Main UI states for bidding, sorting, shortlisted bids, and logistics submission
  const [activeTab, setActiveTab] = useState("Open");
  const [sortBy, setSortBy] = useState("Lowest Price");
  const [shortlistedBidIds, setShortlistedBidIds] = useState([]);
  const [sentToLogistics, setSentToLogistics] = useState(false);

  // Bidding timer states
  const [isBiddingOpen, setIsBiddingOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [biddingStatusLoaded, setBiddingStatusLoaded] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(true);

  // Popup and modal control states
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [selectedBidForDetails, setSelectedBidForDetails] = useState(null);

  // The supplier currently selected by Logistics. This is NOT treated as a
  // confirmed winner until the supplier accepts the award.
  const [winningBid, setWinningBid] = useState(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);

  // Persistent supplier-award workflow state from operations_bid_award_state.
  // React renders this state; it does not invent the award workflow locally.
  const [awardState, setAwardState] = useState(null);
  const [awardStateByOrder, setAwardStateByOrder] = useState({});
  const [awardActionLoading, setAwardActionLoading] = useState(false);
  const [savingShortlistBidId, setSavingShortlistBidId] = useState(null);

  // Timer form input state for opening/extending bidding time
  const [timerMode, setTimerMode] = useState("open");
  const [timerInput, setTimerInput] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Backend data states
  const [bids, setBids] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Order list states used by the three collapsible bidding tables
  const [orders, setOrders] = useState([]);
  const [bidCountByOrder, setBidCountByOrder] = useState({});
  const [winnerByOrder, setWinnerByOrder] = useState({});
  const [biddingStateByOrder, setBiddingStateByOrder] = useState({});
  const [logisticsStateByOrder, setLogisticsStateByOrder] = useState({});
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [showCreatedOrders, setShowCreatedOrders] = useState(true);
  const [showOpenBiddingOrders, setShowOpenBiddingOrders] = useState(true);
  const [showBidAcceptedOrders, setShowBidAcceptedOrders] = useState(true);
  const [showBiddingWorkspace, setShowBiddingWorkspace] = useState(false);

  // Extract actual order reference like EXP-00042
  const getOrderReference = (order) => {
    if (!order) return "";

    if (order.orderReference) {
      return order.orderReference;
    }

    if (order.order_reference) {
      return order.order_reference;
    }

    if (
      typeof order.id === "string" &&
      (order.id.startsWith("EXP-") || order.id.startsWith("IMP-"))
    ) {
      return order.id;
    }

    return "";
  };

  // Gets real numeric database order_id from Orders page object
  const getOrderDatabaseId = (order) => {
    return (
      order?.order_id ||
      order?.dbId ||
      order?.orderId ||
      order?.databaseOrderId ||
      order?.dbOrderId ||
      null
    );

  };

  // Normalizes the selected order status so bidding rules stay aligned
  // with the official Operations workflow.
  const getOrderStatus = (order = selectedOrder) =>
    String(
      order?.current_status ||
        order?.status ||
        ""
    )
      .toLowerCase()
      .trim()
      .replaceAll(" ", "_")
      .replaceAll("-", "_");

  const bidResultStatuses = new Set([
    "bid_accepted",
    "driver_assigned",
    "in_transit",
    "at_freezone",
    "at_port",
    "completed",
    "archived",
  ]);

  const getBidCountKey = (order) => {
    const reference = getOrderReference(order);

    if (reference) {
      return `ref:${String(reference).trim().toLowerCase()}`;
    }

    const databaseId = getOrderDatabaseId(order);

    if (databaseId !== null && databaseId !== undefined) {
      return `id:${databaseId}`;
    }

    return "";
  };

  const getBidCountForOrder = (order) => {
    const status = getOrderStatus(order);

    // A Created order has not entered bidding yet, so it must not display
    // any stale bid rows that may exist in the database from test data.
    if (status === "created") {
      return 0;
    }

    const key = getBidCountKey(order);
    return key ? Number(bidCountByOrder[key] || 0) : 0;
  };

  const getBiddingStateForOrder = (order) => {
    const key = getBidCountKey(order);
    return key ? biddingStateByOrder[key] || null : null;
  };

  const getLogisticsStateForOrder = (order) => {
    const key = getBidCountKey(order);
    return key ? logisticsStateByOrder[key] || null : null;
  };

  const normalizeWorkflowValue = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replaceAll("-", "_")
      .replaceAll(" ", "_");

  const normalizeAwardStatePayload = (result) => {
    if (!result || typeof result !== "object") {
      return null;
    }

    const source =
      result.award_state ||
      result.data ||
      result.state ||
      result;

    const workflowState = normalizeWorkflowValue(
      source.award_workflow_state ||
        source.workflow_state ||
        result.award_workflow_state
    );

    const confirmationStatus = normalizeWorkflowValue(
      source.supplier_confirmation_status ||
        source.confirmation_status ||
        result.supplier_confirmation_status
    );

    const rawNotifications =
      source.outcome_notifications ||
      source.notifications ||
      result.outcome_notifications ||
      result.notifications ||
      [];

    const outcomeNotifications = Array.isArray(rawNotifications)
      ? rawNotifications.map((item) => ({
          ...item,
          notificationId:
            item.notification_id || item.id || null,
          bidId: item.bid_id || item.bidId || null,
          status: normalizeWorkflowValue(
            item.notification_status || item.status || "pending"
          ),
          sentAt: item.sent_at || item.sentAt || null,
        }))
      : [];

    const selectedBidIdValue = Number(
      source.selected_bid_id ||
        source.winner_bid_id ||
        source.current_selected_bid_id ||
        0
    );

    return {
      raw: source,
      awardWorkflowState: workflowState,
      selectedBidId:
        !Number.isNaN(selectedBidIdValue) && selectedBidIdValue > 0
          ? selectedBidIdValue
          : null,
      selectedSupplier:
        source.selected_supplier ||
        source.selected_supplier_name ||
        source.supplier_name ||
        "",
      selectedBidAmount:
        source.selected_bid_amount ??
        source.winning_bid_amount ??
        source.bid_amount ??
        null,
      supplierConfirmationStatus: confirmationStatus,
      sentToLogistics:
        source.sent_to_logistics === true ||
        source.sentToLogistics === true,
      pendingUnsuccessfulNotices: Number(
        source.pending_unsuccessful_notices ||
          source.pending_notifications ||
          0
      ),
      sentUnsuccessfulNotices: Number(
        source.sent_unsuccessful_notices ||
          source.sent_notifications ||
          0
      ),
      totalBids: Number(source.total_bids || 0),
      draftShortlistCount: Number(source.draft_shortlist_count || 0),
      sentShortlistCount: Number(source.sent_shortlist_count || 0),
      biddingStatus: normalizeWorkflowValue(source.bidding_status || ""),
      biddingEndTime: source.bidding_end_time || null,
      outcomeNotifications,
      awardAttempts: (Array.isArray(source.award_attempts)
        ? source.award_attempts
        : Array.isArray(result.award_attempts)
        ? result.award_attempts
        : []
      ).map((item) => ({
        ...item,
        bidId: item.bid_id || item.bidId || null,
        responseStatus: normalizeWorkflowValue(
          item.workflow_status ||
            item.supplier_response ||
            item.response_status ||
            item.supplier_confirmation_status ||
            item.status ||
            ""
        ),
      })),
    };
  };

  const getAwardStateForOrder = (order) => {
    const key = getBidCountKey(order);
    return key ? awardStateByOrder[key] || null : null;
  };

  const getAwardStateLabel = (value) => {
    const state = normalizeWorkflowValue(value);

    const labels = {
      bidding_closed_no_bids: "No Bids Received",
      shortlisting_required: "Shortlisting Required",
      shortlist_ready_to_send: "Shortlist Ready - Send to Logistics",
      awaiting_logistics_selection: "Awaiting Logistics Selection",
      selected_supplier_notice_pending: "Selected Supplier Notice Pending",
      awaiting_supplier_response: "Awaiting Supplier Response",
      alternate_supplier_selection_required:
        "Alternate Supplier Selection Required",
      unsuccessful_supplier_notifications_pending:
        "Unsuccessful Supplier Notifications Pending",
      award_completed: "Award Completed",
    };

    return labels[state] || (state
      ? state
          .replaceAll("_", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : "Not Started");
  };

  const getAwardStateClass = (value) => {
    const state = normalizeWorkflowValue(value);

    if (state === "award_completed") {
      return "bg-green-100 text-[#16A34A]";
    }

    if (
      state === "alternate_supplier_selection_required" ||
      state === "bidding_closed_no_bids"
    ) {
      return "bg-red-100 text-[#DC2626]";
    }

    if (
      state === "shortlisting_required" ||
      state === "shortlist_ready_to_send" ||
      state === "selected_supplier_notice_pending" ||
      state === "unsuccessful_supplier_notifications_pending"
    ) {
      return "bg-orange-100 text-[#EA580C]";
    }

    if (
      state === "awaiting_logistics_selection" ||
      state === "awaiting_supplier_response"
    ) {
      return "bg-blue-100 text-[#1E40AF]";
    }

    return "bg-slate-100 text-slate-600";
  };

  const buildAwardStateUrl = (order) => {
    const databaseId = getOrderDatabaseId(order);
    const reference = getOrderReference(order);

    if (databaseId) {
      return `${API_BASE_URL}/api/operations/bids/${encodeURIComponent(
        databaseId
      )}/award-state`;
    }

    if (reference) {
      return (
        `${API_BASE_URL}/api/operations/bids/award-state?order_reference=` +
        encodeURIComponent(reference)
      );
    }

    return "";
  };

  const fetchAwardState = async (
    order = null,
    { setCurrent = true, updateMap = true, silent = false } = {}
  ) => {
    let currentOrder = order || selectedOrder;

    if (!currentOrder) {
      if (setCurrent) setAwardState(null);
      return null;
    }

    if (getOrderStatus(currentOrder) === "created") {
      if (setCurrent) setAwardState(null);
      return null;
    }

    const url = buildAwardStateUrl(currentOrder);

    if (!url) {
      if (setCurrent) setAwardState(null);
      return null;
    }

    try {
      const response = await fetch(url);
      const responseText = await response.text();
      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = {};
      }

      if (response.status === 404) {
        if (setCurrent) setAwardState(null);
        return null;
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to load supplier award workflow"
        );
      }

      const normalized = normalizeAwardStatePayload(result);
      const key = getBidCountKey(currentOrder);

      if (setCurrent) {
        setAwardState(normalized);
        setSentToLogistics(normalized?.sentToLogistics === true);
      }

      if (updateMap && key) {
        setAwardStateByOrder((prev) => ({
          ...prev,
          [key]: normalized,
        }));
      }

      return normalized;
    } catch (error) {
      if (!silent) {
        console.error("Fetch award state error:", error);
      }
      return null;
    }
  };

  const getWinnerForOrder = (order) => {
    const key = getBidCountKey(order);
    const persistedAwardState = key ? awardStateByOrder[key] : null;

    // The selected supplier shown in Operations comes only from the
    // Supabase-backed operations_bid_award_state payload.
    if (!persistedAwardState?.selectedSupplier) {
      return null;
    }

    return {
      bidId: persistedAwardState.selectedBidId,
      supplier: persistedAwardState.selectedSupplier,
      amount: persistedAwardState.selectedBidAmount,
      confirmationStatus: persistedAwardState.supplierConfirmationStatus,
    };
  };

  // Loads all Operations orders so the Bidding page can show
  // every order currently in bidding and every order with a bid result.
  const fetchBiddingOrders = async () => {
    try {
      setIsOrdersLoading(true);

      const ordersResponse = await fetch(
        `${API_BASE_URL}/api/operations/orders`
      );

      const ordersText = await ordersResponse.text();
      let ordersResult = [];

      try {
        ordersResult = ordersText ? JSON.parse(ordersText) : [];
      } catch {
        throw new Error(
          `Orders API returned invalid response. Status: ${ordersResponse.status}`
        );
      }

      if (!ordersResponse.ok) {
        throw new Error(
          ordersResult?.error || "Failed to load bidding orders"
        );
      }

      if (!Array.isArray(ordersResult)) {
        throw new Error("Invalid orders response from backend");
      }

      setOrders(ordersResult);

      let allBids = [];

      try {
        const bidsResponse = await fetch(
          `${API_BASE_URL}/api/operations/bids`
        );

        const bidsText = await bidsResponse.text();

        try {
          allBids = bidsText ? JSON.parse(bidsText) : [];
        } catch {
          allBids = [];
        }

        if (!bidsResponse.ok || !Array.isArray(allBids)) {
          allBids = [];
        }
      } catch (bidError) {
        console.error("Could not load all bids:", bidError);
        allBids = [];
      }

      const counts = {};
      const rawWinners = {};

      allBids.forEach((bid) => {
        const reference =
          bid.order_reference ||
          bid.orders?.order_reference ||
          "";

        const databaseId =
          bid.order_id ||
          bid.orders?.order_id ||
          null;

        const key = reference
          ? `ref:${String(reference).trim().toLowerCase()}`
          : databaseId !== null && databaseId !== undefined
          ? `id:${databaseId}`
          : "";

        if (!key) {
          return;
        }

        counts[key] = Number(counts[key] || 0) + 1;

        const rawBidStatus = String(
          bid.bid_status ||
          bid.status ||
          bid.selection_status ||
          ""
        )
          .trim()
          .toLowerCase()
          .replaceAll(" ", "_")
          .replaceAll("-", "_");

        const isWinner =
          rawBidStatus === "accepted" ||
          rawBidStatus === "winner" ||
          rawBidStatus === "selected" ||
          bid.selected === true ||
          bid.is_winner === true;

        if (isWinner) {
          rawWinners[key] = {
            bidId: bid.bid_id || bid.id || null,
            supplier:
              bid.supplier_name ||
              bid.suppliers?.company_name ||
              bid.company_name ||
              bid.supplier ||
              `Supplier ${bid.supplier_id || ""}`,
            amount: Number(
              bid.bid_amount ||
              bid.amount ||
              bid.price ||
              0
            ),
          };
        }
      });

      setBidCountByOrder(counts);

      const biddingStates = {};
      const logisticsStates = {};
      const awardStates = {};
      const resolvedWinners = {};

      const workflowOrders = ordersResult.filter(
        (order) => getOrderStatus(order) !== "created"
      );

      await Promise.all(
        workflowOrders.map(async (order) => {
          const key = getBidCountKey(order);

          if (!key) {
            return;
          }

          const reference = getOrderReference(order);
          const databaseId = getOrderDatabaseId(order);

          if (reference) {
            try {
              const statusResponse = await fetch(
                `${API_BASE_URL}/api/operations/bidding/status?order_reference=${encodeURIComponent(
                  reference
                )}`
              );

              const statusText = await statusResponse.text();
              let statusResult = {};

              try {
                statusResult = statusText ? JSON.parse(statusText) : {};
              } catch {
                statusResult = {};
              }

              if (statusResponse.ok && statusResult?.bidding) {
                const bidding = statusResult.bidding;
                const backendStatus = String(
                  bidding.status || ""
                ).toLowerCase();

                const endTime = bidding.end_time
                  ? new Date(bidding.end_time).getTime()
                  : null;

                biddingStates[key] = {
                  exists: true,
                  isOpen:
                    backendStatus === "open" &&
                    endTime !== null &&
                    endTime > Date.now(),
                  status: backendStatus || "unknown",
                  endTime: bidding.end_time || null,
                };
              } else {
                biddingStates[key] = {
                  exists: false,
                  isOpen: false,
                  status: "not_started",
                  endTime: null,
                };
              }
            } catch (statusError) {
              console.error(
                `Could not load bidding status for ${reference}:`,
                statusError
              );
            }
          }

          try {
            let shortlistUrl = "";

            if (reference) {
              shortlistUrl =
                `${API_BASE_URL}/api/operations/bids/shortlist-status?order_reference=` +
                encodeURIComponent(reference);
            } else if (databaseId) {
              shortlistUrl =
                `${API_BASE_URL}/api/operations/bids/shortlist-status?order_id=` +
                encodeURIComponent(databaseId);
            }

            if (!shortlistUrl) {
              return;
            }

            const shortlistResponse = await fetch(shortlistUrl);
            const shortlistText = await shortlistResponse.text();
            let shortlistResult = {};

            try {
              shortlistResult = shortlistText
                ? JSON.parse(shortlistText)
                : {};
            } catch {
              shortlistResult = {};
            }

            if (!shortlistResponse.ok) {
              return;
            }

            const savedBidIds = Array.isArray(shortlistResult.bid_ids)
              ? shortlistResult.bid_ids
              : Array.isArray(shortlistResult.selections)
              ? shortlistResult.selections
                  .map((item) => item?.bid_id)
                  .filter(Boolean)
              : [];

            const sentToLogistics = Array.isArray(shortlistResult.selections)
              ? shortlistResult.selections.some(
                  (item) => item?.sent_to_logistics === true
                )
              : shortlistResult.sent_to_logistics === true;

            const winnerBidId = Number(
              shortlistResult.winner_bid_id ||
              shortlistResult.winner_selection?.bid_id ||
              0
            );

            const hasWinner =
              !Number.isNaN(winnerBidId) && winnerBidId > 0;

            logisticsStates[key] = {
              sentToLogistics,
              hasWinner,
              winnerBidId: hasWinner ? winnerBidId : null,
            };

            if (hasWinner) {
              const matchedBid = allBids.find(
                (bid) =>
                  Number(bid.bid_id || bid.id) === winnerBidId
              );

              if (matchedBid) {
                resolvedWinners[key] = {
                  bidId:
                    matchedBid.bid_id ||
                    matchedBid.id ||
                    winnerBidId,
                  supplier:
                    matchedBid.supplier_name ||
                    matchedBid.suppliers?.company_name ||
                    matchedBid.company_name ||
                    matchedBid.supplier ||
                    `Supplier ${matchedBid.supplier_id || ""}`,
                  amount: Number(
                    matchedBid.bid_amount ||
                    matchedBid.amount ||
                    matchedBid.price ||
                    0
                  ),
                };
              } else if (rawWinners[key]) {
                resolvedWinners[key] = rawWinners[key];
              }
            }
          } catch (shortlistError) {
            console.error(
              `Could not load Logistics state for ${
                reference || databaseId
              }:` ,
              shortlistError
            );
          }

          try {
            const currentAwardState = await fetchAwardState(order, {
              setCurrent: false,
              updateMap: false,
              silent: true,
            });

            if (currentAwardState) {
              awardStates[key] = currentAwardState;

              if (currentAwardState.selectedSupplier) {
                resolvedWinners[key] = {
                  bidId: currentAwardState.selectedBidId,
                  supplier: currentAwardState.selectedSupplier,
                  amount: currentAwardState.selectedBidAmount,
                  confirmationStatus:
                    currentAwardState.supplierConfirmationStatus,
                };
              }
            }
          } catch (awardError) {
            console.error(
              `Could not load award workflow for ${reference || databaseId}:`,
              awardError
            );
          }
        })
      );

      ordersResult.forEach((order) => {
        const key = getBidCountKey(order);
        const status = getOrderStatus(order);

        if (
          key &&
          bidResultStatuses.has(status) &&
          !resolvedWinners[key] &&
          rawWinners[key]
        ) {
          resolvedWinners[key] = rawWinners[key];
        }
      });

      setWinnerByOrder(resolvedWinners);
      setBiddingStateByOrder(biddingStates);
      setLogisticsStateByOrder(logisticsStates);
      setAwardStateByOrder(awardStates);

      return ordersResult;
    } catch (error) {
      console.error("Fetch bidding orders error:", error);
      setOrders([]);
      setBidCountByOrder({});
      setWinnerByOrder({});
      setBiddingStateByOrder({});
      setLogisticsStateByOrder({});
      setAwardStateByOrder({});

      return [];
    } finally {
      setIsOrdersLoading(false);
    }
  };

  // Converts raw backend bid data into one consistent frontend format
  const normalizeBid = (bid, orderData = selectedOrder) => {
    const supplierName =
      bid.supplier_name ||
      bid.suppliers?.company_name ||
      bid.company_name ||
      bid.supplier ||
      `Supplier ${bid.supplier_id || ""}`;

    const supplierEmail =
      bid.supplier_email ||
      bid.suppliers?.email ||
      bid.suppliers?.supplier_email ||
      bid.email ||
      "";

    const supplierPhone =
      bid.supplier_phone ||
      bid.suppliers?.contact_number ||
      bid.suppliers?.phone ||
      bid.suppliers?.phone_number ||
      bid.suppliers?.mobile ||
      bid.suppliers?.contact_no ||
      bid.contact_number ||
      bid.phone ||
      "";

    const ratingValue = Number(
      bid.supplier_rating ||
        bid.suppliers?.rating ||
        bid.rating ||
        0
    );

    const supplierCompliance =
      bid.supplier_compliance_status ||
      bid.suppliers?.compliance_status ||
      "pending";

    const formattedCompliance =
      supplierCompliance === "verified"
        ? "Verified"
        : supplierCompliance === "completed"
        ? "Completed"
        : supplierCompliance === "pending"
        ? "Pending"
        : supplierCompliance === "warning"
        ? "Warning"
        : supplierCompliance === "blocked"
        ? "Blocked"
        : supplierCompliance;

    const formattedBidStatus =
      bid.bid_status === "under_review"
        ? "Under Review"
        : bid.bid_status === "shortlisted"
        ? "Shortlisted"
        : bid.bid_status === "accepted"
        ? "Accepted"
        : bid.bid_status === "rejected"
        ? "Rejected"
        : bid.bid_status || "Under Review";

    return {
      id: bid.bid_id || bid.id,

      bidId: bid.bid_id || bid.id,

      orderId:
        bid.order_id ||
        bid.orders?.order_id ||
        getOrderDatabaseId(orderData) ||
        null,

      biddingId:
        bid.bidding_id ||
        bid.bidding?.bidding_id ||
        null,

      supplierId:
        bid.supplier_id ||
        bid.suppliers?.supplier_id ||
        "-",

      supplier: supplierName,

      supplierEmail,

      supplierPhone,

      years:
        bid.supplier_experience_years
          ? `${bid.supplier_experience_years}+ Years`
          : bid.suppliers?.experience_years
          ? `${bid.suppliers.experience_years}+ Years`
          : "-",

      amount: Number(
        bid.bid_amount ||
          bid.amount ||
          bid.price ||
          0
      ),

      eta:
        bid.eta ||
        bid.eta_date ||
        bid.estimated_arrival ||
        bid.estimated_delivery_date ||
        "-",

      rating: ratingValue,

      compliance: formattedCompliance,

      pastPerformance:
        bid.supplier_past_performance ||
        bid.suppliers?.past_performance ||
        bid.notes ||
        "-",

      bidStatus: formattedBidStatus,

      notificationStatus:
        bid.notification_status ||
        "Pending",

      orderReference:
        bid.order_reference ||
        bid.orders?.order_reference ||
        getOrderReference(orderData) ||
        "-",

      orderType:
        bid.order_type ||
        bid.orders?.order_type ||
        orderData?.type ||
        orderData?.order_type ||
        "-",

      pickup:
        bid.pickup_location ||
        bid.orders?.pickup_location ||
        orderData?.pickupLocation ||
        orderData?.pickup_location ||
        orderData?.pickup ||
        bid.pickup_state ||
        bid.pickup_country ||
        bid.orders?.pickup_state ||
        bid.orders?.pickup_country ||
        orderData?.pickup_state ||
        "-",

      destination:
        bid.destination_location ||
        bid.orders?.destination_location ||
        orderData?.destinationLocation ||
        orderData?.destination_location ||
        orderData?.destination ||
        bid.destination_state ||
        bid.destination_country ||
        bid.orders?.destination_state ||
        bid.orders?.destination_country ||
        orderData?.destination_state ||
        "-",

      container:
        bid.container_no ||
        bid.orders?.container_no ||
        orderData?.containerNo ||
        orderData?.container_no ||
        "-",

      cargoType:
        bid.cargo_type ||
        bid.orders?.cargo_type ||
        orderData?.cargoType ||
        orderData?.cargo_type ||
        "-",

      cargoWeight:
        bid.cargo_weight ||
        bid.orders?.cargo_weight ||
        orderData?.cargoWeight ||
        orderData?.cargo_weight ||
        "-",

      pickupDate:
        bid.pickup_date ||
        bid.orders?.pickup_date ||
        orderData?.pickupDate ||
        orderData?.pickup_date ||
        "-",

      expectedArrival:
        bid.expected_arrival ||
        bid.orders?.expected_arrival ||
        orderData?.expectedArrival ||
        orderData?.expected_arrival ||
        "-",

      specialInstructions:
        bid.special_instructions ||
        bid.orders?.special_instructions ||
        orderData?.specialInstructions ||
        orderData?.special_instructions ||
        "-",

      vehicleNumber:
        bid.vehicle_number ||
        bid.vehicles?.vehicle_number ||
        "-",

      vehicleType:
        bid.vehicle_type ||
        bid.order_vehicle_type ||
        bid.vehicles?.vehicle_type ||
        bid.orders?.vehicle_type ||
        orderData?.vehicleType ||
        orderData?.vehicle_type ||
        "-",
    };
  };

  // =========================================================
  // LOAD CURRENT BIDDING STATUS AND TIMER FROM BACKEND
  // =========================================================
  const fetchBiddingStatus = async (order = null) => {
    try {
      let currentOrder = order || selectedOrder;

      if (!currentOrder) {
        const storedOrder = sessionStorage.getItem("biddingOrder");

        if (storedOrder) {
          currentOrder = JSON.parse(storedOrder);
        }
      }

      if (!currentOrder) {
        setIsBiddingOpen(false);
        setTimeLeft(0);
        setBiddingStatusLoaded(true);
        return;
      }

      // Once the order has Bid Accepted status (or any later workflow
      // status), bidding is historical/read-only even if an old bidding
      // record still contains an open end_time.
      if (bidResultStatuses.has(getOrderStatus(currentOrder))) {
        setIsBiddingOpen(false);
        setTimeLeft(0);
        setActiveTab("Closed");
        setBiddingStatusLoaded(true);
        return;
      }

      const orderReference = getOrderReference(currentOrder);

      if (!orderReference) {
        setIsBiddingOpen(false);
        setTimeLeft(0);
        setBiddingStatusLoaded(true);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/operations/bidding/status?order_reference=${encodeURIComponent(
          orderReference
        )}`
      );

      const responseText = await response.text();

      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Bidding status API returned invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to load bidding status"
        );
      }

      console.log("BIDDING STATUS RESULT:", result);

      if (!result.bidding) {
        setIsBiddingOpen(false);
        setTimeLeft(0);
        setActiveTab("Open");
        setBiddingStatusLoaded(true);
        return;
      }

      const bidding = result.bidding;

      const backendStatus =
        String(bidding.status || "").toLowerCase();

      const endTime = bidding.end_time
        ? new Date(bidding.end_time).getTime()
        : null;

      const now = Date.now();

      let remainingSeconds = 0;

      if (endTime) {
        remainingSeconds = Math.max(
          0,
          Math.floor((endTime - now) / 1000)
        );
      }

      if (
        backendStatus === "open" &&
        remainingSeconds > 0
      ) {
        setIsBiddingOpen(true);
        setTimeLeft(remainingSeconds);
        setActiveTab("Open");
      } else {
        setIsBiddingOpen(false);
        setTimeLeft(0);
        setActiveTab("Closed");
      }

      setBiddingStatusLoaded(true);
    } catch (error) {
      console.error(
        "Fetch bidding status error:",
        error
      );

      setIsBiddingOpen(false);
      setTimeLeft(0);
      setBiddingStatusLoaded(true);
    }
  };

  // =========================================================
  // LOAD SAVED SHORTLIST + LOGISTICS DECISION FROM BACKEND
  //
  // This reads bid_selection through the Operations backend.
  // It keeps the exact shortlist after refresh and detects the
  // selected supplier chosen by Logistics without connecting to their PC.
  // =========================================================
  const fetchShortlistStatus = async (order = null) => {
    try {
      let currentOrder = order || selectedOrder;

      if (!currentOrder) {
        const storedOrder = sessionStorage.getItem("biddingOrder");

        if (storedOrder) {
          currentOrder = JSON.parse(storedOrder);
        }
      }

      if (!currentOrder) {
        return;
      }

      const currentStatus = getOrderStatus(currentOrder);

      // A Created order has not entered the bidding workflow yet.
      // Do not restore any stale shortlist/winner rows for it.
      if (currentStatus === "created") {
        setShortlistedBidIds([]);
        setSentToLogistics(false);
        setWinningBid(null);
        return;
      }

      const orderReference = getOrderReference(currentOrder);
      const orderDatabaseId = getOrderDatabaseId(currentOrder);

      let url = "";

      if (orderReference) {
        url =
          `${API_BASE_URL}/api/operations/bids/shortlist-status?order_reference=` +
          encodeURIComponent(orderReference);
      } else if (orderDatabaseId) {
        url =
          `${API_BASE_URL}/api/operations/bids/shortlist-status?order_id=` +
          encodeURIComponent(orderDatabaseId);
      } else {
        return;
      }

      const response = await fetch(url);
      const responseText = await response.text();

      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Shortlist status API returned invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load shortlist status"
        );
      }

      const savedBidIds = Array.isArray(result.bid_ids)
        ? result.bid_ids
            .map((id) => Number(id))
            .filter((id) => !Number.isNaN(id))
        : Array.isArray(result.selections)
        ? result.selections
            .map((item) => Number(item.bid_id))
            .filter((id) => !Number.isNaN(id))
        : [];

      const alreadySent = Array.isArray(result.selections)
        ? result.selections.some(
            (item) => item?.sent_to_logistics === true
          )
        : result.sent_to_logistics === true;

      setShortlistedBidIds(savedBidIds);
      setSentToLogistics(alreadySent);

      const winnerBidId = Number(
        result.winner_bid_id ||
          result.winner_selection?.bid_id ||
          0
      );

      if (!Number.isNaN(winnerBidId) && winnerBidId > 0) {
        const currentWinner =
          bids.find(
            (bid) =>
              Number(bid.id) === winnerBidId ||
              Number(bid.bidId) === winnerBidId
          ) || {
            id: winnerBidId,
            bidId: winnerBidId,
          };

        setWinningBid(currentWinner);
        setIsBiddingOpen(false);
        setTimeLeft(0);
        setActiveTab("Closed");

        // Logistics has selected a supplier.
        // Keep polling silent so the full orders table does not reload.
      } else {
        setWinningBid(null);
      }

      console.log("SHORTLIST STATUS RESULT:", {
        alreadySent,
        savedBidIds,
        winnerBidId:
          !Number.isNaN(winnerBidId) && winnerBidId > 0
            ? winnerBidId
            : null,
        result,
      });
    } catch (error) {
      console.error(
        "Fetch shortlist status error:",
        error
      );

      // Keep the last server-confirmed state on screen if this request fails.
      // Do not replace it with browser-derived workflow data.
    }
  };

  // Fetch ONLY bids belonging to selected order
  const fetchBids = async (order = null) => {
    try {
      setIsLoading(true);

      let currentOrder =
        order ||
        selectedOrder;

      if (!currentOrder) {
        const storedOrder =
          sessionStorage.getItem(
            "biddingOrder"
          );

        if (storedOrder) {
          try {
            currentOrder =
              JSON.parse(
                storedOrder
              );
          } catch (error) {
            console.error(
              "Could not parse biddingOrder:",
              error
            );
          }
        }
      }

      if (!currentOrder) {
        console.log(
          "FETCH BIDS STOPPED: No bidding order selected"
        );

        setBids([]);
        return;
      }

      const orderReference =
        getOrderReference(
          currentOrder
        );

      const orderDatabaseId =
        getOrderDatabaseId(
          currentOrder
        );

      console.log(
        "CURRENT BIDDING ORDER:",
        currentOrder
      );

      console.log(
        "ORDER REFERENCE:",
        orderReference
      );

      console.log(
        "DATABASE ORDER ID:",
        orderDatabaseId
      );

      let url = "";

      if (orderReference) {
        url =
          `${API_BASE_URL}/api/operations/bids?order_reference=` +
          encodeURIComponent(
            orderReference
          );
      } else if (
        orderDatabaseId
      ) {
        url =
          `${API_BASE_URL}/api/operations/bids?order_id=` +
          encodeURIComponent(
            orderDatabaseId
          );
      } else {
        throw new Error(
          "Selected order does not contain order reference or database order ID."
        );
      }

      console.log(
        "FETCHING BIDS URL:",
        url
      );

      const response =
        await fetch(url);

      const responseText =
        await response.text();

      let result;

      try {
        result =
          responseText
            ? JSON.parse(
                responseText
              )
            : [];
      } catch {
        throw new Error(
          `Backend returned invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to fetch bids"
        );
      }

      if (!Array.isArray(result)) {
        throw new Error(
          "Invalid bids response from backend"
        );
      }

      let normalizedBids =
        result.map((bid) =>
          normalizeBid(
            bid,
            currentOrder
          )
        );

      if (orderDatabaseId) {
        normalizedBids =
          normalizedBids.filter(
            (bid) =>
              Number(
                bid.orderId
              ) ===
              Number(
                orderDatabaseId
              )
          );
      }

      if (orderReference) {
        normalizedBids =
          normalizedBids.filter(
            (bid) =>
              String(
                bid.orderReference ||
                  ""
              )
                .trim()
                .toLowerCase() ===
              String(
                orderReference
              )
                .trim()
                .toLowerCase()
          );
      }

      console.log(
        "FINAL BID FILTER:",
        {
          orderReference,
          orderDatabaseId,
          bidCount:
            normalizedBids.length,
          bidIds:
            normalizedBids.map(
              (bid) =>
                bid.id
            ),
        }
      );

      // Keep only locally selected IDs that still belong to this order.
      // The authoritative sent/locked shortlist is restored separately
      // from bid_selection by fetchShortlistStatus().
      setShortlistedBidIds((prev) =>
        prev.filter((bidId) =>
          normalizedBids.some(
            (bid) => Number(bid.id) === Number(bidId)
          )
        )
      );

      setBids(normalizedBids);
    } catch (error) {
      console.error(
        "Fetch bids error:",
        error
      );

      alert(
        error.message
      );

      setBids([]);
    } finally {
      setIsLoading(
        false
      );
    }
  };

  const selectBiddingOrder = async (order) => {
    if (!order) {
      return;
    }

    setSelectedOrder(order);
    setShowBiddingWorkspace(true);
    sessionStorage.setItem("biddingOrder", JSON.stringify(order));

    const status = getOrderStatus(order);

    // Never carry bid/shortlist/winner state from the previously selected order.
    // The server will restore all persisted workflow data.
    setBids([]);
    setShortlistedBidIds([]);
    setSentToLogistics(false);
    setWinningBid(null);
    setAwardState(null);
    setSelectedBidForDetails(null);
    setShowWinnerPopup(false);
    setShowOrderDetails(true);
    setIsBiddingOpen(false);
    setTimeLeft(0);
    setBiddingStatusLoaded(false);

    setActiveTab(status === "open_for_bids" ? "Open" : "Closed");

    await Promise.all([
      fetchBids(order),
      fetchBiddingStatus(order),
      fetchShortlistStatus(order),
      fetchAwardState(order),
    ]);
  };

  // Prevent the page behind the full bidding workspace from scrolling.
  useEffect(() => {
    if (!showBiddingWorkspace) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showBiddingWorkspace]);

  // Loads the Bidding page.
  //
  // IMPORTANT PERFORMANCE RULE:
  // If the user came from Orders, open that exact order IMMEDIATELY.
  // Do not wait for the expensive full Bidding-page table refresh first.
  //
  // The selected order's bids/timer/shortlist/award state load in parallel,
  // while the three Bidding tables refresh independently in the background.
  useEffect(() => {
    let cancelled = false;

    const initialiseBiddingPage = async () => {
      const storedOrder = sessionStorage.getItem("biddingOrder");

      console.log(
        "BIDDING ORDER FROM SESSION:",
        storedOrder
      );

      // Start loading the full three-table Bidding overview in the background.
      // Do NOT await this before opening an order received from Orders.jsx.
      const ordersRefreshPromise = fetchBiddingOrders();

      if (!storedOrder) {
        setSelectedOrder(null);
        setBids([]);
        setIsBiddingOpen(false);
        setTimeLeft(0);
        setBiddingStatusLoaded(true);
        setShowBiddingWorkspace(false);

        await ordersRefreshPromise;
        return;
      }

      try {
        const parsedOrder = JSON.parse(storedOrder);

        console.log(
          "PARSED BIDDING ORDER:",
          parsedOrder
        );

        if (cancelled) {
          return;
        }

        // Open the workspace immediately using the order object passed by
        // Orders.jsx. selectBiddingOrder() already opens the modal before its
        // API requests finish, so the user sees the correct order at once.
        const selectedOrderPromise = selectBiddingOrder(parsedOrder);

        // Wait for the selected order's four focused requests only.
        // The expensive all-orders refresh continues independently.
        await selectedOrderPromise;

        if (!cancelled) {
          sessionStorage.removeItem("biddingOrder");
        }

        // Let the overview refresh finish without blocking the selected order.
        await ordersRefreshPromise;
      } catch (error) {
        console.error(
          "Invalid biddingOrder:",
          error
        );

        sessionStorage.removeItem("biddingOrder");

        if (!cancelled) {
          setSelectedOrder(null);
          setBids([]);
          setIsBiddingOpen(false);
          setTimeLeft(0);
          setBiddingStatusLoaded(true);
          setShowBiddingWorkspace(false);
        }

        await ordersRefreshPromise;
      }
    };

    initialiseBiddingPage();

    return () => {
      cancelled = true;
    };
  }, []);

  // sentToLogistics is restored from backend/Supabase data.
  // Once true, the bidding stage is locked in the Operations UI.
  useEffect(() => {
    if (!sentToLogistics) {
      return;
    }

    if (isBiddingOpen) {
      setIsBiddingOpen(false);
    }

    if (timeLeft !== 0) {
      setTimeLeft(0);
    }

    if (activeTab !== "Closed") {
      setActiveTab("Closed");
    }

    if (showTimerPopup) {
      setShowTimerPopup(false);
    }

    if (showCloseConfirm) {
      setShowCloseConfirm(false);
    }
  }, [
    sentToLogistics,
    isBiddingOpen,
    timeLeft,
    activeTab,
    showTimerPopup,
    showCloseConfirm,
  ]);

  // Poll the persistent award workflow while the award is still active.
  // This lets Operations see a Logistics selection/alternate selection even
  // after refresh without any frontend-to-frontend connection.
  useEffect(() => {
    if (!selectedOrder || !awardState?.awardWorkflowState) {
      return;
    }

    if (awardState?.awardWorkflowState === "award_completed") {
      return;
    }

    const decisionTimer = setInterval(() => {
      fetchShortlistStatus(selectedOrder);
      fetchAwardState(selectedOrder);
    }, 5000);

    return () => clearInterval(decisionTimer);
  }, [
    selectedOrder,
    awardState?.awardWorkflowState,
  ]);

  useEffect(() => {
    if (
      !isBiddingOpen ||
      timeLeft <= 0
    ) {
      return;
    }

    const timer =
      setInterval(() => {
        setTimeLeft(
          (prev) => {
            if (
              prev <= 1
            ) {
              setIsBiddingOpen(
                false
              );

              setActiveTab(
                "Closed"
              );

              // Refresh the Supabase-derived workflow state when the timer ends.
              // React does not create the closed-bidding award status itself.
              setTimeout(() => {
                if (selectedOrder) {
                  fetchAwardState(selectedOrder);
                  fetchBiddingOrders();
                }
              }, 0);

              return 0;
            }

            return (
              prev - 1
            );
          }
        );
      }, 1000);

    return () =>
      clearInterval(
        timer
      );
  }, [
    isBiddingOpen,
    timeLeft,
  ]);

  const displayedBids = useMemo(() => {
    const data = [...bids];

    if (sortBy === "Lowest Price") {
      return data.sort((a, b) => a.amount - b.amount);
    }

    if (sortBy === "Highest Rating") {
      return data.sort((a, b) => b.rating - a.rating);
    }

    if (sortBy === "Compliance") {
      const rank = {
        Verified: 1,
        Completed: 1,
        Pending: 2,
        Warning: 3,
        Blocked: 4,
      };

      return data.sort(
        (a, b) =>
          (rank[a.compliance] || 99) -
          (rank[b.compliance] || 99)
      );
    }

    return data;
  }, [bids, sortBy]);


  const lowestPriceBid =
    useMemo(() => {
      if (
        bids.length ===
        0
      ) {
        return null;
      }

      return [
        ...bids,
      ].sort(
        (a, b) =>
          a.amount -
          b.amount
      )[0];
    }, [bids]);

  const highestRatedBid =
    useMemo(() => {
      if (
        bids.length ===
        0
      ) {
        return null;
      }

      return [
        ...bids,
      ].sort(
        (a, b) =>
          b.rating -
          a.rating
      )[0];
    }, [bids]);

  const fastestEtaBids =
    useMemo(() => {
      if (
        bids.length ===
        0
      ) {
        return [];
      }

      const validEtaBids =
        bids.filter(
          (bid) =>
            bid.eta &&
            bid.eta !==
              "-"
        );

      if (
        validEtaBids.length ===
        0
      ) {
        return [];
      }

      const sortedByEta =
        [
          ...validEtaBids,
        ].sort(
          (a, b) =>
            new Date(
              a.eta
            ) -
            new Date(
              b.eta
            )
        );

      const fastestEta =
        sortedByEta[0]
          .eta;

      return validEtaBids.filter(
        (bid) =>
          bid.eta ===
          fastestEta
      );
    }, [bids]);

  // Dynamic shortlist rule:
  // 1 bid  -> send 1
  // 2 bids -> send both
  // 3+ bids -> minimum 3, maximum 5
  //
  // Draft selection can still be built one supplier at a time.
  // The minimum is enforced only when sending to Logistics.
  const minShortlistCount = useMemo(
    () => Math.min(3, bids.length),
    [bids]
  );

  const maxShortlistCount = useMemo(
    () => Math.min(5, bids.length),
    [bids]
  );

  const createdOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["created"].includes(getOrderStatus(order))
      ),
    [orders]
  );

  const openBiddingOrders = useMemo(
    () =>
      orders.filter((order) => {
        const status = getOrderStatus(order);

        if (status !== "open_for_bids") {
          return false;
        }

        const award = getAwardStateForOrder(order);
        if (award?.awardWorkflowState) {
          return false;
        }

        const biddingState = getBiddingStateForOrder(order);
        return biddingState ? biddingState.isOpen === true : false;
      }),
    [orders, biddingStateByOrder, awardStateByOrder]
  );

  const bidAcceptedOrders = useMemo(
    () =>
      orders.filter((order) => {
        const status = getOrderStatus(order);
        const award = getAwardStateForOrder(order);

        if (award?.awardWorkflowState) {
          return true;
        }

        return bidResultStatuses.has(status);
      }),
    [orders, awardStateByOrder]
  );

  const displayOrder = {
    orderReference:
      getOrderReference(
        selectedOrder
      ) ||
      bids[0]
        ?.orderReference ||
      "No order selected",

    orderType:
      selectedOrder?.type ||
      selectedOrder?.order_type ||
      bids[0]
        ?.orderType ||
      "-",

    pickupDistrict:
      selectedOrder?.pickupDistrict ||
      selectedOrder?.pickup_district ||
      selectedOrder?.pickup_country ||
      "-",

    pickupLocation:
      selectedOrder?.pickupLocation ||
      selectedOrder?.pickup_location ||
      selectedOrder?.pickup ||
      selectedOrder?.pickup_state ||
      bids[0]?.pickup ||
      "-",

    pickup:
      selectedOrder?.pickupLocation ||
      selectedOrder?.pickup_location ||
      selectedOrder?.pickup ||
      selectedOrder?.pickup_state ||
      bids[0]?.pickup ||
      "-",

    destinationDistrict:
      selectedOrder?.destinationDistrict ||
      selectedOrder?.destination_district ||
      selectedOrder?.destination_country ||
      "-",

    destinationLocation:
      selectedOrder?.destinationLocation ||
      selectedOrder?.destination_location ||
      selectedOrder?.destination ||
      selectedOrder?.destination_state ||
      bids[0]?.destination ||
      "-",

    destination:
      selectedOrder?.destinationLocation ||
      selectedOrder?.destination_location ||
      selectedOrder?.destination ||
      selectedOrder?.destination_state ||
      bids[0]?.destination ||
      "-",

    container:
      selectedOrder?.containerNo ||
      selectedOrder?.container_no ||
      bids[0]
        ?.container ||
      "-",

    cargoType:
      selectedOrder?.cargoType ||
      selectedOrder?.cargo_type ||
      bids[0]
        ?.cargoType ||
      "-",

    cargoWeight:
      selectedOrder?.cargoWeight ||
      selectedOrder?.cargo_weight ||
      bids[0]
        ?.cargoWeight ||
      "-",

    vehicleType:
      selectedOrder?.vehicleType ||
      selectedOrder?.vehicle_type ||
      bids[0]
        ?.vehicleType ||
      "-",

    pickupDate:
      selectedOrder?.pickupDate ||
      selectedOrder?.pickup_date ||
      bids[0]
        ?.pickupDate ||
      "-",

    expectedArrival:
      selectedOrder?.expectedArrival ||
      selectedOrder?.expected_arrival ||
      bids[0]
        ?.expectedArrival ||
      "-",

    specialInstructions:
      selectedOrder?.specialInstructions ||
      selectedOrder?.special_instructions ||
      bids[0]
        ?.specialInstructions ||
      "-",
  };

  const formatMoney = (
    value
  ) =>
    `LKR ${Number(
      value || 0
    ).toLocaleString()}`;

  const formatEta = (
    value
  ) => {
    if (
      !value ||
      value === "-"
    ) {
      return "-";
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

    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const openSupplierResultEmail = (bid, resultType) => {
    if (!bid?.supplierEmail) {
      alert(
        `${bid?.supplier || "Supplier"} does not have an email address.`
      );
      return;
    }

    const orderReference =
      displayOrder.orderReference && displayOrder.orderReference !== "No order selected"
        ? displayOrder.orderReference
        : bid.orderReference || "Order";

    const isSelected = resultType === "selected";

    const subjectText = isSelected
      ? `Bid Selected - ${orderReference}`
      : `Bid Result - ${orderReference}`;

    const bodyText = isSelected
      ? `Dear ${bid.supplier},

Your bid has been selected as the preferred bid for order ${orderReference}.

Bid Amount: ${formatMoney(bid.amount)}
ETA: ${formatEta(bid.eta)}

Please confirm whether you accept this award. The award will only be finalized after your acceptance.

Thank you.`
      : `Dear ${bid.supplier},

Thank you for submitting your bid for order ${orderReference}.

After the selected supplier confirmed the award, we regret to inform you that your bid was not selected for this order.

We appreciate your participation and look forward to working with you on future opportunities.

Thank you.`;

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(bid.supplierEmail)}` +
      `&su=${encodeURIComponent(subjectText)}` +
      `&body=${encodeURIComponent(bodyText)}`;

    window.open(
      gmailUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };


  // Opens one Gmail compose window for every supplier who did NOT win.
  // Addresses are placed in BCC so suppliers cannot see each other's email.
  // This includes shortlisted losers, rejected/declined bids, and bids that
  // were not shortlisted. The confirmed/selected supplier is excluded.
  const openBulkUnsuccessfulBccEmail = () => {
    if (!isSupplierConfirmed) {
      alert(
        "Bulk unsuccessful email is available only after the selected supplier accepts the award."
      );
      return;
    }

    const selectedBid = getFreshWinningBid();
    const selectedBidId = Number(
      selectedBid?.id || selectedBid?.bidId || 0
    );

    const unsuccessfulRecipients = bids.filter((bid) => {
      const bidId = Number(bid.id || bid.bidId || 0);

      if (selectedBidId > 0 && bidId === selectedBidId) {
        return false;
      }

      return Boolean(
        String(bid.supplierEmail || "").trim()
      );
    });

    const bccEmails = Array.from(
      new Set(
        unsuccessfulRecipients
          .map((bid) => String(bid.supplierEmail || "").trim())
          .filter(Boolean)
      )
    );

    if (bccEmails.length === 0) {
      alert(
        "No email addresses are available for the unsuccessful suppliers."
      );
      return;
    }

    const orderReference =
      displayOrder.orderReference &&
      displayOrder.orderReference !== "No order selected"
        ? displayOrder.orderReference
        : "Order";

    const subjectText = `Bid Result - ${orderReference}`;

    const bodyText = `Dear Supplier,

Thank you for submitting your bid for order ${orderReference}.

The supplier selection process has now been completed. We regret to inform you that your bid was not selected for this order.

We appreciate your participation and look forward to working with you on future opportunities.

Thank you.`;

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&bcc=${encodeURIComponent(bccEmails.join(","))}` +
      `&su=${encodeURIComponent(subjectText)}` +
      `&body=${encodeURIComponent(bodyText)}`;

    window.open(
      gmailUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const formatTime = (
    seconds
  ) => {
    const days =
      Math.floor(
        seconds /
          86400
      );

    const hours =
      Math.floor(
        (seconds %
          86400) /
          3600
      );

    const minutes =
      Math.floor(
        (seconds %
          3600) /
          60
      );

    const secs =
      seconds %
      60;

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const convertToSeconds =
    () =>
      Number(
        timerInput.days
      ) *
        86400 +
      Number(
        timerInput.hours
      ) *
        3600 +
      Number(
        timerInput.minutes
      ) *
        60 +
      Number(
        timerInput.seconds
      );

  const openTimerPopup =
    () => {
      if (sentToLogistics) {
        alert(
          "Bidding is locked because the shortlist has already been sent to Logistics."
        );
        return;
      }

      if (isBiddingOpen) {
        alert(
          "Bidding is already open for this order."
        );
        return;
      }

      const orderStatus =
        getOrderStatus();

      // Only a newly created order can start a new bidding cycle.
      // If no status is available in the session object, the backend
      // remains the final authority and will validate the request.
      if (
        orderStatus &&
        orderStatus !== "created"
      ) {
        alert(
          `Bidding can only be opened for a Created order. Current status: ${orderStatus
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())}.`
        );
        return;
      }

      setTimerMode(
        "open"
      );

      setShowTimerPopup(
        true
      );
    };

  const closeBidding =
    () => {
      if (sentToLogistics) {
        alert(
          "Bidding is locked because the shortlist has already been sent to Logistics."
        );
        return;
      }

      setShowCloseConfirm(
        true
      );
    };

  const confirmCloseBidding =
    async () => {
      if (sentToLogistics) {
        setShowCloseConfirm(false);
        alert(
          "Bidding is locked because the shortlist has already been sent to Logistics."
        );
        return;
      }

      const orderReference =
        displayOrder.orderReference;

      if (
        !orderReference ||
        orderReference ===
          "No order selected"
      ) {
        alert(
          "Order reference is missing."
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/operations/bidding/close`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  order_reference:
                    orderReference,
                }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              "Failed to close bidding"
          );
        }

        setIsBiddingOpen(
          false
        );

        setTimeLeft(
          0
        );

        setActiveTab(
          "Closed"
        );

        setShowCloseConfirm(
          false
        );

        await fetchBiddingStatus(
          selectedOrder
        );
        await fetchAwardState(selectedOrder);
        await fetchBiddingOrders();
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  const extendTimerPopup =
    () => {
      if (sentToLogistics) {
        alert(
          "Bidding is locked because the shortlist has already been sent to Logistics."
        );
        return;
      }

      setTimerMode(
        "extend"
      );

      setShowTimerPopup(
        true
      );
    };

  const confirmTimer =
    async () => {
      if (sentToLogistics) {
        setShowTimerPopup(false);
        alert(
          "Bidding is locked because the shortlist has already been sent to Logistics."
        );
        return;
      }

      const seconds =
        convertToSeconds();

      if (
        seconds <=
        0
      ) {
        alert(
          "Please enter valid time."
        );

        return;
      }

      if (
        timerMode === "open"
      ) {
        const orderStatus =
          getOrderStatus();

        if (
          orderStatus &&
          orderStatus !== "created"
        ) {
          alert(
            "Bidding can only be opened for an order in Created status."
          );
          return;
        }
      }

      const orderReference =
        displayOrder.orderReference;

      if (
        !orderReference ||
        orderReference ===
          "No order selected"
      ) {
        alert(
          "Order reference is missing."
        );

        return;
      }

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/operations/bidding/open`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  order_reference:
                    orderReference,

                  duration_seconds:
                    timerMode ===
                    "extend"
                      ? timeLeft +
                        seconds
                      : seconds,
                }),
            }
          );

        const responseText =
          await response.text();

        let result =
          {};

        try {
          result =
            responseText
              ? JSON.parse(
                  responseText
                )
              : {};
        } catch {
          throw new Error(
            `Backend returned invalid response. Status: ${response.status}`
          );
        }

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              "Failed to update bidding timer"
          );
        }

        setShowTimerPopup(
          false
        );

        setTimerInput({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        await fetchBiddingStatus(
          selectedOrder
        );
        await fetchAwardState(selectedOrder);
        await fetchBiddingOrders();
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  // PERSISTENT SHORTLIST DRAFT BEFORE SENDING TO LOGISTICS
  // Every shortlist change is saved through the Operations API into Supabase.
  // React does not derive or persist the workflow state locally.
  const saveShortlistDraft = async (nextBidIds, bidIdBeingSaved) => {
    if (!selectedOrder) {
      alert("Please select an order first.");
      return false;
    }

    const databaseId = getOrderDatabaseId(selectedOrder);

    if (!databaseId) {
      alert("The selected order does not contain its database order ID.");
      return false;
    }

    try {
      setSavingShortlistBidId(bidIdBeingSaved);

      const response = await fetch(
        `${API_BASE_URL}/api/operations/bids/${encodeURIComponent(
          databaseId
        )}/shortlist-draft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_reference: getOrderReference(selectedOrder),
            bid_ids: nextBidIds,
          }),
        }
      );

      const responseText = await response.text();
      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Shortlist draft API returned invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to save shortlist draft"
        );
      }

      // Refresh only the selected order's persisted shortlist and award state.
      // This keeps the workflow authoritative without reloading every order.
      await fetchShortlistStatus(selectedOrder);
      await fetchAwardState(selectedOrder);
      return true;
    } catch (error) {
      console.error("Save shortlist draft error:", error);
      alert(error.message);
      return false;
    } finally {
      setSavingShortlistBidId(null);
    }
  };

  const toggleShortlist = async (bidId) => {
    if (sentToLogistics) {
      alert(
        "Shortlist has already been sent to Logistics and is locked."
      );
      return;
    }

    if (isBiddingOpen) {
      alert(
        "Please wait until bidding is closed before shortlisting suppliers."
      );
      return;
    }

    if (savingShortlistBidId !== null) {
      return;
    }

    const exists = shortlistedBidIds.some(
      (item) => Number(item) === Number(bidId)
    );

    let nextBidIds;

    if (exists) {
      nextBidIds = shortlistedBidIds.filter(
        (item) => Number(item) !== Number(bidId)
      );
    } else {
      if (shortlistedBidIds.length >= maxShortlistCount) {
        alert(
          maxShortlistCount < 5
            ? `Only ${maxShortlistCount} bid${
                maxShortlistCount === 1 ? " is" : "s are"
              } available for this order.`
            : "You can shortlist maximum 5 suppliers only."
        );
        return;
      }

      nextBidIds = [...shortlistedBidIds, bidId];
    }

    await saveShortlistDraft(nextBidIds, bidId);
  };

  const sendShortlistedToLogistics = async () => {
    if (sentToLogistics) {
      alert(
        "Shortlist has already been sent to Logistics for this order."
      );
      return;
    }

    if (isBiddingOpen) {
      alert(
        "Bidding is still open. Please close bidding before sending the shortlist."
      );
      return;
    }

    if (bids.length === 0) {
      alert(
        "No bids are available for this order."
      );
      return;
    }

    if (shortlistedBidIds.length < minShortlistCount) {
      if (bids.length < 3) {
        alert(
          `This order received only ${bids.length} bid${
            bids.length === 1 ? "" : "s"
          }. Please shortlist all ${bids.length} available bid${
            bids.length === 1 ? "" : "s"
          } before sending to Logistics.`
        );
      } else {
        alert(
          `Please shortlist at least ${minShortlistCount} suppliers before sending to Logistics.`
        );
      }

      return;
    }

    if (shortlistedBidIds.length > maxShortlistCount) {
      alert(
        `You can send a maximum of ${maxShortlistCount} shortlisted supplier${
          maxShortlistCount === 1 ? "" : "s"
        } to Logistics.`
      );
      return;
    }

    const orderReference =
      displayOrder.orderReference;

    if (
      !orderReference ||
      orderReference ===
        "No order selected"
    ) {
      alert(
        "Order reference is missing."
      );
      return;
    }

    const selectedCurrentOrderBids =
      bids.filter((bid) =>
        shortlistedBidIds.some(
          (id) =>
            Number(id) ===
            Number(bid.id)
        )
      );

    if (
      selectedCurrentOrderBids.length !==
      shortlistedBidIds.length
    ) {
      alert(
        "One or more selected bids do not belong to this order. Please select the suppliers again."
      );

      setShortlistedBidIds([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/operations/bids/send-to-logistics`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            order_reference:
              orderReference,
            bid_ids:
              shortlistedBidIds,
          }),
        }
      );

      const responseText =
        await response.text();

      let result = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `Backend returned a non-JSON response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to send shortlisted bids to Logistics"
        );
      }

      alert(
        `${shortlistedBidIds.length} shortlisted supplier${
          shortlistedBidIds.length === 1 ? "" : "s"
        } sent to Logistics Team successfully.`
      );

      await fetchBids(selectedOrder);
      await fetchShortlistStatus(selectedOrder);
      await fetchAwardState(selectedOrder);
      await fetchBiddingOrders();
    } catch (error) {
      console.error(
        "Send to Logistics error:",
        error
      );

      alert(
        error.message
      );
    }
  };

  const postAwardAction = async (action, payload = {}) => {
    if (!selectedOrder) {
      alert("Please select an order first.");
      return null;
    }

    const databaseId = getOrderDatabaseId(selectedOrder);

    if (!databaseId) {
      alert(
        "The selected order does not contain its database order ID. Award actions require order_id."
      );
      return null;
    }

    try {
      setAwardActionLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/operations/bids/${encodeURIComponent(
          databaseId
        )}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_reference: getOrderReference(selectedOrder),
            ...payload,
          }),
        }
      );

      const responseText = await response.text();
      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Award API returned invalid response. Status: ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Award workflow action failed"
        );
      }

      const returnedState = normalizeAwardStatePayload(result);

      if (returnedState?.awardWorkflowState) {
        setAwardState(returnedState);
        const key = getBidCountKey(selectedOrder);
        if (key) {
          setAwardStateByOrder((prev) => ({
            ...prev,
            [key]: returnedState,
          }));
        }
      } else {
        await fetchAwardState(selectedOrder);
      }

      await fetchShortlistStatus(selectedOrder);
      await fetchBiddingOrders();
      return result;
    } catch (error) {
      console.error(`Award action ${action} failed:`, error);
      alert(error.message);
      return null;
    } finally {
      setAwardActionLoading(false);
    }
  };

  const markSelectedSupplierNoticeSent = async () => {
    const selectedBid = getFreshWinningBid();

    if (!selectedBid) {
      alert("No supplier is currently selected by Logistics.");
      return;
    }

    const result = await postAwardAction("selected-notice-sent", {
      selected_bid_id: selectedBid.id || selectedBid.bidId,
    });

    if (result) {
      alert("Selected supplier notice marked as sent.");
    }
  };

  const recordSupplierResponse = async (responseValue) => {
    const normalizedResponse = normalizeWorkflowValue(responseValue);

    if (!["accepted", "rejected"].includes(normalizedResponse)) {
      return;
    }

    const selectedBid = getFreshWinningBid();

    if (!selectedBid) {
      alert("No supplier is currently awaiting a response.");
      return;
    }

    const result = await postAwardAction("supplier-response", {
      selected_bid_id: selectedBid.id || selectedBid.bidId,
      response: normalizedResponse,
    });

    if (result) {
      alert(
        normalizedResponse === "accepted"
          ? "Supplier acceptance recorded successfully."
          : "Supplier rejection recorded. Logistics must select an alternate supplier."
      );
    }
  };

  const markOutcomeNoticeSent = async (bid) => {
    if (!bid) return;

    const notification = getOutcomeNotificationForBid(bid);
    const result = await postAwardAction("outcome-notice-sent", {
      bid_id: bid.id || bid.bidId,
      notification_id: notification?.notificationId || undefined,
    });

    if (result) {
      alert(`${bid.supplier} result notification marked as sent.`);
    }
  };


  // Marks every remaining unsuccessful supplier notification as sent
  // using the existing backend endpoint, then refreshes the workflow once.
  // Use this AFTER the BCC email has actually been sent.
  const markAllOutcomeNoticesSent = async () => {
    if (!selectedOrder) {
      alert("Please select an order first.");
      return;
    }

    const databaseId = getOrderDatabaseId(selectedOrder);

    if (!databaseId) {
      alert(
        "The selected order does not contain its database order ID."
      );
      return;
    }

    const pendingBids = getUnsuccessfulBids().filter(
      (bid) => !isOutcomeNoticeSent(bid)
    );

    if (pendingBids.length === 0) {
      alert("There are no pending unsuccessful supplier notifications.");
      return;
    }

    try {
      setAwardActionLoading(true);

      for (const bid of pendingBids) {
        const notification = getOutcomeNotificationForBid(bid);

        const response = await fetch(
          `${API_BASE_URL}/api/operations/bids/${encodeURIComponent(
            databaseId
          )}/outcome-notice-sent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_reference: getOrderReference(selectedOrder),
              bid_id: bid.id || bid.bidId,
              notification_id:
                notification?.notificationId || undefined,
            }),
          }
        );

        const responseText = await response.text();
        let result = {};

        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch {
          result = {};
        }

        if (!response.ok) {
          throw new Error(
            result.error ||
              result.message ||
              `Failed to mark ${bid.supplier} as sent.`
          );
        }
      }

      await fetchAwardState(selectedOrder);
      await fetchShortlistStatus(selectedOrder);
      await fetchBiddingOrders();

      alert(
        `${pendingBids.length} unsuccessful supplier notification${
          pendingBids.length === 1 ? "" : "s"
        } marked as sent.`
      );
    } catch (error) {
      console.error("Mark all outcome notices sent error:", error);
      alert(error.message);
    } finally {
      setAwardActionLoading(false);
    }
  };

  const getFreshWinningBid = () => {
    const persistedSelectedBidId = Number(awardState?.selectedBidId || 0);

    if (!Number.isNaN(persistedSelectedBidId) && persistedSelectedBidId > 0) {
      const matchedPersistedBid = bids.find(
        (bid) =>
          Number(bid.id) === persistedSelectedBidId ||
          Number(bid.bidId) === persistedSelectedBidId
      );

      if (matchedPersistedBid) {
        return matchedPersistedBid;
      }

      return {
        id: persistedSelectedBidId,
        bidId: persistedSelectedBidId,
        supplier:
          awardState?.selectedSupplier ||
          winningBid?.supplier ||
          "Selected Supplier",
        amount:
          awardState?.selectedBidAmount ??
          winningBid?.amount ??
          null,
      };
    }

    if (awardState?.selectedSupplier) {
      return {
        ...winningBid,
        supplier: awardState.selectedSupplier,
        amount: awardState.selectedBidAmount ?? winningBid?.amount ?? null,
      };
    }

    if (!winningBid) {
      return null;
    }

    return (
      bids.find(
        (bid) =>
          Number(bid.id) === Number(winningBid.id) ||
          Number(bid.bidId) === Number(winningBid.bidId) ||
          Number(bid.id) === Number(winningBid.bidId) ||
          Number(bid.bidId) === Number(winningBid.id)
      ) || winningBid
    );
  };

  const getOutcomeNotificationForBid = (bid) => {
    if (!bid) return null;

    return (
      awardState?.outcomeNotifications?.find(
        (item) => Number(item.bidId) === Number(bid.id || bid.bidId)
      ) || null
    );
  };

  const isOutcomeNoticeSent = (bid) =>
    getOutcomeNotificationForBid(bid)?.status === "sent";

  const getAwardAttemptForBid = (bid) =>
    awardState?.awardAttempts?.find(
      (item) => Number(item.bidId) === Number(bid?.id || bid?.bidId)
    ) || null;

  const wasSupplierDeclinedEarlier = (bid) =>
    [
      "rejected",
      "declined",
      "supplier_rejected",
    ].includes(
      getAwardAttemptForBid(bid)?.responseStatus
    );

  // Suppliers only become unsuccessful AFTER a supplier accepts.
  // At that point EVERY non-winning bidder must receive the final result,
  // including suppliers that were never shortlisted.
  const getUnsuccessfulBids = () => {
    const workflowState = awardState?.awardWorkflowState;

    if (
      ![
        "unsuccessful_supplier_notifications_pending",
        "award_completed",
      ].includes(workflowState)
    ) {
      return [];
    }

    const selectedBid = getFreshWinningBid();

    return bids
      .filter((bid) => {
        if (!selectedBid) {
          return true;
        }

        return Number(bid.id) !== Number(selectedBid.id);
      })
      .map((bid) => ({
        ...bid,
        outcomeNotification: getOutcomeNotificationForBid(bid),
      }));
  };

  const getComplianceClass =
    (status) => {
      if (
        status ===
          "Verified" ||
        status ===
          "Completed"
      ) {
        return "bg-green-100 text-[#16A34A]";
      }

      if (
        status ===
          "Pending" ||
        status ===
          "Warning"
      ) {
        return "bg-orange-100 text-[#EA580C]";
      }

      if (
        status ===
        "Blocked"
      ) {
        return "bg-red-100 text-[#DC2626]";
      }

      return "bg-slate-100 text-[#1E293B]";
    };

  const renderStars = (
    value
  ) => {
    const safeValue =
      Number(
        value ||
          0
      );

    const full =
      Math.floor(
        safeValue
      );

    const empty =
      5 -
      full;

    return (
      <div className="flex items-center gap-1">
        <span className="text-[#EA580C] text-xs">
          {"★".repeat(
            full
          )}
          {"☆".repeat(
            empty
          )}
        </span>

        <span className="text-slate-600 text-xs">
          {safeValue >
          0
            ? safeValue.toFixed(
                1
              )
            : "-"}
        </span>
      </div>
    );
  };

  const getSupplierIcon = (
    supplier
  ) => (
    <div className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#1E40AF] text-sm font-bold">
      {supplier?.charAt(
        0
      ) || "S"}

    </div>
  );

  const getBidStatus = (bid) => {
    const selectedBid = getFreshWinningBid();
    const isSelectedSupplier =
      selectedBid && Number(selectedBid.id) === Number(bid.id);

    const isShortlisted = shortlistedBidIds.some(
      (id) => Number(id) === Number(bid.id)
    );

    const workflowState =
      awardState?.awardWorkflowState || "";

    if (isSelectedSupplier) {
      if (
        awardState?.supplierConfirmationStatus === "accepted" ||
        workflowState === "unsuccessful_supplier_notifications_pending" ||
        workflowState === "award_completed"
      ) {
        return "Confirmed Supplier";
      }

      if (workflowState === "alternate_supplier_selection_required") {
        return "Supplier Declined";
      }

      if (workflowState === "awaiting_supplier_response") {
        return "Awaiting Response";
      }

      if (workflowState === "selected_supplier_notice_pending") {
        return "Selected by Logistics";
      }

      return "Selected by Logistics";
    }

    // After the winner accepts, every other bidder has a final unsuccessful
    // outcome, even if that supplier was never shortlisted.
    if (
      !isSelectedSupplier &&
      [
        "unsuccessful_supplier_notifications_pending",
        "award_completed",
      ].includes(workflowState)
    ) {
      return isOutcomeNoticeSent(bid)
        ? "Unsuccessful - Notified"
        : "Unsuccessful";
    }

    if (
      isShortlisted &&
      wasSupplierDeclinedEarlier(bid) &&
      ![
        "unsuccessful_supplier_notifications_pending",
        "award_completed",
      ].includes(workflowState)
    ) {
      return "Declined Earlier";
    }

    if (
      isShortlisted &&
      workflowState === "alternate_supplier_selection_required"
    ) {
      return "Available for Alternate";
    }

    if (sentToLogistics && isShortlisted) {
      return "Awaiting Logistics";
    }

    if (!sentToLogistics && isShortlisted) {
      return "Shortlisted";
    }

    if (sentToLogistics && !isShortlisted) {
      return "Not Shortlisted";
    }

    return bid.bidStatus || "Under Review";
  };

  const getNotificationStatus = (bid) => {
    const selectedBid = getFreshWinningBid();
    const isSelectedSupplier =
      selectedBid && Number(selectedBid.id) === Number(bid.id);
    const isShortlisted = shortlistedBidIds.some(
      (id) => Number(id) === Number(bid.id)
    );
    const workflowState =
      awardState?.awardWorkflowState || "";

    if (isSelectedSupplier) {
      if (workflowState === "selected_supplier_notice_pending") {
        return "Selected Notice Pending";
      }

      if (workflowState === "awaiting_supplier_response") {
        return "Selected Notice Sent";
      }

      if (workflowState === "alternate_supplier_selection_required") {
        return "Supplier Declined";
      }

      if (
        awardState?.supplierConfirmationStatus === "accepted" ||
        workflowState === "unsuccessful_supplier_notifications_pending" ||
        workflowState === "award_completed"
      ) {
        return "Supplier Confirmed";
      }
    }

    if (
      !isSelectedSupplier &&
      [
        "unsuccessful_supplier_notifications_pending",
        "award_completed",
      ].includes(workflowState)
    ) {
      return isOutcomeNoticeSent(bid)
        ? "Result Sent"
        : "Result Pending";
    }

    if (
      isShortlisted &&
      wasSupplierDeclinedEarlier(bid) &&
      ![
        "unsuccessful_supplier_notifications_pending",
        "award_completed",
      ].includes(workflowState)
    ) {
      return "Declined - No Final Result";
    }

    if (
      isShortlisted &&
      workflowState === "alternate_supplier_selection_required"
    ) {
      return "No Result Yet";
    }

    if (sentToLogistics && isShortlisted) {
      return "Awaiting Logistics";
    }

    if (sentToLogistics && !isShortlisted) {
      return "Not Shortlisted";
    }

    return "Pending";
  };

  const getRecommendation =
    (bid) => {
      if (
        !lowestPriceBid ||
        !highestRatedBid
      ) {
        return "";
      }

      if (
        bid.id ===
        lowestPriceBid.id
      ) {
        return "BEST PRICE";
      }

      if (
        bid.id ===
        highestRatedBid.id
      ) {
        return "TOP RATED";
      }

      if (
        bid.compliance ===
          "Verified" ||
        bid.compliance ===
          "Completed"
      ) {
        return "COMPLIANT";
      }

      if (
        bid.compliance ===
        "Warning"
      ) {
        return "REVIEW";
      }

      return "";
    };

  const getRecommendationIcon =
    (recommendation) => {
      if (
        recommendation ===
        "BEST PRICE"
      ) {
        return (
          <BadgeDollarSign
            size={14}
            className="text-[#16A34A]"
          />
        );
      }

      if (
        recommendation ===
        "TOP RATED"
      ) {
        return (
          <Star
            size={14}
            className="text-[#EA580C]"
          />
        );
      }

      if (
        recommendation ===
        "COMPLIANT"
      ) {
        return (
          <CircleCheck
            size={14}
            className="text-[#16A34A]"
          />
        );
      }

      if (
        recommendation ===
        "REVIEW"
      ) {
        return (
          <CircleAlert
            size={14}
            className="text-[#EA580C]"
          />
        );
      }

      return null;
    };

  const calculateSupplierScore =
    (bid) => {
      let priceScore =
        0;

      let etaScore =
        0;

      let ratingScore =
        0;

      let complianceScore =
        0;

      if (
        lowestPriceBid &&
        bid.amount >
          0
      ) {
        priceScore =
          Math.round(
            (lowestPriceBid.amount /
              bid.amount) *
              40
          );

        if (
          priceScore >
          40
        ) {
          priceScore =
            40;
        }
      }

      if (
        fastestEtaBids.some(
          (item) =>
            item.id ===
            bid.id
        )
      ) {
        etaScore =
          20;
      } else if (
        bid.eta &&
        bid.eta !==
          "-"
      ) {
        etaScore =
          12;
      }

      ratingScore =
        Math.round(
          (Number(
            bid.rating ||
              0
          ) /
            5) *
            20
        );

      if (
        ratingScore >
        20
      ) {
        ratingScore =
          20;
      }

      if (
        bid.compliance ===
          "Verified" ||
        bid.compliance ===
          "Completed"
      ) {
        complianceScore =
          20;
      } else if (
        bid.compliance ===
        "Pending"
      ) {
        complianceScore =
          10;
      } else if (
        bid.compliance ===
        "Warning"
      ) {
        complianceScore =
          5;
      }

      const totalScore =
        priceScore +
        etaScore +
        ratingScore +
        complianceScore;

      return {
        priceScore,
        etaScore,
        ratingScore,
        complianceScore,
        totalScore,
      };
    };

  const freshWinningBid = getFreshWinningBid();
  const selectedOrderStatus = getOrderStatus();

  // Supabase-backed operations_bid_award_state is the only authority for
  // the award workflow. React never derives a workflow state from bid counts,
  // shortlist length, order status, or browser state.
  const currentAwardWorkflowState =
    awardState?.awardWorkflowState || "";

  const currentAwardWorkflowLabel = getAwardStateLabel(
    currentAwardWorkflowState
  );
  const isSupplierConfirmed =
    awardState?.supplierConfirmationStatus === "accepted" ||
    [
      "unsuccessful_supplier_notifications_pending",
      "award_completed",
    ].includes(currentAwardWorkflowState);
  const isAwardCompleted = currentAwardWorkflowState === "award_completed";

  const isBidResultOrder = bidResultStatuses.has(selectedOrderStatus);
  const selectedOrderReference = getOrderReference(selectedOrder);

  const selectedWinnerSummary =
    freshWinningBid ||
    (awardState?.selectedSupplier
      ? {
          bidId: awardState.selectedBidId,
          supplier: awardState.selectedSupplier,
          amount: awardState.selectedBidAmount,
        }
      : null);

  const hasSelectedWinner = Boolean(
    selectedWinnerSummary &&
      (
        selectedWinnerSummary.id ||
        selectedWinnerSummary.bidId ||
        selectedWinnerSummary.supplier
      )
  );

  const isBiddingFinalized =
    awardState?.sentToLogistics === true ||
    [
      "awaiting_logistics_selection",
      "selected_supplier_notice_pending",
      "awaiting_supplier_response",
      "alternate_supplier_selection_required",
      "unsuccessful_supplier_notifications_pending",
      "award_completed",
    ].includes(currentAwardWorkflowState) ||
    hasSelectedWinner;

  const shouldShowAwardWorkflowPanel = Boolean(
    currentAwardWorkflowState
  );

  return (
    <div className="bg-[#EBF4FF] p-5 min-h-full">
      <div className="max-w-[1500px] mx-auto space-y-4">

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

        {showBiddingWorkspace && selectedOrder && (
          <div
            className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-3 md:p-5"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowBiddingWorkspace(false);
              }
            }}
          >
            <div
              className="bg-[#EBF4FF] w-[96vw] max-w-[1580px] h-[92vh] rounded-2xl shadow-2xl border border-white/70 overflow-hidden flex flex-col"
              onMouseDown={(e) => e.stopPropagation()}
            >
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
                  onClick={() => setShowBiddingWorkspace(false)}
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#052659] hover:bg-[#EBF4FF] transition flex items-center justify-center text-2xl leading-none"
                  title="Close"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-5">
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
                      ? `Send Shortlisted to Logistics (${shortlistedBidIds.length} selected · min ${minShortlistCount} / max ${maxShortlistCount})`
                      : "Send Shortlisted to Logistics"}
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
                                  Awaiting Award Flow
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
              Showing {showingFrom}–{showingTo} of {filteredOrders.length}{" "}
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

function AwardWorkflowPanel({
  awardState,
  workflowState,
  workflowLabel,
  selectedBid,
  shortlistedCount = 0,
  unsuccessfulBids = [],
  formatMoney,
  formatEta,
  openSupplierResultEmail,
  onOpenBulkUnsuccessfulBccEmail,
  onMarkSelectedNoticeSent,
  onRecordSupplierResponse,
  onMarkOutcomeNoticeSent,
  onMarkAllOutcomeNoticesSent,
  loading,
}) {
  const state = String(workflowState || "").toLowerCase();
  const pendingCount = Number(
    awardState?.pendingUnsuccessfulNotices ||
      unsuccessfulBids.filter(
        (bid) => bid.outcomeNotification?.status !== "sent"
      ).length ||
      0
  );

  const sentCount = Number(
    awardState?.sentUnsuccessfulNotices ||
      unsuccessfulBids.filter(
        (bid) => bid.outcomeNotification?.status === "sent"
      ).length ||
      0
  );

  const selectedSupplierName =
    selectedBid?.supplier || awardState?.selectedSupplier || "-";

  const selectedAmount =
    selectedBid?.amount ?? awardState?.selectedBidAmount ?? null;

  const noBidsReceived = state === "bidding_closed_no_bids";
  const shortlistingRequired = state === "shortlisting_required";
  const shortlistReady = state === "shortlist_ready_to_send";
  const selectedNoticePending =
    state === "selected_supplier_notice_pending";
  const awaitingResponse = state === "awaiting_supplier_response";
  const alternateRequired =
    state === "alternate_supplier_selection_required";
  const unsuccessfulPending =
    state === "unsuccessful_supplier_notifications_pending";
  const completed = state === "award_completed";

  if (noBidsReceived) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-[#DC2626] mt-0.5" size={20} />
          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              No Bids Received
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Bidding has closed, but no supplier bids were received for this
              order. There is nothing to shortlist or send to Logistics yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (shortlistingRequired) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <CircleAlert className="text-[#EA580C] mt-0.5" size={20} />
          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              Shortlisting Required
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Bidding is closed. Operations must now review the supplier bids
              below and shortlist between 1 and 5 suppliers before anything can
              be sent to Logistics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (shortlistReady) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Send className="text-[#EA580C] mt-0.5" size={20} />
          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              Shortlist Ready - Send to Logistics
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {Number(shortlistedCount || 0)} supplier
              {Number(shortlistedCount || 0) === 1 ? "" : "s"} shortlisted.
              The next Operations action is to send this shortlist to Logistics
              using the "Send Shortlisted to Logistics" button above.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!state || state === "awaiting_logistics_selection") {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Clock3 className="text-[#1E40AF] mt-0.5" size={20} />
          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">
              Awaiting Logistics Selection
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              The shortlist is locked. Operations must wait for Logistics to
              choose the supplier. No unsuccessful supplier messages can be
              sent at this stage.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${
        completed
          ? "bg-green-50 border-green-200"
          : alternateRequired
          ? "bg-red-50 border-red-200"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Award Workflow
          </p>
          <h3 className="text-lg font-bold text-[#1E293B] mt-1">
            {workflowLabel}
          </h3>
          {selectedSupplierName !== "-" && (
            <p className="text-sm text-slate-600 mt-1">
              Selected supplier: {selectedSupplierName}
            </p>
          )}
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            completed
              ? "bg-green-100 text-[#16A34A]"
              : alternateRequired
              ? "bg-red-100 text-[#DC2626]"
              : selectedNoticePending || unsuccessfulPending
              ? "bg-orange-100 text-[#EA580C]"
              : "bg-blue-100 text-[#1E40AF]"
          }`}
        >
          {completed ? <CircleCheck size={14} /> : <Clock3 size={14} />}
          {workflowLabel}
        </span>
      </div>

      {selectedBid && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-white/70 border border-slate-100 rounded-xl p-4">
          <InfoMini label="Supplier" value={selectedSupplierName} />
          <InfoMini
            label="Bid Amount"
            value={
              selectedAmount !== null && selectedAmount !== undefined
                ? formatMoney(selectedAmount)
                : "-"
            }
            green={completed || unsuccessfulPending}
          />
          <InfoMini label="ETA" value={formatEta(selectedBid?.eta || "-")} />
          <InfoMini
            label="Supplier Response"
            value={
              awardState?.supplierConfirmationStatus
                ? awardState.supplierConfirmationStatus
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())
                : awaitingResponse
                ? "Pending"
                : "-"
            }
          />
        </div>
      )}

      {selectedNoticePending && selectedBid && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-[#1E293B]">
            Operations action required
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Send the selected-supplier notice first. Opening Gmail alone does
            not mark the notice as sent.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={() => openSupplierResultEmail(selectedBid, "selected")}
              className="px-4 py-2 rounded-lg border border-[#1E40AF] text-[#1E40AF] bg-white text-sm font-semibold hover:bg-[#EFF6FF]"
            >
              <Mail size={15} className="inline mr-2" />
              Open Email
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onMarkSelectedNoticeSent}
              className="px-4 py-2 rounded-lg bg-[#052659] text-white text-sm font-semibold disabled:opacity-50"
            >
              <CircleCheck size={15} className="inline mr-2" />
              {loading ? "Saving..." : "Mark Selected Notice as Sent"}
            </button>
          </div>
        </div>
      )}

      {awaitingResponse && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-[#1E293B]">
            Awaiting supplier response
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Record the response only after the supplier actually accepts or
            rejects. Do not notify the other shortlisted suppliers yet.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => onRecordSupplierResponse("accepted")}
              className="px-4 py-2 rounded-lg bg-[#16A34A] text-white text-sm font-semibold disabled:opacity-50"
            >
              Record Accepted
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onRecordSupplierResponse("rejected")}
              className="px-4 py-2 rounded-lg bg-[#DC2626] text-white text-sm font-semibold disabled:opacity-50"
            >
              Record Rejected
            </button>
          </div>
        </div>
      )}

      {alternateRequired && (
        <div className="mt-4 bg-white border border-red-100 rounded-xl p-4">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="text-[#DC2626] mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-[#DC2626]">
                Supplier declined
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Operations must not choose the next supplier and must not send
                unsuccessful-result messages. Logistics must select another
                supplier from the remaining shortlist.
              </p>
            </div>
          </div>
        </div>
      )}

      {(unsuccessfulPending || completed) && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">
                Unsuccessful supplier notifications
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {completed
                  ? "All required result notifications have been completed."
                  : `${pendingCount} notification${
                      pendingCount === 1 ? "" : "s"
                    } remaining · ${sentCount} sent`}
              </p>
            </div>

            {!completed && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onOpenBulkUnsuccessfulBccEmail}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#052659] bg-white px-4 py-2 text-xs font-semibold text-[#052659] transition hover:bg-[#EFF6FF]"
                  title="Open one BCC email for all unsuccessful suppliers"
                >
                  <Mail size={15} />
                  Email All (BCC)
                </button>

                {pendingCount > 0 && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onMarkAllOutcomeNoticesSent}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#052659] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5483B3] disabled:cursor-not-allowed disabled:opacity-50"
                    title="Mark every pending unsuccessful supplier notification as sent"
                  >
                    <CircleCheck size={15} />
                    {loading ? "Saving..." : "Mark All as Sent"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {unsuccessfulBids.length === 0 ? (
              <p className="text-sm text-slate-500">
                No unsuccessful supplier notification records were returned by
                the backend.
              </p>
            ) : (
              unsuccessfulBids.map((bid) => {
                const sent = bid.outcomeNotification?.status === "sent";

                return (
                  <div
                    key={bid.id}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-3 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {bid.supplier}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {bid.supplierEmail || "No email"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          sent
                            ? "bg-green-100 text-[#16A34A]"
                            : "bg-orange-100 text-[#EA580C]"
                        }`}
                      >
                        {sent ? "Sent" : "Pending"}
                      </span>

                      {!sent && !completed && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              openSupplierResultEmail(bid, "rejected")
                            }
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-[#DC2626] text-xs font-semibold hover:bg-red-100"
                          >
                            Open Email
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => onMarkOutcomeNoticeSent(bid)}
                            className="px-3 py-1.5 rounded-lg bg-[#052659] text-white text-xs font-semibold disabled:opacity-50"
                          >
                            Mark as Sent
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  onMarkSelectedNoticeSent,
  onRecordSupplierResponse,
  onMarkOutcomeNoticeSent,
  onMarkAllOutcomeNoticesSent,
  loading,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-2xl shadow-lg w-[900px] max-w-[94vw] max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#1E293B]">
              Supplier Award Center
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {orderReference} · {workflowLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
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
          onOpenBulkUnsuccessfulBccEmail={onOpenBulkUnsuccessfulBccEmail}
          onMarkSelectedNoticeSent={onMarkSelectedNoticeSent}
          onRecordSupplierResponse={onRecordSupplierResponse}
          onMarkOutcomeNoticeSent={onMarkOutcomeNoticeSent}
          onMarkAllOutcomeNoticesSent={onMarkAllOutcomeNoticesSent}
          loading={loading}
        />
      </div>
    </div>
  );
}

function SupplierGroupBox({
  title,
  count,
  suppliers,
  label,
  color,
  formatMoney,
  formatEta,
}) {
  const boxClass =
    color === "red"
      ? "border-red-100 bg-red-50"
      : "border-orange-100 bg-orange-50";

  const titleClass =
    color === "red"
      ? "text-[#DC2626]"
      : "text-[#EA580C]";

  return (
    <div
      className={`border ${boxClass} rounded-xl p-4 mb-4`}
    >

      <p
        className={`text-xs font-semibold ${titleClass}`}
      >
        {title}
      </p>

      <h4 className="text-base font-bold text-[#1E293B] mt-1">
        {count} Suppliers
      </h4>

      <div className="mt-3 space-y-2">

        {suppliers.length > 0 ? (
          suppliers.map((item) => (
            <SupplierResultRow
              key={item.id}
              supplier={item.supplier}
              amount={formatMoney(item.amount)}
              eta={formatEta(item.eta)}
              email={item.supplierEmail}
              phone={item.supplierPhone}
              label={label}
              color={color}
            />
          ))
        ) : (
          <p className="text-sm text-slate-500">
            No suppliers found in this category.
          </p>
        )}

      </div>

    </div>
  );
}

function MessageBox({
  title,
  value,
  color = "blue",
  emailButtonText = "Email",
  messageButtonText = "Message",
  phoneButtonText = "Phone",
  onCopy,
  onEmail,
  onMessage,
  onPhone,
}) {
  const buttonStyle =
    color === "red"
      ? "bg-[#DC2626] hover:bg-red-700 text-white"
      : color === "orange"
      ? "bg-[#EA580C] hover:bg-orange-700 text-white"
      : "bg-[#052659] hover:bg-[#5483B3] text-white";

  const outlineStyle =
    color === "red"
      ? "border border-slate-200 text-[#DC2626] hover:bg-red-50"
      : color === "orange"
      ? "border border-slate-200 text-[#EA580C] hover:bg-orange-50"
      : "border border-slate-200 text-[#052659] hover:bg-[#EBF4FF]";

  return (
    <div className="border border-slate-200 rounded-xl p-4 mb-4">

      <p className="text-xs text-slate-500 mb-2">
        {title}
      </p>

      <textarea
        readOnly
        value={value}
        className="w-full h-32 text-sm text-[#1E293B] border border-slate-200 rounded-lg p-3 resize-none bg-slate-50"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">

        <button
          onClick={onCopy}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${buttonStyle}`}
        >
          <Copy size={15} />
          Copy
        </button>

        <button
          onClick={onEmail}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${outlineStyle}`}
        >
          <Mail size={15} />
          {emailButtonText}
        </button>

        <button
          onClick={onMessage}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${outlineStyle}`}
        >
          <MessageSquare size={15} />
          {messageButtonText}
        </button>

        <button
          onClick={onPhone}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${outlineStyle}`}
        >
          <Phone size={15} />
          {phoneButtonText}
        </button>

      </div>

    </div>
  );
}

function SupplierResultRow({
  supplier,
  amount,
  eta,
  email,
  phone,
  label,
  color,
}) {
  const badgeClass =
    color === "red"
      ? "text-[#DC2626] bg-red-100"
      : "text-[#EA580C] bg-orange-100";

  return (
    <div className="bg-white border border-slate-100 rounded-lg px-3 py-2 flex justify-between items-center gap-3">

      <div>

        <p className="text-sm font-semibold text-[#1E293B]">
          {supplier}
        </p>

        <p className="text-xs text-slate-500">
          Bid: {amount} | ETA: {eta}
        </p>

        <p className="text-[11px] text-slate-400">
          {email || "No email"}{" "}
          {phone
            ? `• ${phone}`
            : "• No phone"}
        </p>

      </div>

      <span
        className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}
      >
        {label}
      </span>

    </div>
  );
}

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
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
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

export default Bidding;