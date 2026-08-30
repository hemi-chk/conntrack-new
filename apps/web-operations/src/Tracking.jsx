import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CalendarDays,
  CheckCircle,
  MapPin,
  PackageOpen,
  RefreshCw,
  Ship,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const LIVE_GPS_REFRESH_MS = 5000;

const OFFICIAL_PROGRESS_STAGES = [
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

const OFFICIAL_STAGE_KEYS = new Set(
  OFFICIAL_PROGRESS_STAGES.map((stage) => stage.stage_key)
);

const SRI_LANKA_LOCATION_COORDINATES = {
  "Colombo Port": [6.9459, 79.8428],
  "Colombo City": [6.9271, 79.8612],
  "Orugodawatta Yard": [6.9474, 79.8798],
  "Ratmalana Industrial Area": [6.8213, 79.8862],
  "Pettah Warehouse": [6.9355, 79.85],
  "Dematagoda Yard": [6.9404, 79.8783],

  "Katunayake Airport": [7.1808, 79.8841],
  "Katunayake Export Zone": [7.1674, 79.8761],
  "Biyagama BOI Zone": [7.084, 80.016],
  "Ekala BOI Zone": [7.105, 79.919],
  "Peliyagoda Warehouse": [6.9608, 79.8788],
  "Wattala Industrial Area": [6.9895, 79.8912],

  "Kalutara Industrial Area": [6.5854, 79.9607],
  Panadura: [6.7132, 79.9026],
  "Horana Industrial Zone": [6.7159, 80.0626],
  Beruwala: [6.4788, 79.9828],

  "Kandy City": [7.2906, 80.6337],
  Peradeniya: [7.2631, 80.5967],
  Katugastota: [7.3267, 80.6217],
  "Pallekele Industrial Zone": [7.2861, 80.7047],

  "Kurunegala Warehouse": [7.4863, 80.3647],
  Kuliyapitiya: [7.4696, 80.0488],
  "Mawathagama Export Zone": [7.4044, 80.4432],
  "Pannala Industrial Area": [7.3285, 80.0255],

  "Galle City": [6.0535, 80.221],
  "Galle Port": [6.0329, 80.2168],
  "Koggala BOI Zone": [5.9941, 80.327],
  Hikkaduwa: [6.1407, 80.1012],

  "Matara City": [5.9549, 80.555],
  Weligama: [5.973, 80.4297],
  Akuressa: [6.0967, 80.4808],
  Dikwella: [5.9667, 80.6833],

  "Hambantota Port": [6.1241, 81.1185],
  "Mattala Airport": [6.2845, 81.1241],
  Tangalle: [6.024, 80.7911],
  Sooriyawewa: [6.3084, 81.0107],

  "Trincomalee Port": [8.5711, 81.2335],
  "China Bay": [8.5385, 81.1814],
  Kinniya: [8.4977, 81.1794],
  Kantale: [8.3653, 80.9669],

  "Jaffna Town": [9.6615, 80.0255],
  "Kankesanthurai Port": [9.8167, 80.05],
  Chavakachcheri: [9.6535, 80.1597],
  "Point Pedro": [9.8167, 80.2333],

  "Anuradhapura Town": [8.3114, 80.4037],
  Medawachchiya: [8.5396, 80.4894],
  Kekirawa: [8.0375, 80.598],
  Mihintale: [8.35, 80.5167],

  "Batticaloa Town": [7.7102, 81.6924],
  Eravur: [7.7782, 81.6038],
  Kattankudy: [7.675, 81.73],
  Valaichchenai: [7.9333, 81.5167],
};

const liveDriverIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:38px;
      height:38px;
      border-radius:50%;
      background:#1E40AF;
      color:white;
      border:3px solid white;
      box-shadow:0 4px 12px rgba(15,23,42,.25);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:20px;
    ">🚚</div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -18],
});

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const number = toFiniteNumber(value);

    if (number !== null) {
      return number;
    }
  }

  return null;
}

