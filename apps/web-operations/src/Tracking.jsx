import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  PackageOpen,
  RefreshCw,
  Search,
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
const TRACKING_ORDERS_PER_PAGE = 6;

const TRACKABLE_STATUS_KEYS = new Set([
  "driver_assigned",
  "in_transit",
  "at_freezone",
  "at_port",
  "completed",
]);

const TRACKING_STATUS_OPTIONS = [
  "All",
  "Driver Assigned",
  "In Transit",
  "At Freezone",
  "At Port",
  "Completed",
];

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

  // Tracking order list + filters.
  // The list is loaded once from the Operations backend, while the selected
  // order continues to use the focused tracking endpoint for its live GPS.
  const [trackingOrders, setTrackingOrders] = useState([]);
  const [allTrackingRecords, setAllTrackingRecords] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [gpsFilter, setGpsFilter] = useState("All");

  const [showTrackableOrders, setShowTrackableOrders] = useState(true);
  const [showTrackingDetails, setShowTrackingDetails] = useState(() =>
    Boolean(getStoredTrackingOrder())
  );
  const [showOrderDetails, setShowOrderDetails] = useState(true);
  const [showOrderProgress, setShowOrderProgress] = useState(true);
  const [showRouteMap, setShowRouteMap] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [trackingOrder, setTrackingOrder] = useState(() =>
    getStoredTrackingOrder()
  );

  useEffect(() => {
    fetchOrderProgressStages();
    fetchTrackingOrders();

    const storedOrder = getStoredTrackingOrder();

    if (storedOrder) {
      setTrackingOrder(storedOrder);
      setShowTrackingDetails(true);
      fetchSelectedOrderTracking({
        order: storedOrder,
      });
    }
  }, []);

  useEffect(() => {
    if (!trackingOrder) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchSelectedOrderTracking({
        silent: true,
        order: trackingOrder,
      });
    }, LIVE_GPS_REFRESH_MS);

    return () => clearInterval(interval);
  }, [
    trackingOrder?.order_id,
    trackingOrder?.dbId,
    trackingOrder?.databaseOrderId,
    trackingOrder?.order_reference,
    trackingOrder?.orderReference,
    trackingOrder?.id,
  ]);

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

  const fetchTrackingOrders = async () => {
    try {
      setOrdersLoading(true);

      const [ordersResponse, trackingResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/operations/orders`),
        fetch(`${API_BASE_URL}/api/operations/tracking`),
      ]);

      const ordersResult = await parseResponse(ordersResponse, []);
      const trackingResult = await parseResponse(trackingResponse, []);

      if (!ordersResponse.ok) {
        throw new Error(
          ordersResult?.error || "Failed to fetch tracking orders"
        );
      }

      if (!trackingResponse.ok) {
        throw new Error(
          trackingResult?.error || "Failed to fetch tracking overview"
        );
      }

      setTrackingOrders(
        Array.isArray(ordersResult) ? ordersResult : []
      );

      setAllTrackingRecords(
        Array.isArray(trackingResult) ? trackingResult : []
      );
    } catch (error) {
      console.error(
        "Operations tracking order list error:",
        error.message
      );

      setTrackingOrders([]);
      setAllTrackingRecords([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchSelectedOrderTracking = async (options = {}) => {
    const silent = options?.silent === true;
    const sourceOrder = options?.order || trackingOrder;

    try {
      if (!silent) {
        setTrackingLoading(true);
      }

      const selectedOrderId =
        sourceOrder?.order_id ||
        sourceOrder?.dbId ||
        sourceOrder?.db_id ||
        sourceOrder?.databaseOrderId ||
        "";

      const selectedOrderReference =
        sourceOrder?.order_reference ||
        sourceOrder?.orderReference ||
        sourceOrder?.id ||
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

  const selectTrackingOrder = async (order) => {
    if (!order) {
      return;
    }

    const payload = {
      ...order,
      id:
        order.order_reference ||
        order.orderReference ||
        order.orderId ||
        order.id,
      order_reference:
        order.order_reference ||
        order.orderReference ||
        order.orderId ||
        order.id,
      orderReference:
        order.order_reference ||
        order.orderReference ||
        order.orderId ||
        order.id,
      order_id:
        order.order_id ||
        order.dbId ||
        order.databaseOrderId ||
        null,
      dbId:
        order.order_id ||
        order.dbId ||
        order.databaseOrderId ||
        null,
      databaseOrderId:
        order.order_id ||
        order.dbId ||
        order.databaseOrderId ||
        null,
    };

    setTrackingOrder(payload);
    setShowTrackingDetails(true);

    sessionStorage.setItem(
      "trackingOrder",
      JSON.stringify(payload)
    );

    setTrackingRecords([]);
    setTrackingError("");
    setLastGpsRefreshAt(null);

    await fetchSelectedOrderTracking({
      order: payload,
    });
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

  const latestTrackingByOrder = useMemo(() => {
    const map = new Map();

    allTrackingRecords.forEach((record) => {
      const orderId =
        record?.order_id ||
        record?.orders?.order_id ||
        null;

      const orderReference =
        record?.orders?.order_reference ||
        record?.order_reference ||
        "";

      const keys = [];

      if (orderId !== null && orderId !== undefined) {
        keys.push(`id:${orderId}`);
      }

      if (orderReference) {
        keys.push(
          `ref:${String(orderReference).trim().toLowerCase()}`
        );
      }

      keys.forEach((key) => {
        const existing = map.get(key);

        if (
          !existing ||
          new Date(record.recorded_at || 0).getTime() >
            new Date(existing.recorded_at || 0).getTime()
        ) {
          map.set(key, record);
        }
      });
    });

    return map;
  }, [allTrackingRecords]);

  const normalizedTrackingOrders = useMemo(() => {
    return trackingOrders
      .filter((order) =>
        TRACKABLE_STATUS_KEYS.has(
          getStatusKey(
            order.current_status ||
              order.status
          )
        )
      )
      .map((order) => {
        const databaseOrderId =
          order.order_id ||
          order.dbId ||
          order.databaseOrderId ||
          null;

        const reference =
          order.order_reference ||
          order.orderReference ||
          order.id ||
          "";

        const latestRecord =
          (databaseOrderId !== null &&
          databaseOrderId !== undefined
            ? latestTrackingByOrder.get(
                `id:${databaseOrderId}`
              )
            : null) ||
          (reference
            ? latestTrackingByOrder.get(
                `ref:${String(reference)
                  .trim()
                  .toLowerCase()}`
              )
            : null) ||
          null;

        return {
          ...normalizeSelectedOrder(order, latestRecord),
          sourceOrder: order,
          hasGps: Boolean(
            latestRecord &&
              Number.isFinite(Number(latestRecord.latitude)) &&
              Number.isFinite(Number(latestRecord.longitude))
          ),
        };
      });
  }, [
    trackingOrders,
    latestTrackingByOrder,
  ]);

  const filteredTrackingOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return normalizedTrackingOrders.filter((order) => {
      const prettyStatus = String(order.status || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      const matchesStatus =
        statusFilter === "All" ||
        prettyStatus === statusFilter;

      const matchesType =
        typeFilter === "All" ||
        String(order.type || "")
          .trim()
          .toLowerCase() ===
          typeFilter.toLowerCase();

      const matchesGps =
        gpsFilter === "All" ||
        (gpsFilter === "GPS Available" && order.hasGps) ||
        (gpsFilter === "No GPS" && !order.hasGps);

      const searchableText = [
        order.orderId,
        order.type,
        order.pickupDistrict,
        order.pickupLocation,
        order.destinationDistrict,
        order.destinationLocation,
        order.containerNo,
        order.vehicleNo,
        order.supplier,
        order.driver,
        prettyStatus,
        order.currentLocation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return (
        matchesStatus &&
        matchesType &&
        matchesGps &&
        matchesSearch
      );
    });
  }, [
    normalizedTrackingOrders,
    searchTerm,
    statusFilter,
    typeFilter,
    gpsFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTrackingOrders.length /
        TRACKING_ORDERS_PER_PAGE
    )
  );

  const activePage = Math.min(
    currentPage,
    totalPages
  );

  const firstOrderIndex =
    (activePage - 1) *
    TRACKING_ORDERS_PER_PAGE;

  const lastOrderIndex =
    firstOrderIndex +
    TRACKING_ORDERS_PER_PAGE;

  const displayOrders =
    filteredTrackingOrders.slice(
      firstOrderIndex,
      lastOrderIndex
    );

  const showingFrom =
    filteredTrackingOrders.length === 0
      ? 0
      : firstOrderIndex + 1;

  const showingTo = Math.min(
    lastOrderIndex,
    filteredTrackingOrders.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    typeFilter,
    gpsFilter,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const activeOrder =
    selectedTrackingOrder || null;

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

      cargoType:
        orderData.cargo_type ||
        order.cargoType ||
        order.cargo_type ||
        "N/A",

      cargoWeight:
        orderData.cargo_weight ??
        order.cargoWeight ??
        order.cargo_weight ??
        "N/A",

      vehicleType:
        orderData.vehicle_type ||
        order.vehicleType ||
        order.vehicle_type ||
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

      status: officialOrderStatus,
      statusKey:
        getStatusKey(officialOrderStatus),

      pickupDate:
        orderData.pickup_date ||
        order.pickupDate ||
        order.pickup_date ||
        "N/A",

      expectedDay:
        orderData.expected_arrival ||
        order.expectedDay ||
        order.expected_arrival ||
        "N/A",

      specialInstructions:
        orderData.special_instructions ||
        order.specialInstructions ||
        order.special_instructions ||
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
    <div className="min-h-full bg-[#EBF4FF] p-5 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() =>
              setShowTrackableOrders((prev) => !prev)
            }
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#F8FBFF]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EBF4FF] text-[#052659]">
                <Truck size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-[#1E293B]">
                    Trackable Orders
                  </h2>

                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#052659] px-2 text-xs font-semibold text-white">
                    {normalizedTrackingOrders.length}
                  </span>
                </div>

              </div>
            </div>

            <ChevronDown
              size={20}
              className={`shrink-0 text-[#052659] transition-transform duration-300 ${
                showTrackableOrders
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {showTrackableOrders && (
            <div className="border-t border-slate-100">
              <div className="border-b border-slate-100 bg-white px-4 py-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative min-w-0 flex-1 xl:max-w-2xl">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search by order ID, district, location, driver or supplier..."
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] py-2.5 pl-10 pr-4 text-sm text-[#1E293B] outline-none transition focus:border-[#5483B3] focus:ring-2 focus:ring-[#EBF4FF]"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1E293B] outline-none focus:border-[#052659] focus:ring-2 focus:ring-[#EBF4FF]"
                  >
                    <option value="All">
                      All Statuses
                    </option>

                    {TRACKING_STATUS_OPTIONS
                      .filter(
                        (status) =>
                          status !== "All"
                      )
                      .map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1E293B] outline-none focus:border-[#052659] focus:ring-2 focus:ring-[#EBF4FF]"
                  >
                    <option value="All">
                      All Types
                    </option>
                    <option value="Import">
                      Import
                    </option>
                    <option value="Export">
                      Export
                    </option>
                  </select>

                  <select
                    value={gpsFilter}
                    onChange={(event) =>
                      setGpsFilter(
                        event.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1E293B] outline-none focus:border-[#052659] focus:ring-2 focus:ring-[#EBF4FF]"
                  >
                    <option value="All">
                      All GPS States
                    </option>
                    <option value="GPS Available">
                      GPS Available
                    </option>
                    <option value="No GPS">
                      No GPS
                    </option>
                  </select>
                </div>

              </div>

              {trackingError && (
                <div className="mx-4 mt-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-[#EA580C]">
                  {trackingError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-[#EFF6FF] text-[#1E293B]">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        Order ID
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        Type
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        Pickup
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        Destination
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        Supplier
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        Driver
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        GPS
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {ordersLoading ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="py-8 text-center text-slate-500"
                        >
                          Loading trackable orders...
                        </td>
                      </tr>
                    ) : displayOrders.length > 0 ? (
                      displayOrders.map(
                        (order) => {
                          const selected =
                            selectedTrackingOrder &&
                            String(
                              selectedTrackingOrder.orderId
                            ) ===
                              String(
                                order.orderId
                              );

                          return (
                            <tr
                              key={order.orderId}
                              className={
                                selected
                                  ? "bg-[#EFF6FF]"
                                  : "bg-white hover:bg-slate-50"
                              }
                            >
                              <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#052659]">
                                {order.orderId}
                              </td>

                              <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                                {order.type}
                              </td>

                              <td className="px-4 py-4">
                                <p className="font-medium text-[#1E293B]">
                                  {order.pickupLocation}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {order.pickupDistrict}
                                </p>
                              </td>

                              <td className="px-4 py-4">
                                <p className="font-medium text-[#1E293B]">
                                  {order.destinationLocation}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {order.destinationDistrict}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                                {order.supplier}
                              </td>

                              <td className="whitespace-nowrap px-4 py-4 text-[#1E293B]">
                                {order.driver}
                              </td>

                              <td className="whitespace-nowrap px-4 py-4">
                                <span className="inline-flex rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#1E40AF]">
                                  {prettifyStatus(
                                    order.status
                                  )}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-4 py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                    order.hasGps
                                      ? "bg-green-100 text-[#16A34A]"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {order.hasGps
                                    ? "GPS Available"
                                    : "No GPS"}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-4 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    selectTrackingOrder(
                                      order.sourceOrder ||
                                        order
                                    )
                                  }
                                  className="rounded-lg bg-[#052659] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5483B3]"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="py-8 text-center text-slate-500"
                        >
                          No trackable orders match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!ordersLoading &&
                filteredTrackingOrders.length >
                  0 && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Showing {showingFrom}–
                      {showingTo} of{" "}
                      {
                        filteredTrackingOrders.length
                      }{" "}
                      {filteredTrackingOrders.length ===
                      1
                        ? "order"
                        : "orders"}
                    </p>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (page) =>
                              Math.max(
                                1,
                                page - 1
                              )
                          )
                        }
                        disabled={
                          activePage === 1
                        }
                        aria-label="Previous page"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1E293B] transition hover:border-[#052659] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft
                          size={18}
                        />
                      </button>

                      <div className="min-w-[96px] text-center text-sm font-medium text-[#1E293B]">
                        Page {activePage} of{" "}
                        {totalPages}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            (page) =>
                              Math.min(
                                totalPages,
                                page + 1
                              )
                          )
                        }
                        disabled={
                          activePage ===
                          totalPages
                        }
                        aria-label="Next page"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1E293B] transition hover:border-[#052659] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight
                          size={18}
                        />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

      </div>

      {showTrackingDetails &&
        selectedTrackingOrder && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-black/45 p-4 md:p-6"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowTrackingDetails(
                  false
                );
              }
            }}
          >
            <div
              className="my-4 flex max-h-[92vh] w-[96vw] max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-[#EBF4FF] shadow-2xl"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-[#1E293B]">
                    Tracking Order -{" "}
                    {
                      selectedTrackingOrder.orderId
                    }
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedTrackingOrder.pickupLocation
                    }{" "}
                    →{" "}
                    {
                      selectedTrackingOrder.destinationLocation
                    }
                  </p>

                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={14} />
                    Current Location:{" "}
                    {
                      selectedTrackingOrder.currentLocation
                    }
                  </p>

                  {lastGpsRefreshAt && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Last refreshed:{" "}
                      {lastGpsRefreshAt.toLocaleTimeString()}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      fetchSelectedOrderTracking()
                    }
                    disabled={trackingLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-[#1E40AF] transition hover:bg-[#EFF6FF] disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={
                        trackingLoading
                          ? "animate-spin"
                          : ""
                      }
                    />
                    Refresh
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowTrackingDetails(
                        false
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-50 hover:text-[#052659]"
                    title="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-5">

                {trackingError && (
                  <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-[#EA580C]">
                    {trackingError}
                  </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setShowOrderDetails((prev) => !prev)
                    }
                    className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-[#F8FBFF]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E40AF] text-white">
                        <Truck size={20} />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-[#1E293B]">
                          Order Details
                        </h3>

                        <p className="text-xs text-slate-500">
                          {selectedTrackingOrder.orderId}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      size={20}
                      className={`shrink-0 text-[#052659] transition-transform duration-300 ${
                        showOrderDetails
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {showOrderDetails && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1180px] table-fixed text-sm">
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <TrackingOrderCell
                              label="Order ID"
                              value={selectedTrackingOrder.orderId}
                            />

                            <TrackingOrderCell
                              label="Type"
                              value={selectedTrackingOrder.type}
                            />

                            <TrackingOrderCell
                              label="Cargo Type"
                              value={selectedTrackingOrder.cargoType}
                            />

                            <TrackingOrderCell
                              label="Cargo Weight"
                              value={
                                selectedTrackingOrder.cargoWeight !== "N/A"
                                  ? `${selectedTrackingOrder.cargoWeight} kg`
                                  : "N/A"
                              }
                            />

                            <TrackingOrderCell
                              label="Vehicle Type"
                              value={selectedTrackingOrder.vehicleType}
                            />

                            <TrackingOrderCell
                              label="Container No"
                              value={selectedTrackingOrder.containerNo}
                            />
                          </tr>

                          <tr className="border-b border-slate-100">
                            <TrackingOrderCell
                              label="Pickup District"
                              value={selectedTrackingOrder.pickupDistrict}
                            />

                            <TrackingOrderCell
                              label="Pickup Location"
                              value={selectedTrackingOrder.pickupLocation}
                            />

                            <TrackingOrderCell
                              label="Destination District"
                              value={selectedTrackingOrder.destinationDistrict}
                            />

                            <TrackingOrderCell
                              label="Destination Location"
                              value={selectedTrackingOrder.destinationLocation}
                            />

                            <TrackingOrderCell
                              label="Supplier"
                              value={selectedTrackingOrder.supplier}
                            />

                            <TrackingOrderCell
                              label="Driver"
                              value={selectedTrackingOrder.driver}
                            />
                          </tr>

                          <tr>
                            <TrackingOrderCell
                              label="Vehicle No"
                              value={selectedTrackingOrder.vehicleNo}
                            />

                            <TrackingOrderCell
                              label="Current Status"
                              value={prettifyStatus(selectedTrackingOrder.status)}
                            />

                            <TrackingOrderCell
                              label="Current Location"
                              value={selectedTrackingOrder.currentLocation}
                            />

                            <TrackingOrderCell
                              label="Pickup Date"
                              value={formatDate(selectedTrackingOrder.pickupDate)}
                            />

                            <TrackingOrderCell
                              label="Expected Arrival"
                              value={formatDate(selectedTrackingOrder.expectedDay)}
                            />

                            <TrackingOrderCell
                              label="Special Instructions"
                              value={selectedTrackingOrder.specialInstructions}
                            />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setShowOrderProgress((prev) => !prev)
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#F8FBFF]"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-[#1E293B]">
                        Order Progress
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {prettifyStatus(selectedTrackingOrder.status)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden items-center gap-1 text-sm text-slate-500 sm:flex">
                        <CalendarDays size={16} />
                        Expected Day:{" "}
                        {formatDate(activeOrder?.expectedDay)}
                      </span>

                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-[#052659] transition-transform duration-300 ${
                          showOrderProgress
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  </button>

                  {showOrderProgress && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-6">
                      <div className="flex w-full items-start">
                    {orderedStages.map(
                      (stage, index) => {
                        const isReached =
                          activeStageIndex >=
                            0 &&
                          index <=
                            activeStageIndex;

                        const isCurrent =
                          index ===
                          activeStageIndex;

                        const isLineCompleted =
                          activeStageIndex >=
                            0 &&
                          index <
                            activeStageIndex;

                        const isCompletedOrder =
                          getStatusKey(
                            activeOrder?.status
                          ) ===
                          "completed";

                        const circleClass =
                          isCurrent
                            ? isCompletedOrder
                              ? "bg-[#16A34A] text-white ring-4 ring-green-100"
                              : "bg-[#1E40AF] text-white ring-4 ring-blue-100"
                            : isReached
                            ? "bg-[#1E40AF] text-white"
                            : "bg-slate-100 text-slate-500";

                        return (
                          <div
                            key={
                              stage.progress_stage_id ||
                              stage.stage_key
                            }
                            className="relative min-w-0 flex-1 text-center"
                          >
                            {index !==
                              orderedStages.length -
                                1 && (
                              <div className="absolute left-1/2 top-4 h-1 w-full bg-slate-200">
                                <div
                                  className={`h-1 w-full ${
                                    isLineCompleted
                                      ? "bg-[#1E40AF]"
                                      : "bg-slate-200"
                                  }`}
                                />
                              </div>
                            )}

                            <div
                              className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${circleClass}`}
                            >
                              {index + 1}
                            </div>

                            <p
                              className={`mt-2 px-1 text-xs font-semibold md:text-sm ${
                                isCurrent
                                  ? "text-[#1E40AF]"
                                  : isReached
                                  ? "text-[#1E293B]"
                                  : "text-slate-500"
                              }`}
                            >
                              {
                                stage.stage_name
                              }
                            </p>

                            {mapStageTime(
                              index
                            ) && (
                              <p
                                className={`mt-1 text-[11px] ${
                                  isCurrent
                                    ? "font-semibold text-[#1E40AF]"
                                    : "text-slate-500"
                                }`}
                              >
                                {mapStageTime(
                                  index
                                )}
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setShowRouteMap((prev) => !prev)
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#F8FBFF]"
                  >
                    <h3 className="text-base font-semibold text-[#1E293B]">
                      Route & Live GPS
                    </h3>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          latestDriverPosition
                            ? "bg-green-100 text-[#16A34A]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {latestDriverPosition
                          ? "Live GPS Available"
                          : "Waiting for GPS"}
                      </span>

                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-[#052659] transition-transform duration-300 ${
                          showRouteMap
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  </button>

                  {showRouteMap && (
                    <div className="border-t border-slate-100 p-4">
                      {trackingLoading ? (
                    <div className="flex h-[500px] items-center justify-center text-sm text-slate-500">
                      Loading vehicle location...
                    </div>
                  ) : (
                    <div className="relative">
                      <MapContainer
                        center={mapCenter}
                        zoom={8}
                        className="h-[500px] rounded-xl"
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapViewportController
                          plannedRoutePositions={
                            plannedRoutePositions
                          }
                          pickupPosition={
                            pickupPosition
                          }
                          destinationPosition={
                            destinationPosition
                          }
                          latestDriverPosition={
                            latestDriverPosition
                          }
                        />

                        {pickupPosition && (
                          <Marker
                            position={
                              pickupPosition
                            }
                          >
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
                          <Marker
                            position={
                              destinationPosition
                            }
                          >
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

                        {plannedRoutePositions.length >
                          1 && (
                          <Polyline
                            positions={
                              plannedRoutePositions
                            }
                            pathOptions={{
                              color:
                                "#93C5FD",
                              weight: 6,
                              opacity: 0.9,
                            }}
                          />
                        )}

                        {latestDriverPosition && (
                          <Marker
                            position={
                              latestDriverPosition
                            }
                            icon={
                              liveDriverIcon
                            }
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
                                        latestGpsRecord
                                          .drivers
                                          .first_name ||
                                        ""
                                      } ${
                                        latestGpsRecord
                                          .drivers
                                          .last_name ||
                                        ""
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
                          Waiting for live GPS
                          from the assigned
                          driver
                        </div>
                      )}
                    </div>
                  )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-[#1E293B]">
                      Shipment History
                    </h3>
                  </div>

                  <div className="space-y-5 text-sm">
                    {trackingRecords.length >
                    0 ? (
                      [...trackingRecords]
                        .sort(
                          (a, b) =>
                            new Date(
                              b.recorded_at
                            ) -
                            new Date(
                              a.recorded_at
                            )
                        )
                        .map(
                          (record) => (
                            <div
                              key={
                                record.tracking_id
                              }
                              className="flex items-start gap-4"
                            >
                              {getHistoryIcon(
                                record.status
                              )}

                              <div>
                                <p className="font-medium text-[#1E293B]">
                                  {prettifyStatus(
                                    record.status
                                  )}
                                </p>

                                <p className="text-slate-500">
                                  {formatDateTime(
                                    record.recorded_at
                                  )}{" "}
                                  -{" "}
                                  {record.current_location ||
                                    formatGpsLocation(
                                      record
                                    )}{" "}
                                  - Driver:{" "}
                                  {record.drivers
                                    ? `${
                                        record
                                          .drivers
                                          .first_name ||
                                        ""
                                      } ${
                                        record
                                          .drivers
                                          .last_name ||
                                        ""
                                      }`.trim()
                                    : selectedTrackingOrder?.driver ||
                                      "Not assigned"}
                                </p>
                              </div>
                            </div>
                          )
                        )
                    ) : (
                      <div className="flex items-start gap-4">
                        <CheckCircle
                          size={18}
                          className="mt-1 text-slate-400"
                        />

                        <div>
                          <p className="font-medium text-[#1E293B]">
                            No Shipment History
                          </p>

                          <p className="text-slate-500">
                            No container tracking
                            records found for this
                            order.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem(
                        "trackingOrder"
                      );
                      setTrackingOrder(
                        null
                      );
                      setTrackingRecords(
                        []
                      );
                      setTrackingError("");
                      setLastGpsRefreshAt(
                        null
                      );
                      setPlannedRoutePositions(
                        []
                      );
                      setShowTrackingDetails(
                        false
                      );
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-[#1E293B] transition hover:bg-slate-50"
                  >
                    Clear Selection
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
    </div>
  );
}


function TrackingOrderCell({
  label,
  value,
}) {
  return (
    <td className="w-1/6 px-5 py-4 align-top">
      <p className="mb-1 text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="break-words text-sm font-semibold leading-5 text-[#1E293B]">
        {value || "N/A"}
      </p>
    </td>
  );
}

export default Tracking;
