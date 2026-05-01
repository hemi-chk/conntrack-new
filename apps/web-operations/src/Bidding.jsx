import { useMemo, useState, useEffect } from "react";
import {
  BadgeDollarSign,
  Clock3,
  Star,
  ShieldCheck,
  SlidersHorizontal,
  CircleCheck,
  CircleAlert,
  Info,
  Send,
  PackageCheck,
  Mail,
  AlertTriangle,
} from "lucide-react";

function Bidding() {
  const [activeTab, setActiveTab] = useState("Open");
  const [sortBy, setSortBy] = useState("Lowest Price");
  const [shortlistedSuppliers, setShortlistedSuppliers] = useState([]);

  const [sentToLogistics, setSentToLogistics] = useState(false);
  const [winnerSupplier, setWinnerSupplier] = useState(null);
  const [notificationsSent, setNotificationsSent] = useState(false);

  const [isBiddingOpen, setIsBiddingOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [timerMode, setTimerMode] = useState("open");
  const [timerInput, setTimerInput] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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

  const bids = [
    {
      supplier: "Global Trans",
      years: "3+ Years",
      amount: 15500,
      eta: "June 16, 2025",
      etaTag: "Fastest",
      rating: 4.2,
      compliance: "Completed",
      badge: "BEST PRICE",
      badgeColor: "green",
    },
    {
      supplier: "OceanLink Carriers",
      years: "5+ Years",
      amount: 16000,
      eta: "June 26, 2025",
      etaTag: "",
      rating: 4.0,
      compliance: "Pending",
      badge: "",
      badgeColor: "",
    },
    {
      supplier: "Prime Freight",
      years: "4+ Years",
      amount: 16200,
      eta: "June 16, 2025",
      etaTag: "Fastest",
      rating: 4.6,
      compliance: "Completed",
      badge: "TOP RATED",
      badgeColor: "amber",
    },
    {
      supplier: "Horizon Shipping",
      years: "2+ Years",
      amount: 16300,
      eta: "June 16, 2025",
      etaTag: "Fastest",
      rating: 4.1,
      compliance: "Completed",
      badge: "",
      badgeColor: "",
    },
    {
      supplier: "BlueWave Transport",
      years: "3+ Years",
      amount: 16500,
      eta: "June 26, 2025",
      etaTag: "",
      rating: 3.8,
      compliance: "Pending",
      badge: "",
      badgeColor: "",
    },
  ];

  const sortedBids = useMemo(() => {
    const data = [...bids];

    if (sortBy === "Lowest Price") return data.sort((a, b) => a.amount - b.amount);
    if (sortBy === "Highest Rating") return data.sort((a, b) => b.rating - a.rating);

    if (sortBy === "Compliance") {
      return data.sort((a, b) => {
        if (a.compliance === b.compliance) return 0;
        return a.compliance === "Completed" ? -1 : 1;
      });
    }

    return data;
  }, [sortBy]);

  const lowestPriceBid = [...bids].sort((a, b) => a.amount - b.amount)[0];
  const fastestEtaBids = bids.filter((b) => b.eta === "June 16, 2025");
  const highestRatedBid = [...bids].sort((a, b) => b.rating - a.rating)[0];

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const convertToSeconds = () => {
    return (
      Number(timerInput.days) * 86400 +
      Number(timerInput.hours) * 3600 +
      Number(timerInput.minutes) * 60 +
      Number(timerInput.seconds)
    );
  };

  const openTimerPopup = () => {
    setTimerMode("open");
    setShowTimerPopup(true);
  };

  const closeBidding = () => {
    setShowCloseConfirm(true);
  };

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
    setTimerInput({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  };

  const toggleShortlist = (supplier) => {
    if (sentToLogistics || !isBiddingOpen) return;

    setShortlistedSuppliers((prev) => {
      if (prev.includes(supplier)) {
        return prev.filter((item) => item !== supplier);
      }

      if (prev.length >= 6) {
        alert("You can shortlist maximum 6 suppliers only.");
        return prev;
      }

      return [...prev, supplier];
    });
  };

  const sendShortlistedToLogistics = () => {
    if (shortlistedSuppliers.length === 0) {
      alert("Please shortlist at least one supplier.");
      return;
    }

    setSentToLogistics(true);
    alert(`${shortlistedSuppliers.length} shortlisted suppliers sent to Logistics Team.`);
  };

  const simulateLogisticsWinner = () => {
    setWinnerSupplier("Global Trans");
    setActiveTab("Closed");
  };

  const sendSupplierNotifications = () => {
    if (!winnerSupplier) {
      alert("Logistics has not selected a winner yet.");
      return;
    }

    setNotificationsSent(true);
    alert("Selected and rejected supplier notifications sent successfully.");
  };

  const getComplianceClass = (status) =>
    status === "Completed"
      ? "bg-green-100 text-[#16A34A]"
      : "bg-orange-100 text-[#EA580C]";

  const renderStars = (value) => {
    const full = Math.floor(value);
    const empty = 5 - full;

    return (
      <div className="flex items-center gap-1">
        <span className="text-[#EA580C] text-xs">
          {"★".repeat(full)}
          {"☆".repeat(empty)}
        </span>
        <span className="text-slate-600 text-xs">{value}</span>
      </div>
    );
  };

  const getSupplierIcon = (supplier) => (
    <div className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#1E40AF] text-sm font-bold">
      {supplier.charAt(0)}
    </div>
  );

  const getBidStatus = (supplier) => {
    if (!winnerSupplier) {
      return shortlistedSuppliers.includes(supplier) ? "Shortlisted" : "Under Review";
    }

    return supplier === winnerSupplier ? "Selected" : "Rejected";
  };

  const getNotificationStatus = (supplier) => {
    if (!winnerSupplier) return "Pending";
    if (!notificationsSent) return "Pending Notification";
    return supplier === winnerSupplier ? "Selected Email Sent" : "Rejected Email Sent";
  };

  return (
    <div className="bg-[#EFF6FF] p-4 min-h-full">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[50px_110px_110px_110px_110px_100px_360px] gap-1 items-center">
            <div className="w-10 h-10 rounded-lg bg-[#1E40AF] flex items-center justify-center">
              <PackageCheck className="text-white" size={20} />
            </div>

            <InfoBox label="Order ID" value="EXP-1023" />
            <InfoBox label="Type" value="EXPORT" />
            <InfoBox label="Pickup" value="New York" />
            <InfoBox label="Destination" value="New York" />
            <InfoBox label="Container" value="40 FT" />

            <div className="border-l border-slate-200 pl-4 pr-2 flex items-center gap-8">
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <span
                  className={`px-5 py-2 rounded-full text-sm font-semibold ${
                    isBiddingOpen
                      ? "bg-green-100 text-[#16A34A]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isBiddingOpen ? "Bidding Open" : "Not Started"}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500">Available Bids</p>
                <p className="text-xl font-bold text-[#1E40AF] leading-tight">
                  {bids.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Closes In</p>
                <p className="text-xl font-bold text-red-500 leading-tight">
                  {isBiddingOpen ? formatTime(timeLeft) : "Not Started"}
                </p>
              </div>
            </div>
          </div>
        </div>

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

            {!sentToLogistics ? (
              <button
                onClick={sendShortlistedToLogistics}
                className="bg-[#1E40AF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1E3A8A] flex items-center gap-2"
              >
                <Send size={16} />
                Send Shortlisted to Logistics
              </button>
            ) : !winnerSupplier ? (
              <button
                onClick={simulateLogisticsWinner}
                className="bg-orange-100 text-[#EA580C] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
              >
                Waiting for Logistics Selection
              </button>
            ) : (
              <button
                onClick={sendSupplierNotifications}
                className="bg-[#1E40AF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1E3A8A] flex items-center gap-2"
              >
                <Mail size={16} />
                Send Supplier Notifications
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <SummaryCard
            icon={<BadgeDollarSign className="text-[#16A34A]" size={22} />}
            title="Lowest Price"
            value={`LKR ${lowestPriceBid.amount.toLocaleString()}`}
            subtitle={lowestPriceBid.supplier}
            tag="Best Price"
            tagClass="bg-green-100 text-[#16A34A]"
          />

          <SummaryCard
            icon={<Clock3 className="text-[#1E40AF]" size={22} />}
            title="Fastest ETA"
            value="June 16, 2025"
            subtitle={fastestEtaBids.map((b) => b.supplier).join(", ")}
          />

          <SummaryCard
            icon={<Star className="text-[#EA580C]" size={22} />}
            title="Highest Rating"
            value={`${highestRatedBid.rating} / 5`}
            subtitle={highestRatedBid.supplier}
            tag="Top Rated"
            tagClass="bg-orange-100 text-[#EA580C]"
          />

          <SummaryCard
            icon={<ShieldCheck className="text-[#7C3AED]" size={22} />}
            title="Shortlisted"
            value={`${shortlistedSuppliers.length} Suppliers`}
            subtitle={
              shortlistedSuppliers.length > 0
                ? shortlistedSuppliers.join(", ")
                : "No suppliers shortlisted"
            }
          />
        </div>

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
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="bg-[#EFF6FF] text-[#1E293B]">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-[13px]">Supplier</th>
                  <th className="text-left px-3 py-3 font-semibold text-[13px]">
                    Bid Amount <Info size={13} className="inline ml-1" />
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-[13px]">ETA ↓</th>
                  <th className="text-left px-3 py-3 font-semibold text-[13px]">
                    Rating <Info size={13} className="inline ml-1" />
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-[13px]">Compliance</th>
                  <th className="text-left px-3 py-3 font-semibold text-[13px]">Bid Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-[13px]">Notification</th>
                  <th className="text-center px-3 py-3 font-semibold text-[13px]">Action</th>
                </tr>
              </thead>

              <tbody>
                {sortedBids.map((bid) => {
                  const isLowest = bid.amount === lowestPriceBid.amount;
                  const isShortlisted = shortlistedSuppliers.includes(bid.supplier);
                  const isWinner = winnerSupplier === bid.supplier;

                  return (
                    <tr
                      key={bid.supplier}
                      className={`${
                        isWinner
                          ? "bg-green-50"
                          : isShortlisted
                          ? "bg-blue-50"
                          : isLowest
                          ? "bg-green-50"
                          : "bg-white"
                      }`}
                    >
                      <td className="px-3 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          {(bid.badge || isShortlisted || isWinner) && (
                            <div
                              className={`text-[9px] font-bold px-2 py-1 rounded-md w-[78px] text-center ${
                                isWinner
                                  ? "bg-green-100 text-[#16A34A]"
                                  : isShortlisted
                                  ? "bg-blue-100 text-[#1E40AF]"
                                  : bid.badgeColor === "green"
                                  ? "bg-green-100 text-[#16A34A]"
                                  : "bg-orange-100 text-[#EA580C]"
                              }`}
                            >
                              {isWinner
                                ? "WINNER"
                                : isShortlisted
                                ? "SHORTLISTED"
                                : bid.badge}
                            </div>
                          )}

                          {getSupplierIcon(bid.supplier)}

                          <div>
                            <p className="font-medium text-sm text-[#1E293B]">
                              {bid.supplier}
                            </p>
                            <p className="text-xs text-slate-500">{bid.years}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 border-b border-slate-100 text-sm font-medium text-[#16A34A]">
                        LKR {bid.amount.toLocaleString()}
                      </td>

                      <td className="px-3 py-3 border-b border-slate-100">
                        <p className="text-sm text-[#1E293B]">{bid.eta}</p>
                        {bid.etaTag && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-100 text-[#16A34A] text-xs">
                            {bid.etaTag}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 border-b border-slate-100">
                        {renderStars(bid.rating)}
                      </td>

                      <td className="px-3 py-3 border-b border-slate-100">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs ${getComplianceClass(bid.compliance)}`}
                        >
                          {bid.compliance === "Completed" ? (
                            <CircleCheck size={12} />
                          ) : (
                            <CircleAlert size={12} />
                          )}
                          {bid.compliance}
                        </span>
                      </td>

                      <td className="px-3 py-3 border-b border-slate-100">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs ${
                            getBidStatus(bid.supplier) === "Selected"
                              ? "bg-green-100 text-[#16A34A]"
                              : getBidStatus(bid.supplier) === "Rejected"
                              ? "bg-red-100 text-[#DC2626]"
                              : getBidStatus(bid.supplier) === "Shortlisted"
                              ? "bg-blue-100 text-[#1E40AF]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {getBidStatus(bid.supplier)}
                        </span>
                      </td>

                      <td className="px-3 py-3 border-b border-slate-100 text-xs text-slate-600">
                        {getNotificationStatus(bid.supplier)}
                      </td>

                      <td className="px-3 py-3 border-b border-slate-100 text-center">
                        {!sentToLogistics ? (
                          <button
                            onClick={() => toggleShortlist(bid.supplier)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                              isShortlisted
                                ? "bg-blue-100 text-[#1E40AF]"
                                : "border border-[#C7D2FE] text-[#1E40AF] hover:bg-[#EFF6FF]"
                            }`}
                          >
                            {isShortlisted ? "Remove" : "Shortlist"}
                          </button>
                        ) : (
                          <button className="border border-[#C7D2FE] text-[#1E40AF] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#EFF6FF]">
                            View Supplier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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

      {showTimerPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[420px] p-6">
            <h3 className="text-lg font-semibold text-[#1E293B] mb-4">
              {timerMode === "open" ? "Set Bidding Timer" : "Extend Bidding Timer"}
            </h3>

            <div className="grid grid-cols-4 gap-3 mb-5">
              <TimerInput label="Days" value={timerInput.days} onChange={(value) => setTimerInput({ ...timerInput, days: value })} />
              <TimerInput label="Hours" value={timerInput.hours} onChange={(value) => setTimerInput({ ...timerInput, hours: value })} />
              <TimerInput label="Minutes" value={timerInput.minutes} onChange={(value) => setTimerInput({ ...timerInput, minutes: value })} />
              <TimerInput label="Seconds" value={timerInput.seconds} onChange={(value) => setTimerInput({ ...timerInput, seconds: value })} />
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

function InfoBox({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-[#1E293B]">{value}</p>
    </div>
  );
}

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
          <p className="text-sm text-slate-500 mt-1 break-words">{subtitle}</p>

          {tag && (
            <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs ${tagClass}`}>
              {tag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bidding;