function resolveOrderEndpointCoordinates(
  orderData,
  sourceOrder,
  endpoint,
  locationName
) {
  const isPickup = endpoint === "pickup";

  const latitude = firstFiniteNumber(
    isPickup
      ? orderData?.pickup_latitude
      : orderData?.destination_latitude,
    isPickup
      ? orderData?.origin_latitude
      : orderData?.dropoff_latitude,
    isPickup
      ? sourceOrder?.pickup_latitude
      : sourceOrder?.destination_latitude,
    isPickup
      ? sourceOrder?.origin_latitude
      : sourceOrder?.dropoff_latitude,
    isPickup
      ? sourceOrder?.pickup?.latitude
      : sourceOrder?.destination?.latitude,
    isPickup
      ? sourceOrder?.origin?.latitude
      : sourceOrder?.drop?.latitude
  );

  const longitude = firstFiniteNumber(
    isPickup
      ? orderData?.pickup_longitude
      : orderData?.destination_longitude,
    isPickup
      ? orderData?.origin_longitude
      : orderData?.dropoff_longitude,
    isPickup
      ? sourceOrder?.pickup_longitude
      : sourceOrder?.destination_longitude,
    isPickup
      ? sourceOrder?.origin_longitude
      : sourceOrder?.dropoff_longitude,
    isPickup
      ? sourceOrder?.pickup?.longitude
      : sourceOrder?.destination?.longitude,
    isPickup
      ? sourceOrder?.origin?.longitude
      : sourceOrder?.drop?.longitude
  );

  if (latitude !== null && longitude !== null) {
    return [latitude, longitude];
  }

  return SRI_LANKA_LOCATION_COORDINATES[locationName] || null;
}

function formatGpsLocation(record) {
  if (!record) {
    return "No tracking location";
  }

  if (record.current_location) {
    return String(record.current_location);
  }

  const latitude = toFiniteNumber(record.latitude);
  const longitude = toFiniteNumber(record.longitude);

  if (latitude !== null && longitude !== null) {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }

  return "Live GPS";
}

function MapViewportController({
  plannedRoutePositions,
  pickupPosition,
  destinationPosition,
  latestDriverPosition,
}) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...(plannedRoutePositions || []),
      ...(pickupPosition ? [pickupPosition] : []),
      ...(destinationPosition ? [destinationPosition] : []),
      ...(latestDriverPosition ? [latestDriverPosition] : []),
    ].filter(
      (position) =>
        Array.isArray(position) &&
        Number.isFinite(Number(position[0])) &&
        Number.isFinite(Number(position[1]))
    );

    if (points.length > 1) {
      map.fitBounds(points, {
        padding: [35, 35],
        maxZoom: 14,
      });

      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [
    map,
    plannedRoutePositions,
    pickupPosition,
    destinationPosition,
    latestDriverPosition,
  ]);

  return null;
}

