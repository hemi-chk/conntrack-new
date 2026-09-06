import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeDollarSign,
  CircleAlert,
  CircleCheck,
  Star,
} from "lucide-react";

import {
  getOperationsApiBaseUrl,
} from "../services/biddingApi";

export default function useBiddingController({
  onNavigate,
  detailMode = false,
  initialOrder = null,
}) {
  const API_BASE_URL = getOperationsApiBaseUrl();
  // Main UI states for bidding, sorting, shortlisted bids, and shortlist finalization
  const [activeTab, setActiveTab] = useState("Open");
  const [sortBy, setSortBy] = useState("Lowest Price");
  const [shortlistedBidIds, setShortlistedBidIds] = useState([]);
  const [shortlistFinalized, setShortlistFinalized] = useState(false);

  // Bidding timer states
  const [isBiddingOpen, setIsBiddingOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [biddingStatusLoaded, setBiddingStatusLoaded] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(true);

  // Popup and modal control states
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [selectedBidForDetails, setSelectedBidForDetails] = useState(null);

  // The winning supplier selected by Operations. Once selected, this bid is
  // accepted immediately and every other bid for the order is rejected.
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
  const [selectionStateByOrder, setSelectionStateByOrder] = useState({});
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [showCreatedOrders, setShowCreatedOrders] = useState(true);
  const [showOpenBiddingOrders, setShowOpenBiddingOrders] = useState(true);
  const [showBidAcceptedOrders, setShowBidAcceptedOrders] = useState(true);

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

  const getSelectionStateForOrder = (order) => {
    const key = getBidCountKey(order);
    return key ? selectionStateByOrder[key] || null : null;
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
      shortlistFinalized:
        source.shortlist_finalized === true ||
        source.shortlistFinalized === true,
      selectedNoticeSentAt:
        source.selected_notice_sent_at ||
        source.selectedNoticeSentAt ||
        null,
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
      finalizedShortlistCount: Number(source.finalized_shortlist_count || 0),
      biddingStatus: normalizeWorkflowValue(source.bidding_status || ""),
      biddingEndTime: source.bidding_end_time || null,
      outcomeNotifications,
    };
  };

  const getAwardStateForOrder = (order) => {
    const key = getBidCountKey(order);
    return key ? awardStateByOrder[key] || null : null;
  };

  const getAwardStateLabel = (value) => {
    const state = normalizeWorkflowValue(value);

    const labels = {
      no_bids_received: "No Bids Received",
      shortlisting_required: "Shortlisting Required",
      winner_selection_required: "Winner Selection Required",
      selected_supplier_notice_pending: "Selected Supplier Notice Pending",
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

    if (state === "no_bids_received") {
      return "bg-red-100 text-[#DC2626]";
    }

    if (
      state === "shortlisting_required" ||
      state === "selected_supplier_notice_pending"
    ) {
      return "bg-orange-100 text-[#EA580C]";
    }

    if (state === "winner_selection_required") {
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
        setShortlistFinalized(normalized?.shortlistFinalized === true);
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
      const selectionStates = {};
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

            const shortlistFinalized = Array.isArray(shortlistResult.selections)
              ? shortlistResult.selections.some(
                  (item) => item?.shortlist_finalized === true
                )
              : shortlistResult.shortlist_finalized === true;

            const winnerBidId = Number(
              shortlistResult.winner_bid_id ||
              shortlistResult.winner_selection?.bid_id ||
              0
            );

            const hasWinner =
              !Number.isNaN(winnerBidId) && winnerBidId > 0;

            selectionStates[key] = {
              shortlistFinalized,
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
              `Could not load selection state for ${
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
      setSelectionStateByOrder(selectionStates);
      setAwardStateByOrder(awardStates);

      return ordersResult;
    } catch (error) {
      console.error("Fetch bidding orders error:", error);
      setOrders([]);
      setBidCountByOrder({});
      setWinnerByOrder({});
      setBiddingStateByOrder({});
      setSelectionStateByOrder({});
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
  // LOAD SAVED SHORTLIST + AWARD DECISION FROM BACKEND
  //
  // This reads bid_selection through the Operations backend.
  // It keeps the exact shortlist after refresh and detects the
  // selected supplier chosen by Operations from the finalized shortlist.
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
        setShortlistFinalized(false);
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
            (item) => item?.shortlist_finalized === true
          )
        : result.shortlist_finalized === true;

      setShortlistedBidIds(savedBidIds);
      setShortlistFinalized(alreadySent);

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

        // Operations has selected a supplier.
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

  const loadBiddingOrder = async (order) => {
    if (!order) {
      return;
    }

    setSelectedOrder(order);

    const status = getOrderStatus(order);

    // Never carry bid/shortlist/winner state from the previously selected order.
    // The server will restore all persisted workflow data.
    setBids([]);
    setShortlistedBidIds([]);
    setShortlistFinalized(false);
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

  const selectBiddingOrder = async (order) => {
    if (!order) {
      return;
    }

    if (detailMode) {
      await loadBiddingOrder(order);
      return;
    }

    const targetOrderId =
      getOrderDatabaseId(order) ||
      getOrderReference(order);

    if (!targetOrderId) {
      alert(
        "The selected order does not contain a valid order ID."
      );
      return;
    }

    if (onNavigate) {
      onNavigate(
        `/bidding/${encodeURIComponent(targetOrderId)}`
      );
    }
  };

  // Overview mode loads only the three bidding tables.
  // Detail mode loads only the selected order workspace.
  useEffect(() => {
    let cancelled = false;

    const initialiseBiddingPage = async () => {
      if (detailMode) {
        if (!initialOrder) {
          if (!cancelled) {
            setSelectedOrder(null);
            setBids([]);
            setBiddingStatusLoaded(true);
          }
          return;
        }

        await loadBiddingOrder(initialOrder);
        return;
      }

      setSelectedOrder(null);
      setBids([]);
      setIsBiddingOpen(false);
      setTimeLeft(0);
      setBiddingStatusLoaded(true);

      if (!detailMode) {
        await fetchBiddingOrders();
      }
    };

    initialiseBiddingPage();

    return () => {
      cancelled = true;
    };
  }, []);

  // shortlistFinalized is restored from backend/Supabase data.
  // Once true, the bidding stage is locked in the Operations UI.
  useEffect(() => {
    if (!shortlistFinalized) {
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
    shortlistFinalized,
    isBiddingOpen,
    timeLeft,
    activeTab,
    showTimerPopup,
    showCloseConfirm,
  ]);

  // Poll the persistent award workflow while the award is still active.
  // This lets Operations see the saved shortlist/winner state after refresh
  // without creating workflow state in React.
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
  // 1 bid  -> shortlist 1
  // 2 bids -> shortlist both
  // 3+ bids -> minimum 3, maximum 5
  //
  // Draft selection can still be built one supplier at a time.
  // The minimum is enforced only when sending.
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
      ? `Bid Awarded - ${orderReference}`
      : `Bid Result - ${orderReference}`;

    const bodyText = isSelected
      ? `Dear ${bid.supplier},

Your bid has been selected as the winning bid for order ${orderReference}.

Bid Amount: ${formatMoney(bid.amount)}
ETA: ${formatEta(bid.eta)}

Your bid has been accepted.

Thank you.`
      : `Dear ${bid.supplier},

Thank you for submitting your bid for order ${orderReference}.

We regret to inform you that your bid was not selected for this order.

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
  // This is available after Operations has selected the winner.
  const openBulkUnsuccessfulBccEmail = () => {
    const workflowState = normalizeWorkflowValue(
      awardState?.awardWorkflowState
    );

    if (
      ![
        "selected_supplier_notice_pending",
        "award_completed",
      ].includes(workflowState)
    ) {
      alert(
        "Unsuccessful supplier results are available only after Operations selects the winner."
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
      if (shortlistFinalized) {
        alert(
          "Bidding is locked because the shortlist has already been finalized."
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
      if (shortlistFinalized) {
        alert(
          "Bidding is locked because the shortlist has already been finalized."
        );
        return;
      }

      setShowCloseConfirm(
        true
      );
    };

  const confirmCloseBidding =
    async () => {
      if (shortlistFinalized) {
        setShowCloseConfirm(false);
        alert(
          "Bidding is locked because the shortlist has already been finalized."
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
        if (!detailMode) {
        await fetchBiddingOrders();
      }
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  const extendTimerPopup =
    () => {
      if (shortlistFinalized) {
        alert(
          "Bidding is locked because the shortlist has already been finalized."
        );
        return;
      }

      const workflowState = normalizeWorkflowValue(
        awardState?.awardWorkflowState
      );

      if (workflowState !== "no_bids_received") {
        alert(
          "Bidding time can only be extended from the No Bids Received stage."
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
      if (shortlistFinalized) {
        setShowTimerPopup(false);
        alert(
          "Bidding is locked because the shortlist has already been finalized."
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
        if (!detailMode) {
        await fetchBiddingOrders();
      }
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  // PERSISTENT SHORTLIST DRAFT BEFORE FINALIZATION
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
    if (shortlistFinalized) {
      alert(
        "Shortlist has already been finalized and is locked."
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

  const finalizeShortlist = async () => {
    if (shortlistFinalized) {
      alert(
        "Shortlist has already been finalized for this order."
      );
      return;
    }

    if (isBiddingOpen) {
      alert(
        "Bidding is still open. Please close bidding before finalizing the shortlist."
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
          } before finalizing the shortlist.`
        );
      } else {
        alert(
          `Please shortlist at least ${minShortlistCount} suppliers before finalizing the shortlist.`
        );
      }

      return;
    }

    if (shortlistedBidIds.length > maxShortlistCount) {
      alert(
        `You can finalize a maximum of ${maxShortlistCount} shortlisted supplier${
          maxShortlistCount === 1 ? "" : "s"
        }.`
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
        `${API_BASE_URL}/api/operations/bids/finalize-shortlist`,
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
            "Failed to finalize shortlist"
        );
      }

      alert(
        `${shortlistedBidIds.length} shortlisted supplier${
          shortlistedBidIds.length === 1 ? "" : "s"
        } finalized successfully. You can now select the winning supplier.`
      );

      await fetchBids(selectedOrder);
      await fetchShortlistStatus(selectedOrder);
      await fetchAwardState(selectedOrder);
      if (!detailMode) {
        await fetchBiddingOrders();
      }
    } catch (error) {
      console.error(
        "Finalize shortlist error:",
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
      if (!detailMode) {
        await fetchBiddingOrders();
      }
      return result;
    } catch (error) {
      console.error(`Award action ${action} failed:`, error);
      alert(error.message);
      return null;
    } finally {
      setAwardActionLoading(false);
    }
  };

  const selectWinningBid = async (bid) => {
    if (!selectedOrder) {
      alert("Please select an order first.");
      return;
    }

    if (!bid) {
      alert("Please select a supplier bid.");
      return;
    }

    const databaseId = getOrderDatabaseId(selectedOrder);

    const bidId = Number(
      bid.id ||
      bid.bidId ||
      0
    );

    if (!databaseId) {
      alert(
        "The selected order does not contain its database order ID."
      );
      return;
    }

    if (!bidId || Number.isNaN(bidId)) {
      alert(
        "The selected supplier does not contain a valid bid ID."
      );
      return;
    }

    const workflowState = normalizeWorkflowValue(
      awardState?.awardWorkflowState
    );

    if (workflowState !== "winner_selection_required") {
      alert(
        "Winner selection is not available at the current award stage."
      );
      return;
    }

    const confirmed = window.confirm(
      `Select ${bid.supplier} as the winning supplier? The winning bid will be accepted immediately and all other bids will be rejected.`
    );

    if (!confirmed) {
      return;
    }

    const result = await postAwardAction(
      "select-winner",
      {
        bid_id: bidId,
        selected_bid_id: bidId,
      }
    );

    if (!result) {
      return;
    }

    setWinningBid(bid);
    setIsBiddingOpen(false);
    setTimeLeft(0);
    setActiveTab("Closed");

    alert(
      `${bid.supplier} selected successfully. The winning bid is accepted and all other bids are rejected. Send the supplier result notices next.`
    );
  };

  const markSelectedSupplierNoticeSent = async () => {
    const selectedBid = getFreshWinningBid();

    if (!selectedBid) {
      alert("No supplier is currently selected.");
      return;
    }

    const result = await postAwardAction("selected-notice-sent", {
      selected_bid_id: selectedBid.id || selectedBid.bidId,
    });

    if (result) {
      alert("Selected supplier notice marked as sent.");
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

    const workflowState = normalizeWorkflowValue(
      awardState?.awardWorkflowState
    );

    if (
      ![
        "selected_supplier_notice_pending",
        "award_completed",
      ].includes(workflowState)
    ) {
      alert(
        "Unsuccessful supplier notifications are available only after a winner has been selected."
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
      if (!detailMode) {
        await fetchBiddingOrders();
      }

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

  // After Operations selects the winner, every other bid is rejected.
  // Notifications are handled inside Selected Supplier Notice Pending; there
  // is no supplier acceptance/rejection stage.
  const getUnsuccessfulBids = () => {
    const workflowState = awardState?.awardWorkflowState;

    if (
      ![
        "selected_supplier_notice_pending",
        "award_completed",
      ].includes(normalizeWorkflowValue(workflowState))
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
      selectedBid &&
      Number(selectedBid.id || selectedBid.bidId) ===
        Number(bid.id || bid.bidId);

    const isShortlisted = shortlistedBidIds.some(
      (id) => Number(id) === Number(bid.id)
    );

    const workflowState = normalizeWorkflowValue(
      awardState?.awardWorkflowState
    );

    if (
      [
        "selected_supplier_notice_pending",
        "award_completed",
      ].includes(workflowState)
    ) {
      return isSelectedSupplier
        ? "Accepted"
        : "Rejected";
    }

    if (
      workflowState === "winner_selection_required" &&
      isShortlisted
    ) {
      return "Winner Selection Required";
    }

    if (!shortlistFinalized && isShortlisted) {
      return "Shortlisted";
    }

    if (shortlistFinalized && !isShortlisted) {
      return "Not Shortlisted";
    }

    return bid.bidStatus || "Under Review";
  };

  const getNotificationStatus = (bid) => {
    const selectedBid = getFreshWinningBid();
    const isSelectedSupplier =
      selectedBid &&
      Number(selectedBid.id || selectedBid.bidId) ===
        Number(bid.id || bid.bidId);

    const isShortlisted = shortlistedBidIds.some(
      (id) => Number(id) === Number(bid.id)
    );

    const workflowState = normalizeWorkflowValue(
      awardState?.awardWorkflowState
    );

    if (workflowState === "award_completed") {
      return isSelectedSupplier
        ? "Selected Notice Sent"
        : "Result Sent";
    }

    if (workflowState === "selected_supplier_notice_pending") {
      if (isSelectedSupplier) {
        return awardState?.selectedNoticeSentAt
          ? "Selected Notice Sent"
          : "Selected Notice Pending";
      }

      return isOutcomeNoticeSent(bid)
        ? "Result Sent"
        : "Result Pending";
    }

    if (
      workflowState === "winner_selection_required" &&
      isShortlisted
    ) {
      return "Winner Selection Required";
    }

    if (shortlistFinalized && !isShortlisted) {
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
    awardState?.shortlistFinalized === true ||
    [
      "winner_selection_required",
      "selected_supplier_notice_pending",
      "award_completed",
    ].includes(currentAwardWorkflowState) ||
    hasSelectedWinner;

  const shouldShowAwardWorkflowPanel = Boolean(
    currentAwardWorkflowState
  );


  return {
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
    getSelectionStateForOrder,
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
    renderStars,
    savingShortlistBidId,
    selectBiddingOrder,
    selectWinningBid,
    selectedBidForDetails,
    selectedOrder,
    selectedOrderReference,
    selectedOrderStatus,
    selectedWinnerSummary,
    finalizeShortlist,
    shortlistFinalized,
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
  };
}

