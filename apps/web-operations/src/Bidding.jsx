import { useState, useMemo } from "react";

function Bidding() {
  const [activeTab, setActiveTab] = useState("Open");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [awardedIndex, setAwardedIndex] = useState(null);

  const order = {
    id: "EXP-1023",
    type: "EXPORT",
    pickup: "New York",
    destination: "New York",
    bidCount: 5,
  };

  const bids = [
    {
      supplier: "Global Trans",
      amount: 15500,
      eta: "June 16",
      rating: 4,
      compliance: "Completed",
      description: "Experienced international freight partner.",
    },
    {
      supplier: "OceanLink Carriers",
      amount: 16000,
      eta: "June 26",
      rating: 4,
      compliance: "Pending",
      description: "Large fleet, slower ETA.",
    },
    {
      supplier: "Prime Freight",
      amount: 16200,
      eta: "June 16",
      rating: 5,
      compliance: "Completed",
      description: "Top-rated supplier with fast delivery.",
    },
    {
      supplier: "BlueWave Transport",
      amount: 16500,
      eta: "June 26",
      rating: 3,
      compliance: "Pending",
      description: "Budget option.",
    },
    {
      supplier: "Horizon Shipping",
      amount: 16300,
      eta: "June 16",
      rating: 4,
      compliance: "Completed",
      description: "Reliable and consistent.",
    },
  ];

  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) =>
      sortAsc ? a.amount - b.amount : b.amount - a.amount
    );
  }, [sortAsc]);

  const lowestBid = Math.min(...bids.map((b) => b.amount));

  const renderStars = (count) =>
    "★".repeat(count) + "☆".repeat(5 - count);

  const complianceBadge = (status) => {
    return status === "Completed"
      ? "bg-green-100 text-[#16A34A]"
      : "bg-orange-100 text-[#EA580C]";
  };

  const confirmAward = () => {
    if (selectedIndex !== null) {
      setAwardedIndex(selectedIndex);
    }
  };

  return (
    <div className="bg-[#EFF6FF] p-6 min-h-full">
      <div className="bg-white rounded-xl shadow-md p-6">

        {/* CONFIRM BUTTON */}
        {selectedIndex !== null && awardedIndex === null && (
          <div className="mb-4">
            <button
              onClick={confirmAward}
              className="bg-[#1E40AF] text-white px-5 py-2 rounded-md text-sm hover:bg-[#1E3A8A]"
            >
              Confirm Award to {sortedBids[selectedIndex].supplier}
            </button>
          </div>
        )}

        {/* TOP CONTROLS */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("Open")}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === "Open"
                  ? "bg-[#1E40AF] text-white"
                  : "bg-gray-100 text-[#1E293B]"
              }`}
            >
              Open Bidding
            </button>

            <button
              onClick={() => setActiveTab("Closed")}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === "Closed"
                  ? "bg-[#1E40AF] text-white"
                  : "bg-gray-100 text-[#1E293B]"
              }`}
            >
              Closed Bidding
            </button>
          </div>

          <button className="text-sm text-[#1E40AF] font-medium">
            Request Intervention →
          </button>
        </div>

        {/* ORDER TABLE */}
        <table className="w-full text-sm mb-6">
          <thead className="bg-[#EFF6FF] text-[#1E293B]">
            <tr>
              <th className="px-4 py-3 text-left w-[18%]">Order ID</th>
              <th className="text-left w-[15%]">Type</th>
              <th className="text-left w-[20%]">Pickup</th>
              <th className="text-left w-[20%]">Destination</th>
              <th className="text-center w-[10%]">Bids</th>
              <th className="text-center w-[17%]">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="px-4 py-3">{order.id}</td>
              <td>{order.type}</td>
              <td>{order.pickup}</td>
              <td>{order.destination}</td>
              <td className="text-center">{order.bidCount}</td>
              <td className="text-center">
                <button className="bg-[#1E40AF] text-white px-3 py-1 rounded-md text-xs">
                  View Bids →
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {/* BIDS TABLE */}
        <table className="w-full text-sm">
          <thead className="bg-[#EFF6FF] text-[#1E293B]">
            <tr>
              <th className="px-4 py-3 text-left w-[18%]">Supplier</th>
              <th
                className="text-center w-[14%] cursor-pointer"
                onClick={() => setSortAsc(!sortAsc)}
              >
                Bid {sortAsc ? "↑" : "↓"}
              </th>
              <th className="text-center w-[12%]">ETA</th>
              <th className="text-center w-[14%]">Rating</th>
              <th className="text-center w-[14%]">Compliance</th>
              <th className="text-center w-[12%]">Selection</th>
              <th className="text-center w-[16%]">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {sortedBids.map((bid, index) => {
              const isLowest = bid.amount === lowestBid;
              const isSelected = selectedIndex === index;
              const isAwarded = awardedIndex === index;
              const isDisabled = awardedIndex !== null && !isAwarded;

              return (
                <>
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 ${
                      isLowest ? "bg-green-100 border-l-4 border-[#16A34A]" : ""
                    } ${isSelected ? "border-l-4 border-[#EA580C]" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {bid.supplier}
                    </td>

                    <td className="text-center text-[#16A34A] font-semibold">
                      LKR {bid.amount.toLocaleString()}
                    </td>

                    <td className="text-center">{bid.eta}</td>

                    <td className="text-center text-[#EA580C]">
                      {renderStars(bid.rating)}
                    </td>

                    <td className="text-center">
                      <span
                        className={`px-3 py-1 rounded-md text-xs ${complianceBadge(
                          bid.compliance
                        )}`}
                      >
                        {bid.compliance}
                      </span>
                    </td>

                    <td className="text-center">
                      {isAwarded ? (
                        <span className="bg-[#1E40AF] text-white px-3 py-1 rounded-md text-xs">
                          Awarded
                        </span>
                      ) : isSelected ? (
                        <span className="bg-orange-100 text-[#EA580C] px-3 py-1 rounded-md text-xs">
                          Selected
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Active
                        </span>
                      )}
                    </td>

                    {/* 🔥 FIXED ACTION COLUMN */}
                    <td className="text-center">
                      <div className="flex justify-center items-center gap-2 whitespace-nowrap">
                        {!isAwarded && (
                          <button
                            disabled={isDisabled}
                            onClick={() => setSelectedIndex(index)}
                            className={`px-3 py-1 rounded-md text-xs ${
                              isDisabled
                                ? "bg-gray-300 text-white"
                                : "bg-[#1E40AF] text-white"
                            }`}
                          >
                            Select
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === index ? null : index
                            )
                          }
                          className="bg-[#1E293B] text-white px-3 py-1 rounded-md text-xs"
                        >
                          Details →
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedRow === index && (
                    <tr>
                      <td colSpan="7" className="p-4 bg-gray-50 text-sm">
                        {bid.description}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Bidding;