function Tracking() {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [progressStages, setProgressStages] = useState(
    OFFICIAL_PROGRESS_STAGES
  );

  const [stageLoading, setStageLoading] = useState(false);

  const [trackingRecords, setTrackingRecords] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const [plannedRoutePositions, setPlannedRoutePositions] =
    useState([]);

  const [routeLoading, setRouteLoading] = useState(false);
  const [lastGpsRefreshAt, setLastGpsRefreshAt] = useState(null);

  const trackingOrder = getStoredTrackingOrder();

  useEffect(() => {
    fetchOrderProgressStages();
    fetchSelectedOrderTracking();
  }, []);

  useEffect(() => {
    if (!trackingOrder) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchSelectedOrderTracking({
        silent: true,
      });
    }, LIVE_GPS_REFRESH_MS);

    return () => clearInterval(interval);
  }, []);

  function getStoredTrackingOrder() {
    try {
      const stored = sessionStorage.getItem("trackingOrder");

      return stored ? JSON.parse(stored) : null;
    } catch {
      sessionStorage.removeItem("trackingOrder");
      return null;
    }
  }

  const parseResponse = async (response, fallback = []) => {
    const text = await response.text();

    if (!text) {
      return fallback;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Tracking API returned an invalid response. Status: ${response.status}`
      );
    }
  };

  const fetchOrderProgressStages = async () => {
    try {
      setStageLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/operations/order-progress-stages`
      );

      const result = await parseResponse(response, []);

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to fetch progress stages"
        );
      }

      const backendStages = Array.isArray(result) ? result : [];

      const officialBackendStages = backendStages
        .filter(
          (stage) =>
            stage?.is_active !== false &&
            OFFICIAL_STAGE_KEYS.has(
              String(stage?.stage_key || "")
                .trim()
                .toLowerCase()
            )
        )
        .sort(
          (a, b) =>
            Number(a.sequence_order || 0) -
            Number(b.sequence_order || 0)
        );

      if (officialBackendStages.length === OFFICIAL_PROGRESS_STAGES.length) {
        setProgressStages(officialBackendStages);
      } else {
        setProgressStages(OFFICIAL_PROGRESS_STAGES);
      }
    } catch (error) {
      console.log(
        "Using official fallback order progress stages:",
        error.message
      );

      setProgressStages(OFFICIAL_PROGRESS_STAGES);
    } finally {
      setStageLoading(false);
    }
  };

  const fetchSelectedOrderTracking = async (options = {}) => {
    const silent = options?.silent === true;

    try {
      if (!silent) {
        setTrackingLoading(true);
      }

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
        "";

      if (!selectedOrderId && !selectedOrderReference) {
        if (!silent) {
          setTrackingRecords([]);
        }

        setTrackingError("");
        return;
      }

      let url = "";

      if (
        selectedOrderId &&
        !String(selectedOrderId).includes("-")
      ) {
        url =
          `${API_BASE_URL}/api/operations/tracking?order_id=` +
          encodeURIComponent(selectedOrderId);
      } else {
        url =
          `${API_BASE_URL}/api/operations/tracking?order_reference=` +
          encodeURIComponent(selectedOrderReference);
      }

      const response = await fetch(url);
      const result = await parseResponse(response, []);

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to fetch tracking data"
        );
      }

      const rows = Array.isArray(result) ? result : [];

      setTrackingRecords(rows);
      setTrackingError("");
      setLastGpsRefreshAt(new Date());
    } catch (error) {
      console.error(
        "Operations tracking fetch error:",
        error.message
      );

      setTrackingError(
        "Tracking data could not be refreshed. Showing the last available tracking data."
      );

      // Keep the previous good GPS data during silent polling failures.
      if (!silent) {
        setTrackingRecords([]);
      }
    } finally {
      if (!silent) {
        setTrackingLoading(false);
      }
    }
  };

  const selectedTrackingOrder = useMemo(() => {
    const latestRecord =
      getLatestTrackingRecord(trackingRecords);

    if (trackingOrder) {
      return normalizeSelectedOrder(
        trackingOrder,
        latestRecord
      );
    }

    return null;
  }, [trackingOrder, trackingRecords]);

  const displayOrders = selectedTrackingOrder
    ? [selectedTrackingOrder]
    : [];

  const activeOrder = displayOrders[0] || null;

  const orderedStages = useMemo(() => {
    return [...progressStages]
      .filter(
        (stage) =>
          stage.is_active !== false &&
          OFFICIAL_STAGE_KEYS.has(
            String(stage.stage_key || "")
              .trim()
              .toLowerCase()
          )
      )
      .sort(
        (a, b) =>
          Number(a.sequence_order || 0) -
          Number(b.sequence_order || 0)
      );
  }, [progressStages]);

  const activeStageIndex = useMemo(() => {
    if (!activeOrder || orderedStages.length === 0) {
      return -1;
    }

    const activeKey =
      activeOrder.statusKey ||
      getStatusKey(activeOrder.status);

    if (activeKey === "archived") {
      return orderedStages.findIndex(
        (stage) =>
          String(stage.stage_key).toLowerCase() === "completed"
      );
    }

    const index = orderedStages.findIndex(
      (stage) =>
        String(stage.stage_key).toLowerCase() ===
        String(activeKey).toLowerCase()
    );

    return index;
  }, [activeOrder, orderedStages]);

  const validTrackingRecords = useMemo(() => {
    return trackingRecords
      .filter(
        (record) =>
          Number.isFinite(Number(record.latitude)) &&
          Number.isFinite(Number(record.longitude))
      )
      .sort(
        (a, b) =>
          new Date(a.recorded_at) -
          new Date(b.recorded_at)
      );
  }, [trackingRecords]);

  const latestGpsRecord = useMemo(() => {
    if (validTrackingRecords.length === 0) {
      return null;
    }

    return validTrackingRecords[
      validTrackingRecords.length - 1
    ];
  }, [validTrackingRecords]);

  const latestDriverPosition = useMemo(() => {
    if (!latestGpsRecord) {
      return null;
    }

    return [
      Number(latestGpsRecord.latitude),
      Number(latestGpsRecord.longitude),
    ];
  }, [latestGpsRecord]);

  const pickupPosition =
    selectedTrackingOrder?.pickupCoordinates || null;

  const destinationPosition =
    selectedTrackingOrder?.destinationCoordinates || null;

  useEffect(() => {
    let cancelled = false;

    const fetchPlannedRoute = async () => {
      if (!pickupPosition || !destinationPosition) {
        setPlannedRoutePositions([]);
        return;
      }

      const [pickupLat, pickupLng] = pickupPosition;
      const [destinationLat, destinationLng] =
        destinationPosition;

      try {
        setRouteLoading(true);

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${pickupLng},${pickupLat};${destinationLng},${destinationLat}` +
          `?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("OSRM route request failed");
        }

        const result = await response.json();

        const coordinates =
          result?.routes?.[0]?.geometry?.coordinates || [];

        if (cancelled) {
          return;
        }

        if (
          result?.code === "Ok" &&
          coordinates.length > 0
        ) {
          setPlannedRoutePositions(
            coordinates.map(
              ([longitude, latitude]) => [
                Number(latitude),
                Number(longitude),
              ]
            )
          );
        } else {
          setPlannedRoutePositions([
            pickupPosition,
            destinationPosition,
          ]);
        }
      } catch (error) {
        console.warn(
          "Operations Tracking: road route fetch failed, using straight-line fallback:",
          error.message
        );

        if (!cancelled) {
          setPlannedRoutePositions([
            pickupPosition,
            destinationPosition,
          ]);
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    fetchPlannedRoute();

    return () => {
      cancelled = true;
    };
  }, [
    pickupPosition?.[0],
    pickupPosition?.[1],
    destinationPosition?.[0],
    destinationPosition?.[1],
  ]);

  const mapCenter = useMemo(() => {
    if (latestDriverPosition) {
      return latestDriverPosition;
    }

    if (pickupPosition) {
      return pickupPosition;
    }

    if (destinationPosition) {
      return destinationPosition;
    }

    return [6.9271, 79.8612];
  }, [
    latestDriverPosition,
    pickupPosition,
    destinationPosition,
  ]);

  function getLatestTrackingRecord(records) {
    if (!records || records.length === 0) {
      return null;
    }

    return [...records].sort(
      (a, b) =>
        new Date(b.recorded_at) -
        new Date(a.recorded_at)
    )[0];
  }

  function normalizeSelectedOrder(order, latestRecord) {
    const orderData = latestRecord?.orders || {};
    const driverData = latestRecord?.drivers || {};

    const orderReference =
      orderData.order_reference ||
      order.order_reference ||
      order.orderReference ||
      order.id ||
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
      `${driverData.first_name || ""} ${
        driverData.last_name || ""
      }`.trim() ||
      "Not assigned";

    const pickupDistrict =
      orderData.pickup_district ||
      order.pickupDistrict ||
      order.pickup_district ||
      order.pickup_country ||
      "N/A";

    const pickupLocation =
      orderData.pickup_location ||
      order.pickupLocation ||
      order.pickup_location ||
      order.pickup_state ||
      order.pickup ||
      "N/A";

    const destinationDistrict =
      orderData.destination_district ||
      order.destinationDistrict ||
      order.destination_district ||
      order.destination_country ||
      "N/A";

    const destinationLocation =
      orderData.destination_location ||
      order.destinationLocation ||
      order.destination_location ||
      order.destination_state ||
      order.destination ||
      "N/A";

    // IMPORTANT:
    // Official Operations progress comes ONLY from orders.current_status
    // or the selected order object. GPS statuses are used only for
    // live-location/history display.
    const officialOrderStatus =
      orderData.current_status ||
      order.current_status ||
      order.status ||
      "created";

    return {
      orderId: orderReference,
      order_id: databaseOrderId,

      type:
        orderData.order_type ||
        order.type ||
        order.order_type ||
        "N/A",

      pickupDistrict,
      pickupLocation,
      destinationDistrict,
      destinationLocation,

      pickup: pickupLocation,
      destination: destinationLocation,

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

      status: officialOrderStatus,
      statusKey:
        getStatusKey(officialOrderStatus),

      expectedDay:
        orderData.expected_arrival ||
        order.expectedDay ||
        order.expected_arrival ||
        "N/A",

      currentLocation:
        latestRecord
          ? formatGpsLocation(latestRecord)
          : order.currentLocation ||
            "No tracking location",

      pickupCoordinates:
        resolveOrderEndpointCoordinates(
          orderData,
          order,
          "pickup",
          pickupLocation
        ),

      destinationCoordinates:
        resolveOrderEndpointCoordinates(
          orderData,
          order,
          "destination",
          destinationLocation
        ),
    };
  }

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

      bid_accepted: "bid_accepted",
      supplier_selected: "bid_accepted",
      accepted: "bid_accepted",

      driver_assigned: "driver_assigned",

      in_transit: "in_transit",

      at_freezone: "at_freezone",
      freezone: "at_freezone",

      at_port: "at_port",
      port: "at_port",

      completed: "completed",

      archived: "archived",
      cancelled: "cancelled",
    };

    return statusMap[normalized] || normalized || "created";
  }

  const mapStageTime = (index) => {
    if (!activeOrder || activeStageIndex < 0) {
      return "";
    }

    if (index === activeStageIndex) {
      return "Current Stage";
    }

    if (index < activeStageIndex) {
      return "Completed";
    }

    return "";
  };

  const formatDate = (value) => {
    if (!value || value === "N/A") {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const prettifyStatus = (status) => {
    if (!status) {
      return "N/A";
    }

    return String(status)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getHistoryIcon = (status) => {
    const safeStatus = String(status || "").toLowerCase();

    if (safeStatus.includes("port")) {
      return (
        <Ship
          size={18}
          className="text-[#EA580C] mt-1"
        />
      );
    }

    if (
      safeStatus.includes("boi") ||
      safeStatus.includes("freezone")
    ) {
      return (
        <PackageOpen
          size={18}
          className="text-[#052659] mt-1"
        />
      );
    }

    if (
      safeStatus.includes("delivered") ||
      safeStatus.includes("completed")
    ) {
      return (
        <CheckCircle
          size={18}
          className="text-[#16A34A] mt-1"
        />
      );
    }

    return (
      <Truck
        size={18}
        className="text-[#16A34A] mt-1"
      />
    );
  };

  return (
    <div className="bg-[#EBF4FF] p-6 h-full overflow-auto space-y-6">
      {selectedTrackingOrder && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B]">
                Tracking Order -{" "}
                {selectedTrackingOrder.orderId}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                {selectedTrackingOrder.pickupLocation} →{" "}
                {selectedTrackingOrder.destinationLocation}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Pickup District:{" "}
                {selectedTrackingOrder.pickupDistrict} |{" "}
                Destination District:{" "}
                {selectedTrackingOrder.destinationDistrict}
              </p>

              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <MapPin size={14} />
                Current Location:{" "}
                {selectedTrackingOrder.currentLocation}
              </p>

              {lastGpsRefreshAt && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Last refreshed:{" "}
                  {lastGpsRefreshAt.toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  fetchSelectedOrderTracking()
                }
                className="text-sm px-4 py-2 rounded-md border border-slate-300 text-[#1E40AF] hover:bg-[#EFF6FF] flex items-center gap-2"
              >
                <RefreshCw size={15} />
                Refresh
              </button>

              <button
                onClick={() => {
                  sessionStorage.removeItem(
                    "trackingOrder"
                  );

                  window.location.reload();
                }}
                className="text-sm px-4 py-2 rounded-md border border-slate-300 text-[#1E293B] hover:bg-slate-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedTrackingOrder && (
        <div className="bg-white p-5 rounded-xl shadow text-sm text-slate-500">
          Select an order from the Orders page and click{" "}
          <span className="font-semibold text-[#1E40AF]">
            Track Order
          </span>{" "}
          to view its route and live driver GPS.
        </div>
      )}

      {trackingError && (
        <div className="bg-orange-50 border border-orange-100 text-[#EA580C] rounded-xl px-4 py-3 text-sm">
          {trackingError}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#EFF6FF] text-[#1E293B] text-sm font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-left whitespace-nowrap">
                  Order ID
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Type
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Pickup District
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Pickup Location
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Destination District
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Destination Location
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Container No
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Vehicle No
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Supplier
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Driver
                </th>
                <th className="px-4 text-left whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {trackingLoading ? (
                <tr>
                  <td
                    colSpan="11"
                    className="text-center py-6 text-slate-500"
                  >
                    Loading tracking data...
                  </td>
                </tr>
              ) : displayOrders.length > 0 ? (
                displayOrders.map((order) => (
                  <tr
                    key={order.orderId}
                    className="hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium text-[#1E293B] whitespace-nowrap">
                      {order.orderId}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.type}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.pickupDistrict}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.pickupLocation}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.destinationDistrict}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.destinationLocation}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.containerNo}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.vehicleNo}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.supplier}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      {order.driver}
                    </td>

                    <td className="px-4 text-[#1E293B] whitespace-nowrap">
                      <span className="px-3 py-1 rounded-md text-xs font-medium bg-[#EFF6FF] text-[#1E40AF]">
                        {prettifyStatus(order.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="11"
                    className="text-center py-6 text-slate-500"
                  >
                    Select an order from Orders page to
                    track the driver.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between mb-6">
          <h3 className="font-semibold text-lg text-[#1E293B]">
            Status{" "}
            <span className="text-[#1E40AF] text-sm">
              {stageLoading
                ? "Loading Stages..."
                : "Order Progress"}
            </span>
          </h3>

          <span className="text-sm text-slate-500 flex items-center gap-1">
            <CalendarDays size={16} />
            Expected Day:{" "}
            {formatDate(activeOrder?.expectedDay)}
          </span>
        </div>

        <div className="flex items-center justify-between relative overflow-x-auto pb-4">
          {orderedStages.map((stage, index) => {
            const isCompleted =
              activeStageIndex >= 0 &&
              index <= activeStageIndex;

            const isLineCompleted =
              activeStageIndex >= 0 &&
              index < activeStageIndex;

            return (
              <div
                key={
                  stage.progress_stage_id ||
                  stage.stage_key
                }
                className="flex-1 min-w-[145px] text-center relative"
              >
                {index !==
                  orderedStages.length - 1 && (
                  <div className="absolute top-4 left-1/2 w-full h-1 bg-slate-200 z-0">
                    <div
                      className={`h-1 ${
                        isLineCompleted
                          ? "bg-[#1E40AF]"
                          : "bg-slate-200"
                      } w-full`}
                    />
                  </div>
                )}

                <div
                  className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm relative z-10 ${
                    isCompleted
                      ? "bg-[#1E40AF] text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {index + 1}
                </div>

                <p
                  className={`text-sm mt-2 font-medium ${
                    isCompleted
                      ? "text-[#1E293B]"
                      : "text-slate-500"
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
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        {trackingLoading ? (
          <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
            Loading vehicle location...
          </div>
        ) : selectedTrackingOrder ? (
          <div className="relative">
            <MapContainer
              center={mapCenter}
              zoom={8}
              className="h-72 rounded-lg"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapViewportController
                plannedRoutePositions={
                  plannedRoutePositions
                }
                pickupPosition={pickupPosition}
                destinationPosition={
                  destinationPosition
                }
                latestDriverPosition={
                  latestDriverPosition
                }
              />

              {pickupPosition && (
                <Marker position={pickupPosition}>
                  <Popup>
                    <div>
                      <p className="font-semibold">
                        Pickup
                      </p>
                      <p>
                        {
                          selectedTrackingOrder.pickupLocation
                        }
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {destinationPosition && (
                <Marker position={destinationPosition}>
                  <Popup>
                    <div>
                      <p className="font-semibold">
                        Destination
                      </p>
                      <p>
                        {
                          selectedTrackingOrder.destinationLocation
                        }
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {plannedRoutePositions.length > 1 && (
                <Polyline
                  positions={plannedRoutePositions}
                  pathOptions={{
                    color: "#93C5FD",
                    weight: 6,
                    opacity: 0.9,
                  }}
                />
              )}

              {latestDriverPosition && (
                <Marker
                  position={latestDriverPosition}
                  icon={liveDriverIcon}
                >
                  <Popup>
                    <div>
                      <p className="font-semibold">
                        Live Driver Location
                      </p>

                      <p>
                        {formatGpsLocation(
                          latestGpsRecord
                        )}
                      </p>

                      <p>
                        GPS Status:{" "}
                        {prettifyStatus(
                          latestGpsRecord?.status
                        )}
                      </p>

                      <p>
                        Recorded:{" "}
                        {formatDateTime(
                          latestGpsRecord?.recorded_at
                        )}
                      </p>

                      <p>
                        Driver:{" "}
                        {latestGpsRecord?.drivers
                          ? `${
                              latestGpsRecord.drivers
                                .first_name || ""
                            } ${
                              latestGpsRecord.drivers
                                .last_name || ""
                            }`.trim()
                          : selectedTrackingOrder.driver ||
                            "Not assigned"}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {routeLoading && (
              <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-md bg-white/95 px-3 py-2 text-xs font-medium text-[#1E40AF] shadow">
                Loading road route...
              </div>
            )}

            {!latestDriverPosition && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-md bg-white/95 px-3 py-2 text-xs text-slate-600 shadow">
                Waiting for live GPS from the assigned
                driver
              </div>
            )}
          </div>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-sm">
            <p>Select an order to track.</p>
            <p className="text-xs mt-1">
              Open Orders and click Track Order on the
              required order.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-lg font-semibold text-[#1E293B]">
            Shipment History
          </h3>
        </div>

        <div className="space-y-6 text-sm">
          {trackingRecords.length > 0 ? (
            [...trackingRecords]
              .sort(
                (a, b) =>
                  new Date(b.recorded_at) -
                  new Date(a.recorded_at)
              )
              .map((record) => (
                <div
                  key={record.tracking_id}
                  className="flex items-start gap-4"
                >
                  {getHistoryIcon(record.status)}

                  <div>
                    <p className="font-medium text-[#1E293B]">
                      {prettifyStatus(record.status)}
                    </p>

                    <p className="text-slate-500">
                      {formatDateTime(
                        record.recorded_at
                      )}{" "}
                      -{" "}
                      {record.current_location ||
                        formatGpsLocation(record)}{" "}
                      - Driver:{" "}
                      {record.drivers
                        ? `${
                            record.drivers
                              .first_name || ""
                          } ${
                            record.drivers
                              .last_name || ""
                          }`.trim()
                        : selectedTrackingOrder?.driver ||
                          "Not assigned"}
                    </p>
                  </div>
                </div>
              ))
          ) : (
            <div className="flex items-start gap-4">
              <CheckCircle
                size={18}
                className="text-slate-400 mt-1"
              />

              <div>
                <p className="font-medium text-[#1E293B]">
                  No Shipment History
                </p>

                <p className="text-slate-500">
                  No container tracking records found for
                  this order.
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
