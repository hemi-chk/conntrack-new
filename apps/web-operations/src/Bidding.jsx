import { useMemo, useState, useEffect } from "react";
import {
  BadgeDollarSign,
  Clock3,
  Star,
  SlidersHorizontal,
  CircleCheck,
  CircleAlert,
  Info,
  Send,
  PackageCheck,
  AlertTriangle,
  ChevronDown,
  Mail,
  MessageSquare,
  Phone,
  Copy,
} from "lucide-react";

function Bidding() {
  // Main UI states for tab selection, sorting, shortlisted bids, and logistics submission
  const [activeTab, setActiveTab] = useState("Open");
  const [sortBy, setSortBy] = useState("Lowest Price");
  const [shortlistedBidIds, setShortlistedBidIds] = useState([]);
  const [sentToLogistics, setSentToLogistics] = useState(false);

  // Bidding timer states
  const [isBiddingOpen, setIsBiddingOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(true);

  // Popup and modal control states
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [selectedBidForDetails, setSelectedBidForDetails] = useState(null);

  // Stores final winner selected by Logistics or manually marked by Operations
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

  // Loads selected order, shortlisted bids, and winning bid from sessionStorage when page opens
  useEffect(() => {
    const biddingOrder = sessionStorage.getItem("biddingOrder");

    if (biddingOrder) {
      const parsedOrder = JSON.parse(biddingOrder);
      setSelectedOrder(parsedOrder);
      fetchBids(parsedOrder);
    } else {
      fetchBids();
    }

    const savedShortlistedIds = sessionStorage.getItem(
      "shortlistedBidIdsForLogistics"
    );

    if (savedShortlistedIds) {
      const parsedIds = JSON.parse(savedShortlistedIds);
      setShortlistedBidIds(parsedIds);
      setSentToLogistics(true);
    } else {
      const savedShortlisted = sessionStorage.getItem(
        "shortlistedBidsForLogistics"
      );

      if (savedShortlisted) {
        const parsedShortlisted = JSON.parse(savedShortlisted);
        setShortlistedBidIds(parsedShortlisted.map((bid) => bid.id));
        setSentToLogistics(true);
      }
    }

    const selectedWinner = sessionStorage.getItem(
      "selectedWinningBidForOperations"
    );

    if (selectedWinner) {
      const parsedWinner = JSON.parse(selectedWinner);
      setWinningBid(parsedWinner);
      setShowWinnerPopup(true);
    }
  }, []);

  // Runs countdown timer and automatically closes bidding when time reaches zero
  useEffect(() => {
    if (!isBiddingOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsBiddingOpen(false);
          setActiveTab("Closed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBiddingOpen, timeLeft]);

  // Extracts order reference from different possible order object formats
  const getOrderReference = (order) => {
    return (
      order?.id ||
      order?.orderReference ||
      order?.order_reference ||
      order?.orderId ||
      ""
    );
  };

  // Fetches bid data from backend. If an order is selected, only bids for that order are loaded
  const fetchBids = async (order = null) => {
    try {
      setIsLoading(true);

      const orderReference = getOrderReference(order);

      const url = orderReference
        ? `http://localhost:5000/api/operations/bids?order_reference=${encodeURIComponent(
            orderReference
          )}`
        : "http://localhost:5000/api/operations/bids";

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch bids");
      }

      const normalizedBids = result.map((bid) => normalizeBid(bid, order));
      setBids(normalizedBids);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
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
      bid.supplier_rating || bid.suppliers?.rating || bid.rating || 0
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
      supplierId: bid.supplier_id || bid.suppliers?.supplier_id || "-",
      supplier: supplierName,
      supplierEmail,
      supplierPhone,
      years: bid.supplier_experience_years
        ? `${bid.supplier_experience_years}+ Years`
        : bid.suppliers?.experience_years
        ? `${bid.suppliers.experience_years}+ Years`
        : "-",
      amount: Number(bid.bid_amount || bid.amount || bid.price || 0),
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
      notificationStatus: bid.notification_status || "Pending",
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
        bid.pickup_state ||
        bid.pickup_country ||
        bid.orders?.pickup_state ||
        bid.orders?.pickup_country ||
        orderData?.pickup ||
        orderData?.pickup_state ||
        "-",
      destination:
        bid.destination_state ||
        bid.destination_country ||
        bid.orders?.destination_state ||
        bid.orders?.destination_country ||
        orderData?.destination ||
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
      vehicleNumber: bid.vehicle_number || bid.vehicles?.vehicle_number || "-",
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

  // Sorts bid table based on selected sort option
  const sortedBids = useMemo(() => {
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
        (a, b) => (rank[a.compliance] || 99) - (rank[b.compliance] || 99)
      );
    }

    return data;
  }, [bids, sortBy]);

  // Finds lowest price bid for summary card and recommendation badge
  const lowestPriceBid = useMemo(() => {
    if (bids.length === 0) return null;
    return [...bids].sort((a, b) => a.amount - b.amount)[0];
  }, [bids]);

  // Finds highest rated supplier bid for summary card
  const highestRatedBid = useMemo(() => {
    if (bids.length === 0) return null;
    return [...bids].sort((a, b) => b.rating - a.rating)[0];
  }, [bids]);

  // Finds fastest ETA bid. Multiple suppliers can have the same fastest ETA
  const fastestEtaBids = useMemo(() => {
    if (bids.length === 0) return [];

    const validEtaBids = bids.filter((bid) => bid.eta && bid.eta !== "-");
    if (validEtaBids.length === 0) return [];

    const sortedByEta = [...validEtaBids].sort(
      (a, b) => new Date(a.eta) - new Date(b.eta)
    );

    const fastestEta = sortedByEta[0].eta;
    return validEtaBids.filter((bid) => bid.eta === fastestEta);
  }, [bids]);

  // Displays selected order details. Falls back to first bid data if selected order is missing
  const displayOrder = {
    orderReference:
      getOrderReference(selectedOrder) ||
      bids[0]?.orderReference ||
      "No order selected",
    orderType:
      selectedOrder?.type ||
      selectedOrder?.order_type ||
      bids[0]?.orderType ||
      "-",
    pickup:
      selectedOrder?.pickup ||
      selectedOrder?.pickup_state ||
      bids[0]?.pickup ||
      "-",
    destination:
      selectedOrder?.destination ||
      selectedOrder?.destination_state ||
      bids[0]?.destination ||
      "-",
    container:
      selectedOrder?.containerNo ||
      selectedOrder?.container_no ||
      bids[0]?.container ||
      "-",
    cargoType:
      selectedOrder?.cargoType ||
      selectedOrder?.cargo_type ||
      bids[0]?.cargoType ||
      "-",
    cargoWeight:
      selectedOrder?.cargoWeight ||
      selectedOrder?.cargo_weight ||
      bids[0]?.cargoWeight ||
      "-",
    vehicleType:
      selectedOrder?.vehicleType ||
      selectedOrder?.vehicle_type ||
      bids[0]?.vehicleType ||
      "-",
    pickupDate:
      selectedOrder?.pickupDate ||
      selectedOrder?.pickup_date ||
      bids[0]?.pickupDate ||
      "-",
    expectedArrival:
      selectedOrder?.expectedArrival ||
      selectedOrder?.expected_arrival ||
      bids[0]?.expectedArrival ||
      "-",
    specialInstructions:
      selectedOrder?.specialInstructions ||
      selectedOrder?.special_instructions ||
      bids[0]?.specialInstructions ||
      "-",
  };

  // Formatting helpers for money, ETA date, and timer display
  const formatMoney = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

  const formatEta = (value) => {
    if (!value || value === "-") return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  // Converts timer input fields into total seconds
  const convertToSeconds = () =>
    Number(timerInput.days) * 86400 +
    Number(timerInput.hours) * 3600 +
    Number(timerInput.minutes) * 60 +
    Number(timerInput.seconds);

  const openTimerPopup = () => {
    setTimerMode("open");
    setShowTimerPopup(true);
  };

  const closeBidding = () => setShowCloseConfirm(true);

  // Confirms manual bidding close and moves active tab to Closed
  const confirmCloseBidding = () => {
    setIsBiddingOpen(false);
    setTimeLeft(0);
    setActiveTab("Closed");
    setShowCloseConfirm(false);
  };

  const extendTimerPopup = () => {
    setTimerMode("extend");
    setShowTimerPopup(true);
  };

  // Starts or extends bidding timer after validating entered time
  const confirmTimer = () => {
    const seconds = convertToSeconds();

    if (seconds <= 0) {
      alert("Please enter valid time.");
      return;
    }

    if (timerMode === "open") {
      setTimeLeft(seconds);
      setIsBiddingOpen(true);
      setActiveTab("Open");
    }

    if (timerMode === "extend") {
      setTimeLeft((prev) => prev + seconds);
      setIsBiddingOpen(true);
      setActiveTab("Open");
    }

    setShowTimerPopup(false);
    setTimerInput({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  };

  // Adds/removes supplier from shortlist. Maximum 5 bids can be shortlisted
  const toggleShortlist = (bidId) => {
    if (sentToLogistics) return;

    setShortlistedBidIds((prev) => {
      if (prev.includes(bidId)) return prev.filter((item) => item !== bidId);

      if (prev.length >= 5) {
        alert("You can shortlist maximum 5 suppliers only.");
        return prev;
      }

      return [...prev, bidId];
    });
  };

  // Saves shortlisted bids to sessionStorage so Logistics side can access them
  const sendShortlistedToLogistics = () => {
    if (shortlistedBidIds.length === 0) {
      alert("Please shortlist at least one supplier.");
      return;
    }

    const shortlistedBids = bids.filter((bid) =>
      shortlistedBidIds.includes(bid.id)
    );

    sessionStorage.setItem(
      "shortlistedBidsForLogistics",
      JSON.stringify(shortlistedBids)
    );

    sessionStorage.setItem(
      "shortlistedBidIdsForLogistics",
      JSON.stringify(shortlistedBidIds)
    );

    setSentToLogistics(true);
    alert(
      `${shortlistedBids.length} shortlisted suppliers sent to Logistics Team.`
    );
  };

  // Matches the stored winning bid with latest loaded bid data
  const getFreshWinningBid = () => {
    if (!winningBid) return null;

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

  // Shortlisted suppliers who were not selected as winner
  const getRejectedShortlistedBids = () => {
    const freshWinner = getFreshWinningBid();

    if (!freshWinner) return [];

    return bids.filter(
      (bid) =>
        shortlistedBidIds.includes(bid.id) &&
        Number(bid.id) !== Number(freshWinner.id)
    );
  };

  // Suppliers who submitted bids but were not shortlisted
  const getNotShortlistedBids = () => {
    return bids.filter((bid) => !shortlistedBidIds.includes(bid.id));
  };

  // Returns Tailwind classes based on supplier compliance status
  const getComplianceClass = (status) => {
    if (status === "Verified" || status === "Completed") {
      return "bg-green-100 text-[#16A34A]";
    }

    if (status === "Pending" || status === "Warning") {
      return "bg-orange-100 text-[#EA580C]";
    }

    if (status === "Blocked") return "bg-red-100 text-[#DC2626]";

    return "bg-slate-100 text-[#1E293B]";
  };

  // Displays supplier rating as star text
  const renderStars = (value) => {
    const safeValue = Number(value || 0);
    const full = Math.floor(safeValue);
    const empty = 5 - full;

    return (
      <div className="flex items-center gap-1">
        <span className="text-[#EA580C] text-xs">
          {"★".repeat(full)}
          {"☆".repeat(empty)}
        </span>

        <span className="text-slate-600 text-xs">
          {safeValue > 0 ? safeValue.toFixed(1) : "-"}
        </span>
      </div>
    );
  };

  // Creates supplier avatar using first letter of supplier name
  const getSupplierIcon = (supplier) => (
    <div className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#1E40AF] text-sm font-bold">
      {supplier?.charAt(0) || "S"}
    </div>
  );

  // Displays bid status based on winner, shortlist, or original backend status
  const getBidStatus = (bid) => {
    const freshWinner = getFreshWinningBid();

    if (freshWinner?.id === bid.id) return "Winner Selected";
    if (shortlistedBidIds.includes(bid.id)) return "Shortlisted";

    return bid.bidStatus || "Under Review";
  };

  // Displays notification status based on shortlist and winner process
  const getNotificationStatus = (bid) => {
    const freshWinner = getFreshWinningBid();

    if (freshWinner?.id === bid.id) return "Ready to Notify";

    if (sentToLogistics && shortlistedBidIds.includes(bid.id)) {
      return "Sent to Logistics";
    }

    if (sentToLogistics && !shortlistedBidIds.includes(bid.id)) {
      return "Not Shortlisted";
    }

    return bid.notificationStatus || "Pending";
  };

  // Generates recommendation label for each supplier bid
  const getRecommendation = (bid) => {
    if (!lowestPriceBid || !highestRatedBid) return "";
    if (bid.id === lowestPriceBid.id) return "BEST PRICE";
    if (bid.id === highestRatedBid.id) return "TOP RATED";

    if (bid.compliance === "Verified" || bid.compliance === "Completed") {
      return "COMPLIANT";
    }

    if (bid.compliance === "Warning") return "REVIEW";

    return "";
  };

  // Returns icon for recommendation label
  const getRecommendationIcon = (recommendation) => {
    if (recommendation === "BEST PRICE") {
      return <BadgeDollarSign size={14} className="text-[#16A34A]" />;
    }

    if (recommendation === "TOP RATED") {
      return <Star size={14} className="text-[#EA580C]" />;
    }

    if (recommendation === "COMPLIANT") {
      return <CircleCheck size={14} className="text-[#16A34A]" />;
    }

    if (recommendation === "REVIEW") {
      return <CircleAlert size={14} className="text-[#EA580C]" />;
    }

    return null;
  };

  // Calculates supplier score out of 100
  // Price = 40%, ETA = 20%, Rating = 20%, Compliance = 20%
  const calculateSupplierScore = (bid) => {
    let priceScore = 0;
    let etaScore = 0;
    let ratingScore = 0;
    let complianceScore = 0;

    if (lowestPriceBid && bid.amount > 0) {
      priceScore = Math.round((lowestPriceBid.amount / bid.amount) * 40);
      if (priceScore > 40) priceScore = 40;
    }

    if (fastestEtaBids.some((item) => item.id === bid.id)) {
      etaScore = 20;
    } else if (bid.eta && bid.eta !== "-") {
      etaScore = 12;
    } else {
      etaScore = 0;
    }

    ratingScore = Math.round((Number(bid.rating || 0) / 5) * 20);
    if (ratingScore > 20) ratingScore = 20;

    if (bid.compliance === "Verified" || bid.compliance === "Completed") {
      complianceScore = 20;
    } else if (bid.compliance === "Pending") {
      complianceScore = 10;
    } else if (bid.compliance === "Warning") {
      complianceScore = 5;
    } else {
      complianceScore = 0;
    }

    const totalScore = priceScore + etaScore + ratingScore + complianceScore;

    return {
      priceScore,
      etaScore,
      ratingScore,
      complianceScore,
      totalScore,
    };
  };

  // Allows Operations to manually mark a shortlisted bid as winner for notification
  const openWinnerPopupManually = (bid) => {
    setWinningBid(bid);
    setShowWinnerPopup(true);
    sessionStorage.setItem(
      "selectedWinningBidForOperations",
      JSON.stringify({ id: bid.id, bidId: bid.bidId })
    );
  };

  const freshWinningBid = getFreshWinningBid();

  return (
    <div className="bg-[#EFF6FF] p-5 min-h-full">
      <div className="max-w-[1500px] mx-auto space-y-4">
        {/* Top bidding status cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-[760px]">
          <MiniStatusCard
            title="Status"
            value={isBiddingOpen ? "Bidding Open" : "Not Started"}
            type={isBiddingOpen ? "success" : "neutral"}
          />

          <MiniStatusCard
            title="Closes In"
            value={isBiddingOpen ? formatTime(timeLeft) : "Not Started"}
            type="danger"
          />

          <MiniStatusCard
            title="Available Bids"
            value={bids.length}
            type="primary"
          />
        </div>

        {/* Order detail card with collapsible detail table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E40AF] flex items-center justify-center shrink-0">
                <PackageCheck className="text-white" size={20} />
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
              onClick={() => setShowOrderDetails(!showOrderDetails)}
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#1E40AF] hover:bg-[#EFF6FF] transition"
              title={
                showOrderDetails ? "Hide order details" : "Show order details"
              }
            >
              <ChevronDown
                size={20}
                className={`transition-transform duration-300 ${
                  showOrderDetails ? "rotate-180" : ""
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
                    <OrderTableCell label="Type" value={displayOrder.orderType} />
                    <OrderTableCell label="Pickup" value={displayOrder.pickup} />
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
                      label="Pickup Date"
                      value={formatEta(displayOrder.pickupDate)}
                    />
                    <OrderTableCell
                      label="Expected Arrival"
                      value={formatEta(displayOrder.expectedArrival)}
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

        {/* Bidding action controls */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={openTimerPopup}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "Open"
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
              onClick={closeBidding}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "Closed"
                  ? "bg-[#1E40AF] text-white"
                  : "bg-white text-[#1E293B] border border-slate-200"
              }`}
            >
              Closed Bidding
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={extendTimerPopup}
              className="bg-white border border-slate-200 text-[#1E40AF] px-3 py-2 rounded-lg text-sm font-medium"
            >
              Extend Timer
            </button>

            <button
              onClick={sendShortlistedToLogistics}
              disabled={sentToLogistics}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                sentToLogistics
                  ? "bg-green-100 text-[#16A34A]"
                  : "bg-[#1E40AF] text-white hover:bg-[#1E3A8A]"
              }`}
            >
              <Send size={16} />
              {sentToLogistics
                ? "Shortlist Sent to Logistics"
                : `Send Shortlisted to Logistics (${shortlistedBidIds.length}/5)`}
            </button>
          </div>
        </div>

        {/* Recommendation summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            icon={<BadgeDollarSign className="text-[#16A34A]" size={22} />}
            title="Lowest Price"
            value={lowestPriceBid ? formatMoney(lowestPriceBid.amount) : "-"}
            subtitle={lowestPriceBid?.supplier || "No bids available"}
            tag={lowestPriceBid ? "Best Price" : ""}
            tagClass="bg-green-100 text-[#16A34A]"
          />

          <SummaryCard
            icon={<Clock3 className="text-[#1E40AF]" size={22} />}
            title="Fastest ETA"
            value={
              fastestEtaBids.length > 0 ? formatEta(fastestEtaBids[0].eta) : "-"
            }
            subtitle={
              fastestEtaBids.length > 0
                ? fastestEtaBids.map((bid) => bid.supplier).join(", ")
                : "No ETA available"
            }
          />

          <SummaryCard
            icon={<Star className="text-[#EA580C]" size={22} />}
            title="Highest Rating"
            value={
              highestRatedBid ? `${highestRatedBid.rating.toFixed(1)} / 5` : "-"
            }
            subtitle={highestRatedBid?.supplier || "No ratings available"}
            tag={highestRatedBid ? "Top Rated" : ""}
            tagClass="bg-orange-100 text-[#EA580C]"
          />
        </div>

        {/* Main supplier bid comparison table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#1E293B]">
              Supplier Bids Comparison
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sort by:</span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#1E293B] bg-white"
              >
                <option>Lowest Price</option>
                <option>Highest Rating</option>
                <option>Compliance</option>
              </select>

              <button className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-[#1E293B] bg-white flex items-center gap-2">
                <SlidersHorizontal size={14} />
                Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading bids...
              </div>
            ) : sortedBids.length === 0 ? (
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
                      Bid Amount <Info size={13} className="inline ml-1" />
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      ETA ↓
                    </th>
                    <th className="text-left px-3 py-3 font-semibold text-[13px]">
                      Rating <Info size={13} className="inline ml-1" />
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
                  {sortedBids.map((bid) => {
                    const isLowest = lowestPriceBid?.id === bid.id;
                    const isShortlisted = shortlistedBidIds.includes(bid.id);
                    const isWinner = freshWinningBid?.id === bid.id;
                    const recommendation = getRecommendation(bid);
                    const score = calculateSupplierScore(bid);

                    return (
                      <tr
                        key={bid.id}
                        className={
                          isWinner
                            ? "bg-green-50"
                            : isShortlisted || isLowest
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

                            {getSupplierIcon(bid.supplier)}

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-[#1E293B]">
                                  {bid.supplier}
                                </p>

                                {recommendation && (
                                  <span
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 border border-slate-200"
                                    title={recommendation}
                                  >
                                    {getRecommendationIcon(recommendation)}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500">
                                {bid.years}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {bid.supplierEmail || "No email"}{" "}
                                {bid.supplierPhone
                                  ? `• ${bid.supplierPhone}`
                                  : "• No phone"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100 text-sm font-medium text-[#16A34A]">
                          {formatMoney(bid.amount)}
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100">
                          <p className="text-sm text-[#1E293B]">
                            {formatEta(bid.eta)}
                          </p>

                          {fastestEtaBids.some((item) => item.id === bid.id) && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-100 text-[#16A34A] text-xs">
                              Fastest
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100">
                          {renderStars(bid.rating)}
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs ${getComplianceClass(
                              bid.compliance
                            )}`}
                          >
                            {bid.compliance === "Verified" ||
                            bid.compliance === "Completed" ? (
                              <CircleCheck size={12} />
                            ) : (
                              <CircleAlert size={12} />
                            )}

                            {bid.compliance}
                          </span>
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100 text-xs text-slate-600 max-w-[220px]">
                          {bid.pastPerformance}
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100">
                          <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1E40AF] text-xs font-semibold">
                            {score.totalScore}/100
                          </span>
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs ${
                              getBidStatus(bid) === "Shortlisted"
                                ? "bg-[#EFF6FF] text-[#1E40AF]"
                                : getBidStatus(bid) === "Winner Selected"
                                ? "bg-green-100 text-[#16A34A]"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {getBidStatus(bid)}
                          </span>
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100 text-xs text-slate-600">
                          {getNotificationStatus(bid)}
                        </td>

                        <td className="px-3 py-3 border-b border-slate-100 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedBidForDetails(bid)}
                              className="border border-slate-200 text-[#1E40AF] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#EFF6FF]"
                            >
                              View Details
                            </button>

                            {isWinner ? (
                              <button
                                onClick={() => {
                                  setWinningBid(bid);
                                  setShowWinnerPopup(true);
                                }}
                                className="border border-green-200 bg-green-50 text-[#16A34A] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100"
                              >
                                Notify
                              </button>
                            ) : !sentToLogistics ? (
                              <button
                                onClick={() => toggleShortlist(bid.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                  isShortlisted
                                    ? "bg-[#EFF6FF] text-[#1E40AF] border border-[#1E40AF]"
                                    : "border border-[#1E40AF] text-[#1E40AF] hover:bg-[#EFF6FF]"
                                }`}
                              >
                                {isShortlisted ? "Remove" : "Shortlist"}
                              </button>
                            ) : isShortlisted ? (
                              <button
                                onClick={() => openWinnerPopupManually(bid)}
                                className="border border-[#1E40AF] text-[#1E40AF] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#EFF6FF]"
                              >
                                Mark Winner
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
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Score calculation popup */}
      {selectedBidForDetails && (
        <ScoreDetailsModal
          bid={selectedBidForDetails}
          score={calculateSupplierScore(selectedBidForDetails)}
          formatMoney={formatMoney}
          formatEta={formatEta}
          onClose={() => setSelectedBidForDetails(null)}
        />
      )}

      {/* Winner and rejection notification popup */}
      {showWinnerPopup && freshWinningBid && (
        <WinnerNotificationPopup
          bid={freshWinningBid}
          rejectedBids={getRejectedShortlistedBids()}
          notShortlistedBids={getNotShortlistedBids()}
          formatMoney={formatMoney}
          formatEta={formatEta}
          onClose={() => setShowWinnerPopup(false)}
        />
      )}

      {/* Close bidding confirmation popup */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[380px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="text-[#DC2626]" size={22} />
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
                onClick={() => setShowCloseConfirm(false)}
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

      {/* Timer popup for opening or extending bidding */}
      {showTimerPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[420px] p-6">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-4">
              {timerMode === "open"
                ? "Set Bidding Timer"
                : "Extend Bidding Timer"}
            </h3>

            <div className="grid grid-cols-4 gap-3 mb-5">
              <TimerInput
                label="Days"
                value={timerInput.days}
                onChange={(value) =>
                  setTimerInput({ ...timerInput, days: value })
                }
              />

              <TimerInput
                label="Hours"
                value={timerInput.hours}
                onChange={(value) =>
                  setTimerInput({ ...timerInput, hours: value })
                }
              />

              <TimerInput
                label="Minutes"
                value={timerInput.minutes}
                onChange={(value) =>
                  setTimerInput({ ...timerInput, minutes: value })
                }
              />

              <TimerInput
                label="Seconds"
                value={timerInput.seconds}
                onChange={(value) =>
                  setTimerInput({ ...timerInput, seconds: value })
                }
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTimerPopup(false)}
                className="px-4 py-2 rounded-md border border-slate-200 text-sm text-[#1E293B]"
              >
                Cancel
              </button>

              <button
                onClick={confirmTimer}
                className="px-4 py-2 rounded-md bg-[#1E40AF] text-white text-sm"
              >
                {timerMode === "open" ? "Start Bidding" : "Add Time"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Popup used to notify winner, rejected shortlisted suppliers, and not-shortlisted suppliers
function WinnerNotificationPopup({
  bid,
  rejectedBids = [],
  notShortlistedBids = [],
  formatMoney,
  formatEta,
  onClose,
}) {
  // Predefined message templates for each supplier result group
  const winnerMessage = `Dear ${bid.supplier},

Congratulations! Your bid has been selected for the order.

Bid Amount: ${formatMoney(bid.amount)}
ETA: ${formatEta(bid.eta)}

Please confirm your availability and prepare the required vehicle and documents.

Thank you.`;

  const rejectedMessage = `Dear Supplier,

Thank you for submitting your bid.

After the final review by the Logistics Team, we regret to inform you that your bid was not selected for this order.

We appreciate your participation and look forward to working with you on future opportunities.

Thank you.`;

  const notShortlistedMessage = `Dear Supplier,

Thank you for submitting your bid.

After the initial evaluation, your bid was not shortlisted for this order.

We appreciate your participation and look forward to receiving your bids for future orders.

Thank you.`;

  // Copies message or phone numbers to clipboard
  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(successMessage);
    } catch {
      alert("Could not copy message. Please copy it manually.");
    }
  };

  // Opens Gmail compose window with subject/body and optional to/bcc fields
  const openGmailCompose = ({ to = "", bcc = "", subjectText, bodyText }) => {
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(bodyText);

    let gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;

    if (to) {
      gmailUrl += `&to=${encodeURIComponent(to)}`;
    }

    if (bcc) {
      gmailUrl += `&bcc=${encodeURIComponent(bcc)}`;
    }

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  // Collects unique valid supplier emails for bulk BCC
  const getValidEmails = (supplierList) => {
    return [
      ...new Set(
        supplierList
          .map((item) => item.supplierEmail)
          .filter((email) => email && email.includes("@"))
      ),
    ];
  };

  // Collects unique supplier phone numbers for manual phone/message follow-up
  const getValidPhones = (supplierList) => {
    return [
      ...new Set(
        supplierList
          .map((item) => item.supplierPhone)
          .filter((phone) => phone && String(phone).trim() !== "")
      ),
    ];
  };

  // Sends email to winning supplier
  const openWinnerEmail = () => {
    if (!bid.supplierEmail) {
      alert("Winning supplier email address is missing.");
      return;
    }

    openGmailCompose({
      to: bid.supplierEmail,
      subjectText: "Bid Selected - Confirmation Required",
      bodyText: winnerMessage,
    });
  };

  // Sends rejected email to shortlisted suppliers who did not win
  const sendBulkRejectedEmail = () => {
    const emails = getValidEmails(rejectedBids);

    if (emails.length === 0) {
      alert("Rejected shortlisted suppliers do not have email addresses.");
      return;
    }

    openGmailCompose({
      bcc: emails.join(","),
      subjectText: "Bid Result Update",
      bodyText: rejectedMessage,
    });
  };

  // Sends not-shortlisted email to suppliers who were not shortlisted
  const sendBulkNotShortlistedEmail = () => {
    const emails = getValidEmails(notShortlistedBids);

    if (emails.length === 0) {
      alert("Not shortlisted suppliers do not have email addresses.");
      return;
    }

    openGmailCompose({
      bcc: emails.join(","),
      subjectText: "Bid Status Update",
      bodyText: notShortlistedMessage,
    });
  };

  const copyRejectedPhones = () => {
    const phones = getValidPhones(rejectedBids);

    if (phones.length === 0) {
      alert("Rejected shortlisted suppliers do not have phone numbers.");
      return;
    }

    copyText(
      phones.join("\n"),
      "Rejected shortlisted supplier phone numbers copied."
    );
  };

  const copyNotShortlistedPhones = () => {
    const phones = getValidPhones(notShortlistedBids);

    if (phones.length === 0) {
      alert("Not shortlisted suppliers do not have phone numbers.");
      return;
    }

    copyText(phones.join("\n"), "Not shortlisted supplier phone numbers copied.");
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
              Send winner email directly, and send rejected/not-shortlisted
              emails using Gmail BCC.
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
            <InfoMini label="Bid Amount" value={formatMoney(bid.amount)} green />
            <InfoMini label="ETA" value={formatEta(bid.eta)} />
            <InfoMini
              label="Rating"
              value={`${Number(bid.rating || 0).toFixed(1)} / 5`}
            />
            <InfoMini label="Compliance" value={bid.compliance} />
            <InfoMini label="Email" value={bid.supplierEmail || "No email"} />
            <InfoMini label="Phone" value={bid.supplierPhone || "No phone"} />
          </div>
        </div>

        <MessageBox
          title="Winning Supplier Message"
          value={winnerMessage}
          color="blue"
          emailButtonText="Gmail Winner"
          onCopy={() =>
            copyText(winnerMessage, "Winning supplier message copied.")
          }
          onEmail={openWinnerEmail}
          onMessage={() =>
            copyText(winnerMessage, "Winning supplier message copied.")
          }
          onPhone={() =>
            bid.supplierPhone
              ? copyText(bid.supplierPhone, "Winning supplier phone copied.")
              : alert("Winning supplier phone number is missing.")
          }
        />

        <SupplierGroupBox
          title="Rejected Shortlisted Suppliers"
          count={rejectedBids.length}
          suppliers={rejectedBids}
          label="Rejected"
          color="red"
          formatMoney={formatMoney}
          formatEta={formatEta}
        />

        <MessageBox
          title="Rejected Shortlisted Supplier Message"
          value={rejectedMessage}
          color="red"
          emailButtonText="Gmail All Rejected"
          messageButtonText="Copy Message"
          phoneButtonText="Copy Phones"
          onCopy={() =>
            copyText(rejectedMessage, "Rejected supplier message copied.")
          }
          onEmail={sendBulkRejectedEmail}
          onMessage={() =>
            copyText(rejectedMessage, "Rejected supplier message copied.")
          }
          onPhone={copyRejectedPhones}
        />

        <SupplierGroupBox
          title="Not Shortlisted Suppliers"
          count={notShortlistedBids.length}
          suppliers={notShortlistedBids}
          label="Not Shortlisted"
          color="orange"
          formatMoney={formatMoney}
          formatEta={formatEta}
        />

        <MessageBox
          title="Not Shortlisted Supplier Message"
          value={notShortlistedMessage}
          color="orange"
          emailButtonText="Gmail All Not Shortlisted"
          messageButtonText="Copy Message"
          phoneButtonText="Copy Phones"
          onCopy={() =>
            copyText(
              notShortlistedMessage,
              "Not shortlisted supplier message copied."
            )
          }
          onEmail={sendBulkNotShortlistedEmail}
          onMessage={() =>
            copyText(
              notShortlistedMessage,
              "Not shortlisted supplier message copied."
            )
          }
          onPhone={copyNotShortlistedPhones}
        />
      </div>
    </div>
  );
}

// Shows rejected or not-shortlisted supplier groups inside notification popup
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

  const titleClass = color === "red" ? "text-[#DC2626]" : "text-[#EA580C]";

  return (
    <div className={`border ${boxClass} rounded-xl p-4 mb-4`}>
      <p className={`text-xs font-semibold ${titleClass}`}>{title}</p>

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

// Reusable message box with copy, Gmail, message, and phone actions
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
      : "bg-[#1E40AF] hover:bg-[#1E3A8A] text-white";

  const outlineStyle =
    color === "red"
      ? "border border-slate-200 text-[#DC2626] hover:bg-red-50"
      : color === "orange"
      ? "border border-slate-200 text-[#EA580C] hover:bg-orange-50"
      : "border border-slate-200 text-[#1E40AF] hover:bg-[#EFF6FF]";

  return (
    <div className="border border-slate-200 rounded-xl p-4 mb-4">
      <p className="text-xs text-slate-500 mb-2">{title}</p>

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

// Reusable row for each rejected or not-shortlisted supplier
function SupplierResultRow({ supplier, amount, eta, email, phone, label, color }) {
  const badgeClass =
    color === "red"
      ? "text-[#DC2626] bg-red-100"
      : "text-[#EA580C] bg-orange-100";

  return (
    <div className="bg-white border border-slate-100 rounded-lg px-3 py-2 flex justify-between items-center gap-3">
      <div>
        <p className="text-sm font-semibold text-[#1E293B]">{supplier}</p>
        <p className="text-xs text-slate-500">
          Bid: {amount} | ETA: {eta}
        </p>
        <p className="text-[11px] text-slate-400">
          {email || "No email"} {phone ? `• ${phone}` : "• No phone"}
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

function InfoMini({ label, value, green = false }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>

      <p
        className={`text-sm font-semibold mt-1 break-words ${
          green ? "text-[#16A34A]" : "text-[#1E293B]"
        }`}
      >
        {value || "-"}
      </p>
    </div>
  );
}

// Modal that explains how supplier score was calculated
function ScoreDetailsModal({ bid, score, formatMoney, formatEta, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-[520px] max-w-[92vw] p-6">
        <div className="flex justify-between items-start gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#1E293B]">
              Supplier Score Details
            </h3>

            <p className="text-sm text-slate-500 mt-1">{bid.supplier}</p>
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
            note={`${Number(bid.rating || 0).toFixed(1)} / 5`}
          />

          <ScoreBox
            label="Compliance Score"
            value={`${score.complianceScore} / 20`}
            note={bid.compliance}
          />
        </div>

        <div className="bg-[#EFF6FF] border border-blue-100 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">Total Score</p>

            <h2 className="text-2xl font-bold text-[#1E40AF] mt-1">
              {score.totalScore} / 100
            </h2>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Score Basis</p>

            <p className="text-sm font-semibold text-[#1E293B] mt-1">
              Price 40% + ETA 20% + Rating 20% + Compliance 20%
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold hover:bg-[#1E3A8A]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBox({ label, value, note }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <h4 className="text-lg font-bold text-[#1E293B] mt-1">{value}</h4>

      <p className="text-xs text-slate-500 mt-1">{note}</p>
    </div>
  );
}

// Compact bidding status card shown at the top of the page
function MiniStatusCard({ title, value, type = "neutral" }) {
  const styles = {
    success: {
      box: "bg-green-50 border-green-100",
      icon: "bg-green-100 text-[#16A34A]",
      value: "text-[#16A34A]",
    },
    danger: {
      box: "bg-red-50 border-red-100",
      icon: "bg-red-100 text-[#DC2626]",
      value: "text-[#DC2626]",
    },
    primary: {
      box: "bg-blue-50 border-blue-100",
      icon: "bg-[#EFF6FF] text-[#1E40AF]",
      value: "text-[#1E40AF]",
    },
    neutral: {
      box: "bg-white border-slate-200",
      icon: "bg-slate-100 text-slate-600",
      value: "text-[#1E293B]",
    },
  };

  const selected = styles[type] || styles.neutral;

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 shadow-sm flex items-center justify-between w-full max-w-[240px] min-h-[70px] ${selected.box}`}
    >
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500">{title}</p>

        <h3 className={`text-base font-semibold mt-0.5 ${selected.value}`}>
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

// Reusable table cell for the order detail table
function OrderTableCell({ label, value, colSpan = 1 }) {
  return (
    <td colSpan={colSpan} className="px-5 py-4 align-top min-w-[150px]">
      <p className="text-xs text-slate-500 mb-1">{label}</p>

      <p className="text-sm font-semibold text-[#1E293B] break-words">
        {value || "-"}
      </p>
    </td>
  );
}

// Reusable timer input for days, hours, minutes, and seconds
function TimerInput({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-md px-2 py-2 text-sm mt-1"
      />
    </div>
  );
}

// Reusable summary card for lowest price, fastest ETA, and highest rating
function SummaryCard({ icon, title, value, subtitle, tag, tagClass }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm text-slate-600">{title}</p>

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