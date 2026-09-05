import {
  AlertTriangle,
  BadgeDollarSign,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Clock3,
  Copy,
  Mail,
  MessageSquare,
  PackageCheck,
  Phone,
  Send,
  SlidersHorizontal,
  Star
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function Bidding() {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";
  // Main UI states for tab selection, sorting, shortlisted bids, and logistics submission
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

  // Stores the final winner selected by Logistics
  const [winningBid, setWinningBid] = useState(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);

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
  // winner selected by Logistics without connecting to their PC.
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

      const alreadySent =
        result.sent_to_logistics === true ||
        result.locked === true ||
        result.already_sent === true ||
        result.is_locked === true ||
        savedBidIds.length > 0;

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

      // Session storage is only a local fallback for the same browser.
      // Supabase remains the real source of truth.
      const storedOrderReference = sessionStorage.getItem(
        "shortlistedOrderReferenceForLogistics"
      );

      const currentOrderReference = getOrderReference(
        order || selectedOrder
      );

      if (
        storedOrderReference &&
        currentOrderReference &&
        storedOrderReference === currentOrderReference
      ) {
        try {
          const storedBidIds = JSON.parse(
            sessionStorage.getItem(
              "shortlistedBidIdsForLogistics"
            ) || "[]"
          );

          if (
            Array.isArray(storedBidIds) &&
            storedBidIds.length > 0
          ) {
            setShortlistedBidIds(
              storedBidIds
                .map((id) => Number(id))
                .filter((id) => !Number.isNaN(id))
            );

            setSentToLogistics(true);
          }
        } catch (sessionError) {
          console.error(
            "Could not restore shortlist from session:",
            sessionError
          );
        }
      }
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

  // Loads selected bidding order when Bidding page opens
  useEffect(() => {
    const biddingOrder =
      sessionStorage.getItem(
        "biddingOrder"
      );

    console.log(
      "BIDDING ORDER FROM SESSION:",
      biddingOrder
    );

    if (biddingOrder) {
      try {
        const parsedOrder =
          JSON.parse(
            biddingOrder
          );

        console.log(
          "PARSED BIDDING ORDER:",
          parsedOrder
        );

        setSelectedOrder(
          parsedOrder
        );

        setShortlistedBidIds(
          []
        );

        setSentToLogistics(
          false
        );

        fetchBids(
          parsedOrder
        );

        fetchBiddingStatus(
          parsedOrder
        );

        // Restore the exact saved shortlist from bid_selection.
        // This also detects a winner selected by Logistics.
        fetchShortlistStatus(parsedOrder);
      } catch (error) {
        console.error(
          "Invalid biddingOrder:",
          error
        );

        setSelectedOrder(
          null
        );

        setBids([]);

        setIsBiddingOpen(
          false
        );

        setTimeLeft(
          0
        );

        setBiddingStatusLoaded(
          true
        );
      }
    } else {
      console.log(
        "NO BIDDING ORDER FOUND"
      );

      setSelectedOrder(
        null
      );

      setBids([]);

      setIsBiddingOpen(
        false
      );

      setTimeLeft(
        0
      );

      setBiddingStatusLoaded(
        true
      );
    }

  }, []);

  // Once the shortlist is sent to Logistics, the bidding stage is permanently
  // locked in the Operations UI. Even if an older backend bidding record still
  // says "open", Operations cannot reopen, close, or extend the bidding.
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

  // Poll the shared Supabase decision every 5 seconds after the shortlist
  // has been sent. No frontend-to-frontend connection is required.
  useEffect(() => {
    if (!selectedOrder || !sentToLogistics || winningBid) {
      return;
    }

    const decisionTimer = setInterval(() => {
      fetchShortlistStatus(selectedOrder);
    }, 5000);

    return () => clearInterval(decisionTimer);
  }, [selectedOrder, sentToLogistics, winningBid]);

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

  const sortedBids =
    useMemo(() => {
      const data = [
        ...bids,
      ];

      if (
        sortBy ===
        "Lowest Price"
      ) {
        return data.sort(
          (a, b) =>
            a.amount -
            b.amount
        );
      }

      if (
        sortBy ===
        "Highest Rating"
      ) {
        return data.sort(
          (a, b) =>
            b.rating -
            a.rating
        );
      }

      if (
        sortBy ===
        "Compliance"
      ) {
        const rank = {
          Verified: 1,
          Completed: 1,
          Pending: 2,
          Warning: 3,
          Blocked: 4,
        };

        return data.sort(
          (a, b) =>
            (rank[
              a.compliance
            ] ||
              99) -
            (rank[
              b.compliance
            ] ||
              99)
        );
      }

      return data;
    }, [
      bids,
      sortBy,
    ]);

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

  // Operations can shortlist up to 5 suppliers.
  // Fewer than 5 is valid, as long as at least one bid is selected.
  const maxShortlistCount = useMemo(
    () => Math.min(5, bids.length),
    [bids]
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

    pickup:
      selectedOrder?.pickupLocation ||
      selectedOrder?.pickup_location ||
      selectedOrder?.pickup ||
      selectedOrder?.pickup_state ||
      bids[0]?.pickup ||
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
      } catch (error) {
        alert(
          error.message
        );
      }
    };

  // LOCAL SHORTLIST BEFORE SENDING TO LOGISTICS
  // Shortlisting is allowed only after bidding closes.
  // Operations may shortlist 1 to 5 suppliers.
  // Once sent to Logistics, the shortlist is permanently locked in this UI.
  const toggleShortlist = (
    bidId
  ) => {
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

    setShortlistedBidIds(
      (prev) => {
        if (
          prev.some(
            (item) =>
              Number(item) ===
              Number(bidId)
          )
        ) {
          return prev.filter(
            (item) =>
              Number(item) !==
              Number(bidId)
          );
        }

        if (
          prev.length >=
          maxShortlistCount
        ) {
          alert(
            maxShortlistCount < 5
              ? `Only ${maxShortlistCount} bid${
                  maxShortlistCount === 1 ? " is" : "s are"
                } available for this order.`
              : "You can shortlist maximum 5 suppliers only."
          );
          return prev;
        }

        return [
          ...prev,
          bidId,
        ];
      }
    );
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

    if (shortlistedBidIds.length === 0) {
      alert(
        "Please shortlist at least one supplier before sending to Logistics."
      );
      return;
    }

    if (shortlistedBidIds.length > 5) {
      alert(
        "You can send a maximum of 5 shortlisted suppliers to Logistics."
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

      const shortlistedBids =
        bids.filter((bid) =>
          shortlistedBidIds.some(
            (id) =>
              Number(id) ===
              Number(bid.id)
          )
        );

      // Local session copies are only convenience fallbacks.
      // Supabase bid_selection remains the source of truth.
      sessionStorage.setItem(
        "shortlistedBidsForLogistics",
        JSON.stringify(
          shortlistedBids
        )
      );

      sessionStorage.setItem(
        "shortlistedBidIdsForLogistics",
        JSON.stringify(
          shortlistedBidIds
        )
      );

      sessionStorage.setItem(
        "shortlistedOrderReferenceForLogistics",
        orderReference
      );

      setSentToLogistics(true);

      alert(
        `${shortlistedBidIds.length} shortlisted supplier${
          shortlistedBidIds.length === 1 ? "" : "s"
        } sent to Logistics Team successfully.`
      );

      await fetchBids(selectedOrder);
      await fetchShortlistStatus(selectedOrder);
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

  const getFreshWinningBid =
    () => {
      if (
        !winningBid
      ) {
        return null;
      }

      return (
        bids.find(
          (bid) =>
            Number(
              bid.id
            ) ===
              Number(
                winningBid.id
              ) ||
            Number(
              bid.bidId
            ) ===
              Number(
                winningBid.bidId
              ) ||
            Number(
              bid.id
            ) ===
              Number(
                winningBid.bidId
              ) ||
            Number(
              bid.bidId
            ) ===
              Number(
                winningBid.id
              )
        ) ||
        winningBid
      );
    };

  // Only shortlisted suppliers that were not selected by Logistics
  // are treated as rejected. Non-shortlisted bids remain "Not Shortlisted".
  const getUnsuccessfulBids = () => {
    const freshWinner = getFreshWinningBid();

    if (!freshWinner) {
      return [];
    }

    return bids.filter(
      (bid) =>
        shortlistedBidIds.some(
          (id) =>
            Number(id) ===
            Number(bid.id)
        ) &&
        Number(bid.id) !==
          Number(freshWinner.id)
    );
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
    const freshWinner = getFreshWinningBid();
    const isWinner =
      freshWinner &&
      Number(freshWinner.id) === Number(bid.id);

    const isShortlisted =
      shortlistedBidIds.some(
        (id) => Number(id) === Number(bid.id)
      );

    if (isWinner) {
      return "Winner Selected";
    }

    if (sentToLogistics && freshWinner && isShortlisted) {
      return "Rejected";
    }

    if (sentToLogistics && !freshWinner && isShortlisted) {
      return "Awaiting Logistics";
    }

    if (!sentToLogistics && isShortlisted) {
      return "Shortlisted";
    }

    if (sentToLogistics && freshWinner && !isShortlisted) {
      return "Not Shortlisted";
    }

    return bid.bidStatus || "Under Review";
  };

  const getNotificationStatus = (bid) => {
    const freshWinner = getFreshWinningBid();

    const isWinner =
      freshWinner &&
      Number(freshWinner.id) ===
        Number(bid.id);

    const isShortlisted =
      shortlistedBidIds.some(
        (id) =>
          Number(id) ===
          Number(bid.id)
      );

    if (isWinner) {
      return "Ready to Notify";
    }

    if (
      sentToLogistics &&
      freshWinner &&
      isShortlisted
    ) {
      return "Ready to Notify";
    }

    if (
      sentToLogistics &&
      !freshWinner &&
      isShortlisted
    ) {
      return "Sent to Logistics";
    }

    if (
      sentToLogistics &&
      !isShortlisted
    ) {
      return "Not Shortlisted";
    }

    return bid.notificationStatus || "Pending";
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

  const freshWinningBid =
    getFreshWinningBid();

  return (
    <div className="bg-[#EBF4FF] p-5 min-h-full">
      <div className="max-w-[1500px] mx-auto space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-[760px]">

          <MiniStatusCard
            title="Status"
            value={
              !biddingStatusLoaded
                ? "Loading..."
                : sentToLogistics
                ? "Bidding Locked"
                : isBiddingOpen
                ? "Bidding Open"
                : activeTab ===
                  "Closed"
                ? "Bidding Closed"
                : "Not Started"
            }
            type={
              sentToLogistics
                ? "neutral"
                : isBiddingOpen
                ? "success"
                : activeTab ===
                  "Closed"
                ? "danger"
                : "neutral"
            }
          />

          <MiniStatusCard
            title="Closes In"
            value={
              !biddingStatusLoaded
                ? "Loading..."
                : sentToLogistics
                ? "Locked"
                : isBiddingOpen
                ? formatTime(
                    timeLeft
                  )
                : activeTab ===
                  "Closed"
                ? "Closed"
                : "Not Started"
            }
            type="danger"
          />

          <MiniStatusCard
            title="Available Bids"
            value={
              bids.length
            }
            type="primary"
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
                      label="Pickup"
                      value={displayOrder.pickup}
                    />

                    <OrderTableCell
                      label="Destination"
                      value={displayOrder.destination}
                    />

                    <OrderTableCell
                      label="Container"
                      value={displayOrder.container}
                    />

                    <OrderTableCell
                      label="Cargo Type"
                      value={displayOrder.cargoType}
                    />

                  </tr>

                  <tr>

                    <OrderTableCell
                      label="Cargo Weight"
                      value={
                        displayOrder.cargoWeight !==
                        "-"
                          ? `${displayOrder.cargoWeight} kg`
                          : "-"
                      }
                    />

                    <OrderTableCell
                      label="Vehicle Type"
                      value={displayOrder.vehicleType}
                    />

                    <OrderTableCell
                      label="Pickup Date"
                      value={formatEta(
                        displayOrder.pickupDate
                      )}
                    />

                    <OrderTableCell
                      label="Expected Arrival"
                      value={formatEta(
                        displayOrder.expectedArrival
                      )}
                    />

                    <OrderTableCell
                      label="Special Instructions"
                      value={displayOrder.specialInstructions}
                      colSpan={2}
                    />

                  </tr>

                </tbody>

              </table>

            </div>
          )}

        </div>

        <div className="flex justify-between items-center gap-3">

          <div className="flex gap-2">

            <button
              onClick={
                openTimerPopup
              }
              disabled={sentToLogistics}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                sentToLogistics
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : activeTab ===
                    "Open"
                  ? "bg-[#1E40AF] text-white"

                  : "bg-white text-[#1E293B] border border-slate-200"
              }`}
            >
              Open Bidding{" "}

              <span className="ml-2 bg-white/20 px-2 rounded-full">
                {bids.length}
              </span>
            </button>

            <button
              onClick={
                closeBidding
              }
              disabled={sentToLogistics}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                sentToLogistics
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : activeTab ===
                    "Closed"
                  ? "bg-[#1E40AF] text-white"

                  : "bg-white text-[#1E293B] border border-slate-200"
              }`}
            >
              Closed Bidding
            </button>

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={
                extendTimerPopup
              }
              disabled={
                !isBiddingOpen ||
                sentToLogistics
              }
              className={`border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium ${
                isBiddingOpen &&
                !sentToLogistics
                  ? "bg-white text-[#1E40AF]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}

            >
              Extend Timer
            </button>

            <button
              onClick={
                sendShortlistedToLogistics
              }
              disabled={
                isBiddingOpen ||
                sentToLogistics ||
                bids.length === 0 ||
                shortlistedBidIds.length === 0 ||
                shortlistedBidIds.length > 5
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                sentToLogistics
                  ? "bg-green-100 text-[#16A34A]"
                  : !isBiddingOpen &&
                    shortlistedBidIds.length > 0 &&
                    shortlistedBidIds.length <= 5
                  ? "bg-[#1E40AF] text-white hover:bg-[#1E3A8A]"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"

              }`}
            >

              <Send
                size={16}
              />

              {sentToLogistics
                ? "Shortlist Sent to Logistics"
                : `Send Shortlisted to Logistics (${shortlistedBidIds.length}/${maxShortlistCount})`}

            </button>

          </div>

        </div>

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

          <div className="p-4 border-b border-slate-100 flex justify-between items-center">

            <h3 className="text-lg font-semibold text-[#1E293B]">
              Supplier Bids Comparison
            </h3>

            <div className="flex items-center gap-2">

              <span className="text-sm text-slate-500">
                Sort by:
              </span>

              <select
                value={
                  sortBy
                }
                onChange={(e) =>
                  setSortBy(
                    e.target.value
                  )
                }
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#1E293B] bg-white"
              >

                <option>
                  Lowest Price
                </option>

                <option>
                  Highest Rating
                </option>

                <option>
                  Compliance
                </option>

              </select>

              <button className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#1E293B] bg-white flex items-center gap-2">

                <SlidersHorizontal
                  size={14}
                />

                Filters

              </button>

            </div>

          </div>

          <div className="overflow-x-auto">

            {isLoading ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading bids...
              </div>
            ) : sortedBids.length ===
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

                  {sortedBids.map(
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
                                <div className="text-[9px] font-bold px-2 py-1 rounded-md w-[78px] text-center bg-green-100 text-[#16A34A] border border-green-200">
                                  WINNER
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
                                getBidStatus(bid) === "Shortlisted"
                                  ? "bg-[#EFF6FF] text-[#1E40AF]"
                                  : getBidStatus(bid) === "Winner Selected"
                                  ? "bg-green-100 text-[#16A34A]"
                                  : getBidStatus(bid) === "Rejected"
                                  ? "bg-red-100 text-[#DC2626]"
                                  : getBidStatus(bid) === "Awaiting Logistics"
                                  ? "bg-orange-100 text-[#EA580C]"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {getBidStatus(
                                bid
                              )}
                            </span>

                          </td>

                          <td className="px-3 py-3 border-b border-slate-100 text-xs text-slate-600">
                            {getNotificationStatus(
                              bid
                            )}
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
                                <button
                                  onClick={() => {
                                    setWinningBid(
                                      bid
                                    );

                                    setShowWinnerPopup(
                                      true
                                    );
                                  }}
                                  className="border border-green-200 bg-green-50 text-[#16A34A] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100"
                                >
                                  Notify
                                </button>
                              ) : !sentToLogistics ? (
                                <button
                                  onClick={() =>
                                    toggleShortlist(
                                      bid.id
                                    )
                                  }
                                  disabled={
                                    isBiddingOpen ||
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
                                        shortlistedBidIds.length >=
                                          maxShortlistCount
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      : "border border-[#1E40AF] text-[#1E40AF] hover:bg-[#EFF6FF]"
                                  }`}
                                >
                                  {isBiddingOpen
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
                              ) : isShortlisted && !freshWinningBid ? (
                                <button
                                  disabled
                                  className="border border-slate-200 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed"
                                >
                                  Awaiting Logistics
                                </button>
                              ) : isShortlisted && freshWinningBid ? (
                                <span className="text-xs font-medium text-[#DC2626]">
                                  Rejected
                                </span>
                              ) : freshWinningBid ? (
                                <span className="text-xs text-slate-500">
                                  Not shortlisted
                                </span>
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

      {showWinnerPopup &&
        freshWinningBid && (
          <WinnerNotificationPopup
            bid={freshWinningBid}
            unsuccessfulBids={getUnsuccessfulBids()}
            formatMoney={formatMoney}
            formatEta={formatEta}
            onClose={() =>
              setShowWinnerPopup(
                false
              )
            }
          />
        )}

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

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

function WinnerNotificationPopup({
  bid,
  unsuccessfulBids = [],
  formatMoney,
  formatEta,
  onClose,
}) {
  const winnerMessage = `Dear ${bid.supplier},

Congratulations! Your bid has been selected for the order.

Bid Amount: ${formatMoney(bid.amount)}
ETA: ${formatEta(bid.eta)}

Please confirm your availability and prepare the required vehicle and documents.

Thank you.`;

  const unsuccessfulMessage = `Dear Supplier,

Thank you for submitting your bid.

After the final review and winner selection, we regret to inform you that your bid was not selected for this order.

We appreciate your participation and look forward to working with you on future opportunities.

Thank you.`;

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(successMessage);
    } catch {
      alert(
        "Could not copy message. Please copy it manually."
      );
    }
  };

  const openGmailCompose = ({
    to = "",
    bcc = "",
    subjectText,
    bodyText,
  }) => {
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(bodyText);

    let gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;

    if (to) {
      gmailUrl += `&to=${encodeURIComponent(to)}`;
    }

    if (bcc) {
      gmailUrl += `&bcc=${encodeURIComponent(bcc)}`;
    }

    window.open(
      gmailUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const getValidEmails = (supplierList) => {
    return [
      ...new Set(
        supplierList
          .map((item) => item.supplierEmail)
          .filter(
            (email) =>
              email &&
              email.includes("@")
          )
      ),
    ];
  };

  const getValidPhones = (supplierList) => {
    return [
      ...new Set(
        supplierList
          .map((item) => item.supplierPhone)
          .filter(
            (phone) =>
              phone &&
              String(phone).trim() !== ""
          )
      ),
    ];
  };

  const openWinnerEmail = () => {
    if (!bid.supplierEmail) {
      alert(
        "Winning supplier email address is missing."
      );
      return;
    }

    openGmailCompose({
      to: bid.supplierEmail,
      subjectText:
        "Bid Selected - Confirmation Required",
      bodyText: winnerMessage,
    });
  };

  const sendBulkUnsuccessfulEmail = () => {
    const emails =
      getValidEmails(unsuccessfulBids);

    if (emails.length === 0) {
      alert(
        "Unsuccessful suppliers do not have email addresses."
      );
      return;
    }

    openGmailCompose({
      bcc: emails.join(","),
      subjectText:
        "Bid Result Update",
      bodyText:
        unsuccessfulMessage,
    });
  };

  const copyUnsuccessfulPhones = () => {
    const phones =
      getValidPhones(unsuccessfulBids);

    if (phones.length === 0) {
      alert(
        "Unsuccessful suppliers do not have phone numbers."
      );
      return;
    }

    copyText(
      phones.join("\n"),
      "Unsuccessful supplier phone numbers copied."
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl shadow-lg w-[880px] max-w-[94vw] max-h-[90vh] overflow-y-auto p-6">

        <div className="flex justify-between items-start gap-4 mb-5">

          <div>

            <h3 className="text-lg font-bold text-[#1E293B]">
              Supplier Notification Center
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Notify the winner directly and send one BCC email to all unsuccessful suppliers.
            </p>

          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            ×
          </button>

        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">

          <p className="text-xs text-[#16A34A] font-semibold">
            Selected Supplier
          </p>

          <h4 className="text-lg font-bold text-[#1E293B] mt-1">
            {bid.supplier}
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">

            <InfoMini
              label="Bid Amount"
              value={formatMoney(bid.amount)}
              green
            />

            <InfoMini
              label="ETA"
              value={formatEta(bid.eta)}
            />

            <InfoMini
              label="Rating"
              value={`${Number(
                bid.rating || 0
              ).toFixed(1)} / 5`}
            />

            <InfoMini
              label="Compliance"
              value={bid.compliance}
            />

            <InfoMini
              label="Email"
              value={
                bid.supplierEmail ||
                "No email"
              }
            />

            <InfoMini
              label="Phone"
              value={
                bid.supplierPhone ||
                "No phone"
              }
            />

          </div>

        </div>

        <MessageBox
          title="Winning Supplier Message"
          value={winnerMessage}
          color="blue"
          emailButtonText="Gmail Winner"
          onCopy={() =>
            copyText(
              winnerMessage,
              "Winning supplier message copied."
            )
          }
          onEmail={openWinnerEmail}
          onMessage={() =>
            copyText(
              winnerMessage,
              "Winning supplier message copied."
            )
          }
          onPhone={() =>
            bid.supplierPhone
              ? copyText(
                  bid.supplierPhone,
                  "Winning supplier phone copied."
                )
              : alert(
                  "Winning supplier phone number is missing."
                )
          }
        />

        <SupplierGroupBox
          title="Unsuccessful Suppliers"
          count={unsuccessfulBids.length}
          suppliers={unsuccessfulBids}
          label="Unsuccessful"
          color="red"
          formatMoney={formatMoney}
          formatEta={formatEta}
        />

        <MessageBox
          title="Unsuccessful Supplier Message"
          value={unsuccessfulMessage}
          color="red"
          emailButtonText="Gmail All Unsuccessful"
          messageButtonText="Copy Message"
          phoneButtonText="Copy Phones"
          onCopy={() =>
            copyText(
              unsuccessfulMessage,
              "Unsuccessful supplier message copied."
            )
          }
          onEmail={sendBulkUnsuccessfulEmail}
          onMessage={() =>
            copyText(
              unsuccessfulMessage,
              "Unsuccessful supplier message copied."
            )
          }
          onPhone={copyUnsuccessfulPhones}
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

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