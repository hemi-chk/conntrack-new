import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, Linking, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export default function MapScreen({ route, navigation }) {
  const activeMission = route?.params?.order || {};
  const orderData = activeMission.orders || {};
  const status = (activeMission.status || "").toLowerCase();

  const mapRef = useRef(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Request location permission on mount to show user location dot
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

  const [routeCoordinates, setRouteCoordinates] = useState([
    order.pickup,
    order.drop
  ]);

  // Fetch actual driving route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      const pLat = order.pickup.latitude;
      const pLng = order.pickup.longitude;
      const dLat = order.drop.latitude;
      const dLng = order.drop.longitude;

      if (!pLat || !pLng || !dLat || !dLng) {
        setRouteCoordinates([order.pickup, order.drop]);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.code === "Ok" && json.routes && json.routes[0]) {
          const coords = json.routes[0].geometry.coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0]
          }));
          if (coords.length > 0) {
            setRouteCoordinates(coords);
            return;
          }
        }
        setRouteCoordinates([order.pickup, order.drop]);
      } catch (error) {
        console.warn("MapScreen: OSRM route fetch failed, using straight line fallback:", error);
        setRouteCoordinates([order.pickup, order.drop]);
      }
    };

    fetchRoute();
  }, [order.pickup.latitude, order.pickup.longitude, order.drop.latitude, order.drop.longitude]);

  // Auto-fit coordinates to see both markers
  useEffect(() => {
    if (mapRef.current && order.pickup.latitude && order.drop.latitude) {
      const timer = setTimeout(() => {
        mapRef.current.fitToCoordinates(
          [
            { latitude: order.pickup.latitude, longitude: order.pickup.longitude },
            { latitude: order.drop.latitude, longitude: order.drop.longitude }
          ],
          {
            edgePadding: { top: 100, right: 60, bottom: 250, left: 60 },
            animated: true,
          }
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order.pickup.latitude, order.drop.latitude]);

  const isHeadingToPickup = !status || status === "assigned" || status === "started" || status === "heading to pickup";
  const currentTarget = isHeadingToPickup ? order.pickup : order.drop;

  const handleOpenNavigation = () => {
    const lat = currentTarget.latitude;
    const lng = currentTarget.longitude;
    const label = encodeURIComponent(currentTarget.name);
    
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${label}`,
      android: `google.navigation:q=${lat},${lng}`
    });
    
    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            Linking.openURL(webUrl);
          }
        })
        .catch((err) => {
          console.error("An error occurred launching navigation:", err);
          Alert.alert("Error", "Could not launch native navigation app.");
        });
    }
  };

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

        <Polyline
          coordinates={routeCoordinates}
          strokeWidth={5}
          strokeColor={theme.colors.primary}
        />
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
          title="Start Navigation"
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