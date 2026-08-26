import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { theme } from "../constants/theme";

export default function MapScreen({ route, navigation }) {
  const activeMission = route?.params?.order || {};
  const orderData = activeMission.orders || {};
  const status = (activeMission.status || "").toLowerCase();
  const isHeadingToPickup = !status || status === "assigned" || status === "started" || status === "heading to pickup";

  const mapRef = useRef(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(permStatus === 'granted');
      } catch (err) {
        console.warn("Error requesting foreground location permissions:", err);
      }
    })();
  }, []);

  const order = {
    id: orderData.order_reference || "IMP-12345",
    pickup: {
      name: orderData.origin_name || "Freezone Warehouse",
      address: orderData.origin_address || "Katunayake, Sri Lanka",
      latitude: Number(orderData.origin_latitude || orderData.pickup_latitude || 6.933),
      longitude: Number(orderData.origin_longitude || orderData.pickup_longitude || 79.85)
    },
    drop: {
      name: orderData.destination_name || "Colombo Port Terminal",
      address: orderData.destination_address || "Colombo, Sri Lanka",
      latitude: Number(orderData.destination_latitude || orderData.dropoff_latitude || 6.948),
      longitude: Number(orderData.destination_longitude || orderData.dropoff_longitude || 79.873)
    }
  };

  const [currentLocation, setCurrentLocation] = useState(null);
  useEffect(() => {
    if (!hasLocationPermission) return undefined;

    let isMounted = true;
    const updateCurrentLocation = (location) => {
      if (!isMounted) return;
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
      .then(updateCurrentLocation)
      .catch((error) => console.warn("MapScreen: Could not get current location:", error));

    let locationSubscription;
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 100,
        timeInterval: 15000,
      },
      updateCurrentLocation,
    ).then((subscription) => {
      if (isMounted) {
        locationSubscription = subscription;
      } else {
        subscription.remove();
      }
    }).catch((error) => console.warn("MapScreen: Location tracking unavailable:", error));

    return () => {
      isMounted = false;
      locationSubscription?.remove();
    };
  }, [hasLocationPermission]);

  const [routeLegs, setRouteLegs] = useState({
    toPickup: [],
    toDelivery: [order.pickup, order.drop],
  });

  useEffect(() => {
    const fetchRoute = async () => {
      const start = currentLocation || order.pickup;
      const toPickup = isHeadingToPickup ? [start, order.pickup] : [];
      const toDelivery = isHeadingToPickup ? [order.pickup, order.drop] : [start, order.drop];
      const legs = { toPickup, toDelivery };

      const getRouteLeg = async (leg) => {
        if (leg.length < 2 || leg.some((stop) => !stop.latitude || !stop.longitude)) return leg;

        const waypoints = leg.map((stop) => `${stop.longitude},${stop.latitude}`).join(";");
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson&alternatives=true`,
        );
        const json = await response.json();
        const routes = json.routes || [];
        const fastestRoute = routes.reduce(
          (fastest, candidate) => (!fastest || candidate.duration < fastest.duration ? candidate : fastest),
          null,
        );

        if (!fastestRoute?.geometry?.coordinates?.length) return leg;
        return fastestRoute.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
      };

      try {
        const [pickupLeg, deliveryLeg] = await Promise.all([
          getRouteLeg(toPickup),
          getRouteLeg(toDelivery),
        ]);
        setRouteLegs({ toPickup: pickupLeg, toDelivery: deliveryLeg });
      } catch (error) {
        console.warn("MapScreen: OSRM route fetch failed, using stop fallback:", error);
        setRouteLegs(legs);
      }
    };

    fetchRoute();
  }, [currentLocation, isHeadingToPickup, order.pickup.latitude, order.pickup.longitude, order.drop.latitude, order.drop.longitude]);

  useEffect(() => {
    if (mapRef.current && order.pickup.latitude && order.drop.latitude) {
      const stops = currentLocation
        ? isHeadingToPickup
          ? [currentLocation, order.pickup, order.drop]
          : [currentLocation, order.drop]
        : [order.pickup, order.drop];
      const timer = setTimeout(() => {
        mapRef.current.fitToCoordinates(
          [
            ...routeLegs.toPickup,
            ...routeLegs.toDelivery,
          ],
          {
            edgePadding: { top: 100, right: 60, bottom: 250, left: 60 },
            animated: true,
          }
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, isHeadingToPickup, order.pickup.latitude, order.drop.latitude, routeLegs]);

  const currentTarget = isHeadingToPickup ? order.pickup : order.drop;

  const handleOpenNavigation = () => {
    const { latitude, longitude } = currentTarget;
    const label = encodeURIComponent(currentTarget.name);
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });

    if (!url) return;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        }

        return Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        );
      })
      .catch((error) => {
        console.error("Could not launch external navigation:", error);
        Alert.alert("Navigation Error", "Could not open Google Maps.");
      });
  };

  const hasAutoStartedNavigation = useRef(false);
  useEffect(() => {
    if (route?.params?.autoStartNavigation && !hasAutoStartedNavigation.current) {
      hasAutoStartedNavigation.current = true;
      handleOpenNavigation();
    }
  }, [route?.params?.autoStartNavigation, currentTarget.latitude, currentTarget.longitude]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        showsUserLocation={hasLocationPermission}
        style={styles.map}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        <Marker coordinate={order.pickup}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerDot, { backgroundColor: theme.colors.primary }]} />
          </View>
        </Marker>

        <Marker coordinate={order.drop}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerDot, { backgroundColor: theme.colors.accent }]} />
          </View>
        </Marker>

        {routeLegs.toPickup.length > 1 && (
          <Polyline
            coordinates={routeLegs.toPickup}
            strokeWidth={5}
            strokeColor="#F59E0B"
            lineCap="round"
            lineJoin="round"
          />
        )}
        {routeLegs.toDelivery.length > 1 && (
          <Polyline
            coordinates={routeLegs.toDelivery}
            strokeWidth={5}
            strokeColor={theme.colors.primary}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      <SafeAreaView style={styles.backButtonContainer} edges={["top"]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <Card elevation="lg" style={styles.bottomCard}>
        <View style={styles.cardHeader}>
          <Typography variant="h3" weight="bold">
            {isHeadingToPickup ? "Next: Pickup Location" : "Next: Destination Location"}
          </Typography>
          <Typography variant="tiny" color="primary" weight="bold">
            {order.id}
          </Typography>
        </View>

        <Typography variant="body" weight="semiBold" style={{ marginTop: 8 }}>
          {currentTarget.name}
        </Typography>

        <Typography variant="caption" color="textMuted" style={{ marginTop: 2 }}>
          {currentTarget.address}
        </Typography>

        <Button
          title="Open Google Maps"
          onPress={handleOpenNavigation}
          style={styles.navButton}
          textStyle={styles.navButtonText}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    ...theme.shadows.md,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  backButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  bottomCard: {
    position: "absolute",
    bottom: theme.spacing.xl,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButton: {
    marginTop: theme.spacing.md,
    height: 48,
    borderRadius: 12,
  },
  navButtonText: {
    fontSize: 16,
  }
});