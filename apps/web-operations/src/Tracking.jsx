import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Truck,
  CheckCircle,
  Ship,
  PackageOpen,
  CalendarDays,
  RefreshCw,
  MapPin,
} from "lucide-react";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fixes the default Leaflet marker icon issue in React/Vite projects
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

function Tracking() {
  // Search input used when showing all tracking records
  const [search, setSearch] = useState("");

  // Order progress stage states
  const [progressStages, setProgressStages] = useState([]);
  const [stageLoading, setStageLoading] = useState(false);

  // Tracking data states
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Gets the selected order from sessionStorage when user clicks Track from another page
  const trackingOrder = getStoredTrackingOrder();

  // Loads progress stages and tracking records when Tracking page opens
  useEffect(() => {
    fetchOrderProgressStages();
    fetchSelectedOrderTracking();
  }, []);

  // Reads selected tracking order safely from sessionStorage
  function getStoredTrackingOrder() {
    try {
      const stored = sessionStorage.getItem("trackingOrder");
      return stored ? JSON.parse(stored) : null;
    } catch {
      sessionStorage.removeItem("trackingOrder");
      return null;
    }
  }

  // Fetches order progress stages from backend.
  // If backend/database has no stage data, fallback stages are used.
  const fetchOrderProgressStages = async () => {
    try {
      setStageLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/operations/order-progress-stages"
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch progress stages");
      }

      const stages = Array.isArray(result) ? result : [];

      if (stages.length === 0) {
        setProgressStages(getFallbackProgressStages());
      } else {
        setProgressStages(stages);
      }
    } catch (error) {
      console.log("Using fallback order progress stages:", error.message);
      setProgressStages(getFallbackProgressStages());
    } finally {
      setStageLoading(false);
    }
  };

  // Fetches tracking records for the selected order.
  // It supports both database order_id and order_reference.
  const fetchSelectedOrderTracking = async () => {
    try {
      setTrackingLoading(true);
      setTrackingError("");

      const selectedOrderId =
        trackingOrder?.order_id ||
        trackingOrder?.dbId ||
        trackingOrder?.db_id ||
        trackingOrder?.databaseOrderId ||
        "";

      const selectedOrderReference =
        trackingOrder?.order_reference ||
        trackingOrder?.orderReference ||
        trackingOrder?.id ||
        trackingOrder?.orderId ||
        "";

      let url = "http://localhost:5000/api/operations/tracking";

      // If database ID exists, use order_id.
      // Example: order_id = 8
      if (selectedOrderId && !String(selectedOrderId).includes("-")) {
        url = `http://localhost:5000/api/operations/tracking?order_id=${encodeURIComponent(
          selectedOrderId
        )}`;
      }

      // If only order reference exists, use order_reference.
      // Example: order_reference = IMP-00004
      else if (selectedOrderReference) {
        url = `http://localhost:5000/api/operations/tracking?order_reference=${encodeURIComponent(
          selectedOrderReference
        )}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch tracking data");
      }

      setTrackingRecords(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error.message);
      setTrackingError(
        "Tracking data could not be loaded. Please check backend route /api/operations/tracking."
      );
      setTrackingRecords([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Backup progress stages used if database stages are missing or API fails
  const getFallbackProgressStages = () => [
    {
      progress_stage_id: 1,
      stage_key: "created",
      stage_name: "Created",
      sequence_order: 1,
      is_active: true,
    },
    {
      progress_stage_id: 2,
      stage_key: "open_for_bids",
      stage_name: "Open for Bids",
      sequence_order: 2,
      is_active: true,
    },
    {
      progress_stage_id: 3,
      stage_key: "bid_accepted",
      stage_name: "Bid Accepted",
      sequence_order: 3,
      is_active: true,
    },
    {
      progress_stage_id: 4,
      stage_key: "driver_assigned",
      stage_name: "Driver Assigned",
      sequence_order: 4,
      is_active: true,
    },
    {
      progress_stage_id: 5,
      stage_key: "in_transit",
      stage_name: "In Transit",
      sequence_order: 5,
      is_active: true,
    },
    {
      progress_stage_id: 6,
      stage_key: "at_freezone",
      stage_name: "At Freezone",
      sequence_order: 6,
      is_active: true,
    },
    {
      progress_stage_id: 7,
      stage_key: "at_port",
      stage_name: "At Port",
      sequence_order: 7,
      is_active: true,
    },
    {
      progress_stage_id: 8,
      stage_key: "completed",
      stage_name: "Completed",
      sequence_order: 8,
      is_active: true,
    },
  ];

  // Builds selected tracking order details using sessionStorage order and latest tracking record
  const selectedTrackingOrder = useMemo(() => {
    const latestRecord = getLatestTrackingRecord(trackingRecords);

    if (trackingOrder) {
      return normalizeSelectedOrder(trackingOrder, latestRecord);
    }

    if (latestRecord) {
      return normalizeTrackingRecordToOrder(latestRecord);
    }

    return null;
  }, [trackingOrder, trackingRecords]);

  // If one order is selected, only that order is displayed.
  // If no order is selected, all tracking records are shown and searchable.
  const displayOrders = selectedTrackingOrder
    ? [selectedTrackingOrder]
    : trackingRecords
        .map((record) => normalizeTrackingRecordToOrder(record))
        .filter((order) =>
          String(order.orderId).toLowerCase().includes(search.toLowerCase())
        );

  const activeOrder = displayOrders[0];

  // Sorts active progress stages according to sequence_order
  const orderedStages = useMemo(() => {
    return [...progressStages]
      .filter((stage) => stage.is_active !== false)
      .sort(
        (a, b) => Number(a.sequence_order || 0) - Number(b.sequence_order || 0)
      );
  }, [progressStages]);

  // Finds current progress stage index based on active order status
  const activeStageIndex = useMemo(() => {
    if (!activeOrder || orderedStages.length === 0) return 0;

    const activeKey = activeOrder.statusKey || getStatusKey(activeOrder.status);

    const index = orderedStages.findIndex(
      (stage) =>
        String(stage.stage_key).toLowerCase() === String(activeKey).toLowerCase()
    );

    return index >= 0 ? index : 0;
  }, [activeOrder, orderedStages]);

  // Keeps only tracking records with latitude and longitude for map rendering
  const validTrackingRecords = useMemo(() => {
    return trackingRecords
      .filter(
        (record) =>
          record.latitude !== null &&
          record.latitude !== undefined &&
          record.longitude !== null &&
          record.longitude !== undefined
      )
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  }, [trackingRecords]);

  // Converts tracking records into Leaflet map route positions
  const routePositions = useMemo(() => {
    return validTrackingRecords.map((record) => [
      Number(record.latitude),
      Number(record.longitude),
    ]);
  }, [validTrackingRecords]);

  // Centers map on latest tracking location.
  // If no location exists, defaults to Colombo coordinates.
  const mapCenter = useMemo(() => {
    if (routePositions.length > 0) {
      return routePositions[routePositions.length - 1];
    }

    return [6.9271, 79.8612];
  }, [routePositions]);

  // Returns the latest tracking record based on recorded_at date
  function getLatestTrackingRecord(records) {
    if (!records || records.length === 0) return null;

    return [...records].sort(
      (a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)
    )[0];
  }

  // Normalizes selected order data with latest tracking data.
  // Important fix:
  // This prefers backend joined order data first, so Tracking page shows IMP-00004
  // instead of only database ID like 8.
  function normalizeSelectedOrder(order, latestRecord) {
    const orderData = latestRecord?.orders || {};
    const driverData = latestRecord?.drivers || {};

    const orderReference =
      orderData.order_reference ||
      order.order_reference ||
      order.orderReference ||
      order.id ||
      order.orderId ||
      "N/A";

    const databaseOrderId =
      orderData.order_id ||
      latestRecord?.order_id ||
      order.order_id ||
      order.dbId ||
      order.db_id ||
      order.databaseOrderId ||
      null;

    const driverName =
      order.driver ||
      order.driver_name ||
      `${driverData.first_name || ""} ${driverData.last_name || ""}`.trim() ||
      "Not assigned";

    return {
      orderId: orderReference,
      order_id: databaseOrderId,

      type:
        orderData.order_type ||
        order.type ||
        order.order_type ||
        "N/A",

      pickup:
        orderData.pickup_state ||
        orderData.pickup_country ||
        order.pickup ||
        order.pickup_state ||
        "N/A",

      destination:
        orderData.destination_state ||
        orderData.destination_country ||
        order.destination ||
        order.destination_state ||
        "N/A",

      containerNo:
        orderData.container_no ||
        order.containerNo ||
        order.container_no ||
        "N/A",

      vehicleNo:
        order.vehicleNo ||
        order.vehicle_number ||
        orderData.vehicle_number ||
        "N/A",

      supplier:
        order.supplier ||
        order.supplier_name ||
        orderData.supplier_name ||
        "N/A",

      driver: driverName,

      status:
        latestRecord?.status ||
        orderData.current_status ||
        order.status ||
        order.current_status ||
        "created",

      statusKey: getStatusKey(
        latestRecord?.status ||
          orderData.current_status ||
          order.status ||
          order.current_status ||
          "created"
      ),

      expectedDay:
        orderData.expected_arrival ||
        order.expectedDay ||
        order.expected_arrival ||
        "N/A",

      currentLocation:
        latestRecord?.current_location ||
        order.currentLocation ||
        "No tracking location",
    };
  }

  // Converts one tracking record into a display-ready order row.
  // This is used when user opens Tracking page without selecting a specific order.
  function normalizeTrackingRecordToOrder(record) {
    const orderData = record.orders || {};
    const driverData = record.drivers || {};

    const driverName =
      `${driverData.first_name || ""} ${driverData.last_name || ""}`.trim() ||
      "Not assigned";

    return {
      orderId: orderData.order_reference || record.order_id || "N/A",
      order_id: record.order_id || orderData.order_id || null,
      type: orderData.order_type || "N/A",
      pickup: orderData.pickup_state || orderData.pickup_country || "N/A",
      destination:
        orderData.destination_state || orderData.destination_country || "N/A",
      containerNo: orderData.container_no || "N/A",
      vehicleNo: record.vehicle_number || "N/A",
      supplier: orderData.supplier_name || "N/A",
      driver: driverName,
      status: record.status || orderData.current_status || "created",
      statusKey: getStatusKey(record.status || orderData.current_status),
      expectedDay: orderData.expected_arrival || "N/A",
      currentLocation: record.current_location || "N/A",
    };
  }

  // Maps different backend status names into common progress stage keys
  function getStatusKey(status) {
    const normalized = String(status || "")
      .toLowerCase()
      .trim()
      .replaceAll(" ", "_")
      .replaceAll("-", "_");

    const statusMap = {
      created: "created",
      order_created: "created",

      open_for_bids: "open_for_bids",
      bidding_open: "open_for_bids",
      not_started: "created",

      bid_accepted: "bid_accepted",
      supplier_selected: "bid_accepted",
      accepted: "bid_accepted",

      driver_assigned: "driver_assigned",
      vehicle_assigned: "driver_assigned",

      in_transit: "in_transit",
      transit: "in_transit",

      at_freezone: "at_freezone",
      freezone: "at_freezone",
      boi_gate: "at_freezone",
      yard: "at_freezone",

      at_port: "at_port",
      port: "at_port",
      arrived_at_port: "at_port",

      completed: "completed",
      delivered: "completed",
      closed: "completed",
    };

    return statusMap[normalized] || normalized || "created";
  }

  // Shows progress label below each stage
  const mapStageTime = (index) => {
    if (!activeOrder) return "";

    if (index === activeStageIndex) {
      return "Current Stage";
    }

    if (index < activeStageIndex) {
      return "Completed";
    }

    return "";
  };

  // Formats expected date
  const formatDate = (value) => {
    if (!value || value === "N/A") return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Formats full date/time for map popups and shipment history
  const formatDateTime = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Converts status text into readable format
  const prettifyStatus = (status) => {
    if (!status) return "N/A";

    return String(status)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Selects icon for shipment history based on record status
  const getHistoryIcon = (status) => {
    const safeStatus = String(status || "").toLowerCase();

    if (safeStatus.includes("port")) {
      return <Ship size={18} className="text-[#EA580C] mt-1" />;
    }

    if (safeStatus.includes("boi") || safeStatus.includes("freezone")) {
      return <PackageOpen size={18} className="text-[#1E40AF] mt-1" />;
    }

    if (safeStatus.includes("delivered") || safeStatus.includes("completed")) {
      return <CheckCircle size={18} className="text-[#16A34A] mt-1" />;
    }

    return <Truck size={18} className="text-[#16A34A] mt-1" />;
  };

  return (
    <div className="bg-[#EFF6FF] p-6 h-full overflow-auto space-y-6">
      {/* Header shown when user tracks one selected order */}
      {selectedTrackingOrder && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B]">
                Tracking Order - {selectedTrackingOrder.orderId}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                {selectedTrackingOrder.pickup} →{" "}
                {selectedTrackingOrder.destination}
              </p>

              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <MapPin size={14} />
                Current Location:{" "}
                {prettifyStatus(selectedTrackingOrder.currentLocation)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSelectedOrderTracking}
                className="text-sm px-4 py-2 rounded-md border border-slate-300 text-[#1E40AF] hover:bg-[#EFF6FF] flex items-center gap-2"
              >
                <RefreshCw size={15} />
                Refresh
              </button>

              <button
                onClick={() => {
                  sessionStorage.removeItem("trackingOrder");
                  window.location.reload();
                }}
                className="text-sm px-4 py-2 rounded-md border border-slate-300 text-[#1E293B] hover:bg-slate-50"
              >
                Show All Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search bar shown only when no specific order is selected */}
      {!selectedTrackingOrder && (
        <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search by Order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm text-[#1E293B] placeholder:text-slate-400"
          />

          <button
            onClick={fetchSelectedOrderTracking}
            className="text-sm px-4 py-2 rounded-md border border-slate-300 text-[#1E40AF] hover:bg-[#EFF6FF] flex items-center gap-2"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      )}

      {/* Error message if tracking API fails */}
      {trackingError && (
        <div className="bg-orange-50 border border-orange-100 text-[#EA580C] rounded-xl px-4 py-3 text-sm">
          {trackingError}
        </div>
      )}

      {/* Tracking order summary table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#EFF6FF] text-[#1E293B] text-sm font-medium border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 text-left">Order ID</th>
              <th className="px-4 text-left">Type</th>
              <th className="px-4 text-left">Pickup</th>
              <th className="px-4 text-left">Destination</th>
              <th className="px-4 text-left">Container No</th>
              <th className="px-4 text-left">Vehicle No</th>
              <th className="px-4 text-left">Supplier</th>
              <th className="px-4 text-left">Driver</th>
              <th className="px-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {trackingLoading ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-slate-500">
                  Loading tracking data...
                </td>
              </tr>
            ) : displayOrders.length > 0 ? (
              displayOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-[#1E293B]">
                    {order.orderId}
                  </td>

                  <td className="px-4 text-[#1E293B]">{order.type}</td>
                  <td className="px-4 text-[#1E293B]">{order.pickup}</td>
                  <td className="px-4 text-[#1E293B]">{order.destination}</td>
                  <td className="px-4 text-[#1E293B]">{order.containerNo}</td>
                  <td className="px-4 text-[#1E293B]">{order.vehicleNo}</td>
                  <td className="px-4 text-[#1E293B]">{order.supplier}</td>
                  <td className="px-4 text-[#1E293B]">{order.driver}</td>

                  <td className="px-4 text-[#1E293B]">
                    <span className="px-3 py-1 rounded-md text-xs font-medium bg-[#EFF6FF] text-[#1E40AF]">
                      {prettifyStatus(order.status)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-6 text-slate-500">
                  No tracking records found for this order
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order progress timeline */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between mb-6">
          <h3 className="font-semibold text-lg text-[#1E293B]">
            Status{" "}
            <span className="text-[#16A34A] text-sm">
              {stageLoading ? "Loading Stages..." : "Order Progress"}
            </span>
          </h3>

          <span className="text-sm text-slate-500 flex items-center gap-1">
            <CalendarDays size={16} />
            Expected Day: {formatDate(activeOrder?.expectedDay)}
          </span>
        </div>

        <div className="flex items-center justify-between relative overflow-x-auto pb-4">
          {orderedStages.length > 0 ? (
            orderedStages.map((stage, index) => {
              const isCompleted = index <= activeStageIndex;
              const isLineCompleted = index < activeStageIndex;

              return (
                <div
                  key={stage.progress_stage_id || stage.stage_key}
                  className="flex-1 min-w-[145px] text-center relative"
                >
                  {index !== orderedStages.length - 1 && (
                    <div className="absolute top-4 left-1/2 w-full h-1 bg-slate-200 z-0">
                      <div
                        className={`h-1 ${
                          isLineCompleted ? "bg-[#16A34A]" : "bg-slate-200"
                        } w-full`}
                      />
                    </div>
                  )}

                  <div
                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm relative z-10 ${
                      isCompleted
                        ? "bg-[#16A34A] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <p
                    className={`text-sm mt-2 font-medium ${
                      isCompleted ? "text-[#1E293B]" : "text-slate-500"
                    }`}
                  >
                    {stage.stage_name}
                  </p>

                  {mapStageTime(index) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {mapStageTime(index)}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">
              No order progress stages found.
            </p>
          )}
        </div>
      </div>

      {/* Vehicle live/history location map */}
      <div className="bg-white rounded-xl shadow p-4">
        {trackingLoading ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
            Loading vehicle location...
          </div>
        ) : routePositions.length > 0 ? (
          <MapContainer
            key={`${
              selectedTrackingOrder?.order_id || selectedTrackingOrder?.orderId
            }-${routePositions.length}`}
            center={mapCenter}
            zoom={8}
            className="h-72 rounded-lg"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {validTrackingRecords.map((record, index) => (
              <Marker
                key={record.tracking_id || index}
                position={[Number(record.latitude), Number(record.longitude)]}
              >
                <Popup>
                  <div>
                    <p className="font-semibold">
                      {prettifyStatus(record.current_location)}
                    </p>
                    <p>Status: {prettifyStatus(record.status)}</p>
                    <p>Recorded: {formatDateTime(record.recorded_at)}</p>
                    <p>
                      Driver:{" "}
                      {record.drivers
                        ? `${record.drivers.first_name || ""} ${
                            record.drivers.last_name || ""
                          }`
                        : selectedTrackingOrder?.driver || "Not assigned"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {routePositions.length > 1 && (
              <Polyline positions={routePositions} color="#1E40AF" />
            )}
          </MapContainer>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-sm">
            <p>No vehicle tracking location found for this order.</p>
            <p className="text-xs mt-1">
              Add a row in container_tracking table for this order_id.
            </p>
          </div>
        )}
      </div>

      {/* Shipment history list from container_tracking records */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-[#1E293B]">
            Shipment History
          </h3>
        </div>

        <div className="space-y-6 text-sm">
          {trackingRecords.length > 0 ? (
            [...trackingRecords]
              .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
              .map((record) => (
                <div key={record.tracking_id} className="flex items-start gap-4">
                  {getHistoryIcon(record.status)}

                  <div>
                    <p className="font-medium text-[#1E293B]">
                      {prettifyStatus(record.status)}
                    </p>

                    <p className="text-slate-500">
                      {formatDateTime(record.recorded_at)} -{" "}
                      {prettifyStatus(record.current_location)} - Driver:{" "}
                      {record.drivers
                        ? `${record.drivers.first_name || ""} ${
                            record.drivers.last_name || ""
                          }`
                        : selectedTrackingOrder?.driver || "Not assigned"}
                    </p>
                  </div>
                </div>
              ))
          ) : (
            <div className="flex items-start gap-4">
              <CheckCircle size={18} className="text-slate-400 mt-1" />

              <div>
                <p className="font-medium text-[#1E293B]">
                  No Shipment History
                </p>

                <p className="text-slate-500">
                  No container tracking records found for this order.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tracking;