import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../constants/config";
import { authFetch, getStoredAuthToken } from "../utils/authFetch";

const OrderContext = createContext();
const BACKGROUND_TRACKING_TASK = "conntrack-background-location";

const publishLocation = async (location, mission, status) => {
  if (!mission?.assignmentId || !mission?.orderId) return;

  const token = await getStoredAuthToken();
  if (!token) return;

  await authFetch(`${API_BASE_URL}/api/driver/tracking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assignmentId: mission.assignmentId,
      orderId: mission.orderId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      status,
      description: "Live GPS update",
    }),
  });
};

TaskManager.defineTask(BACKGROUND_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.warn("Background tracking task failed:", error.message);
    return;
  }

  const locations = data?.locations || [];
  if (locations.length === 0) return;

  const [missionJson, status] = await Promise.all([
    AsyncStorage.getItem("tracking_mission"),
    AsyncStorage.getItem("tracking_status"),
  ]);
  const mission = missionJson ? JSON.parse(missionJson) : null;
  const latestLocation = locations[locations.length - 1];

  try {
    await publishLocation(latestLocation, mission, status || "in transit");
  } catch (publishError) {
    console.warn("Background location upload failed:", publishError.message);
  }
});

export function OrderProvider({ children }) {
  const [orderStatus, setOrderStatusState] = useState("assigned");
  const [trackingMission, setTrackingMission] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const locationSubscription = useRef(null);
  const isPublishingLocation = useRef(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("tracking_mission"),
      AsyncStorage.getItem("tracking_status"),
    ]).then(([missionJson, storedStatus]) => {
      if (missionJson) setTrackingMission(JSON.parse(missionJson));
      if (storedStatus) setOrderStatusState(storedStatus);
      setIsHydrated(true);
    }).catch((error) => {
      console.warn("Could not restore tracking state:", error.message);
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return undefined;

    const normalizedStatus = (orderStatus || "").toLowerCase();
    const shouldTrack = [
      "started",
      "heading to pickup",
      "picked",
      "picked up",
      "transit",
      "in transit"
    ].includes(normalizedStatus);

    if (!shouldTrack || !trackingMission?.assignmentId || !trackingMission?.orderId) {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      setIsTracking(false);
      return undefined;
    }

    let isCancelled = false;

    const publishForegroundLocation = async (location) => {
      if (isPublishingLocation.current) return;

      isPublishingLocation.current = true;
      try {
        const response = await authFetch(`${API_BASE_URL}/api/driver/tracking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: trackingMission.assignmentId,
            orderId: trackingMission.orderId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            status: normalizedStatus,
            description: "Live GPS update"
          })
        });

        if (response.ok) setLastLocationUpdate(new Date());
      } catch (error) {
        console.warn("Live tracking update failed:", error);
      } finally {
        isPublishingLocation.current = false;
      }
    };

    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (isCancelled || status !== "granted") return null;

        setIsTracking(true);
        return Promise.all([
          AsyncStorage.setItem("tracking_mission", JSON.stringify(trackingMission)),
          AsyncStorage.setItem("tracking_status", normalizedStatus),
          Location.startLocationUpdatesAsync(BACKGROUND_TRACKING_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 25,
            deferredUpdatesInterval: 15000,
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: "ConnTrack live tracking",
              notificationBody: "Your shipment location is being shared until delivery.",
            },
          }),
        ]).then(() => Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 25,
            mayShowUserSettingsDialog: true
          },
          publishForegroundLocation
        ));
      })
      .then((subscription) => {
        if (!subscription) return;
        if (isCancelled) {
          subscription.remove();
        } else {
          locationSubscription.current = subscription;
        }
      })
      .catch((error) => {
        setIsTracking(false);
        console.warn("Could not start live tracking:", error);
      });

    return () => {
      isCancelled = true;
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      Location.hasStartedLocationUpdatesAsync(BACKGROUND_TRACKING_TASK)
        .then((started) => started && Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING_TASK))
        .catch((error) => console.warn("Could not stop background tracking:", error.message));
      AsyncStorage.removeItem("tracking_mission").catch(() => {});
      AsyncStorage.removeItem("tracking_status").catch(() => {});
      setIsTracking(false);
    };
  }, [isHydrated, orderStatus, trackingMission]);

  const updateStatus = (status) => {
    const normalizedStatus = status.toLowerCase();
    setOrderStatusState(normalizedStatus);
    AsyncStorage.setItem("tracking_status", normalizedStatus).catch(() => {});
  };

  const registerTrackingMission = (mission) => {
    const nextMission = {
      assignmentId: mission?.assignment_id || mission?.id,
      orderId: mission?.order_id || mission?.orders?.order_id
    };
    setTrackingMission(nextMission);
    AsyncStorage.setItem("tracking_mission", JSON.stringify(nextMission)).catch(() => {});
  };

  return (
    <OrderContext.Provider value={{
      orderStatus,
      setOrderStatus: updateStatus,
      registerTrackingMission,
      isTracking,
      lastLocationUpdate
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  return useContext(OrderContext);
}