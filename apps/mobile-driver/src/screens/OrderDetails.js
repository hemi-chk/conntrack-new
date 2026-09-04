import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Animated, Dimensions, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { useOrder } from "../context/OrderContext";
import { authFetch } from "../utils/authFetch";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function OrderDetails({ route: navRoute, navigation }) {
  const { orderStatus, setOrderStatus, registerTrackingMission } = useOrder();
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();
  
  // Get real order data from Dashboard
  const activeMission = navRoute?.params?.order || {};
  const orderData = activeMission.orders || {};

  const [isExpanded, setIsExpanded] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const sheetHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    map: {
      width: "100%",
      height: "100%",
    },
    markerContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: activeTheme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2.5,
      borderColor: activeTheme.colors.surface,
      ...activeTheme.shadows.md,
    },
    markerDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: activeTheme.spacing.lg,
      paddingVertical: activeTheme.spacing.md,
    },
    circleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: activeTheme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      ...activeTheme.shadows.md,
    },
    bottomSheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: activeTheme.colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: activeTheme.spacing.lg,
      paddingBottom: 20,
      ...activeTheme.shadows.lg,
      overflow: "hidden",
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: activeTheme.colors.border,
    },
    sheetHandleContainer: {
      width: "100%",
      paddingVertical: 12,
      alignItems: "center",
    },
    sheetHandle: {
      width: 44,
      height: 4,
      backgroundColor: activeTheme.colors.border,
      borderRadius: 2,
    },
    orderSummary: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
      paddingBottom: 10,
    },
    etaContainer: {
      alignItems: "flex-end",
    },
    divider: {
      height: 1,
      backgroundColor: activeTheme.colors.border,
      marginVertical: 16,
    },
    routeBox: {
      flexDirection: "row",
      paddingLeft: 4,
    },
    routeIcons: {
      alignItems: "center",
      width: 24,
    },
    routeLine: {
      width: 2,
      height: 38,
      backgroundColor: activeTheme.colors.border,
      marginVertical: 4,
    },
    routeDetails: {
      flex: 1,
      marginLeft: 12,
    },
    locationInfo: {
      justifyContent: "center",
    },
    infoGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 24,
    },
    infoTile: {
      width: "31%",
      padding: 12,
      alignItems: "center",
      borderRadius: activeTheme.roundness.md,
    },
    footer: {
      paddingTop: 12,
      paddingBottom: 24,
      paddingHorizontal: 20,
      backgroundColor: activeTheme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: activeTheme.colors.border,
    },
    actionButton: {
      borderRadius: activeTheme.roundness.md,
      height: 54,
    },
    completedBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${activeTheme.colors.success}15`,
      padding: 16,
      borderRadius: activeTheme.roundness.md,
      borderWidth: 1,
      borderColor: `${activeTheme.colors.success}30`,
    },
    supportActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 24,
    },
    supportButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: activeTheme.roundness.md,
      backgroundColor: `${activeTheme.colors.primary}10`,
    },
    instructionsSection: {
      marginTop: 24,
    },
    instructionsBanner: {
      flexDirection: "row",
      backgroundColor: `${activeTheme.colors.warning}12`,
      borderRadius: activeTheme.roundness.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: `${activeTheme.colors.warning}30`,
    },
    instructionsAccent: {
      width: 4,
      backgroundColor: activeTheme.colors.warning,
    },
    instructionsBody: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    instructionsHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    instructionsIconBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: `${activeTheme.colors.warning}25`,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    floatingButtonsContainer: {
      position: "absolute",
      right: activeTheme.spacing.lg,
      top: 120,
      zIndex: 100,
    },
    floatingCircleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: activeTheme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      ...activeTheme.shadows.md,
    },
  });

  useEffect(() => {
    Animated.spring(sheetHeight, {
      toValue: isExpanded ? SCREEN_HEIGHT * 0.6 : 140,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [isExpanded]);

  useEffect(() => {
    registerTrackingMission(activeMission);
    if (activeMission.status) {
      setOrderStatus(activeMission.status.toLowerCase());
    }
  }, [activeMission.status]);

  const mapRef = useRef(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(status === 'granted');
      } catch (err) {
        console.warn("Error requesting foreground location permissions:", err);
      }
    })();
  }, []);

  const order = {
    id: orderData.order_reference || "IMP-12345",
    pickup: {
      name: orderData.origin_name || t("freezone_warehouse"),
      address: orderData.origin_address || t("katunayake_address"),
      latitude: Number(orderData.origin_latitude || orderData.pickup_latitude || 6.933),
      longitude: Number(orderData.origin_longitude || orderData.pickup_longitude || 79.85)
    },
    drop: {
      name: orderData.destination_name || t("colombo_port_terminal"),
      address: orderData.destination_address || t("colombo_port_address"),
      latitude: Number(orderData.destination_latitude || orderData.dropoff_latitude || 6.948),
      longitude: Number(orderData.destination_longitude || orderData.dropoff_longitude || 79.873)
    },
    instructions: orderData.special_instructions || orderData.instructions || t("temp_sensitive_cargo"),
    eta: "45 mins",
    distance: "12.4 km",
    type: orderData.order_type || t("container"),
    cargoType: orderData.cargo_type || t("general"),
    weight: orderData.cargo_weight ? `${orderData.cargo_weight} ${t("tons")}` : t("n_a")
  };

  const [route, setRoute] = useState([
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
        setRoute([order.pickup, order.drop]);
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
            setRoute(coords);
            return;
          }
        }
        setRoute([order.pickup, order.drop]);
      } catch (error) {
        console.warn("OrderDetails: OSRM route fetch failed, using straight line fallback:", error);
        setRoute([order.pickup, order.drop]);
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
            edgePadding: { top: 120, right: 60, bottom: SCREEN_HEIGHT * 0.45 + 60, left: 60 },
            animated: true,
          }
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order.pickup.latitude, order.drop.latitude]);

  const getStatusBadgeVariant = () => {
    switch (orderStatus) {
      case "assigned": return "secondary";
      case "started": 
      case "heading to pickup": return "secondary";
      case "picked": 
      case "picked up": return "warning";
      case "transit": 
      case "in transit": return "primary";
      case "delivered": return "success";
      default: return "secondary";
    }
  };

  const getStatusInfo = () => {
    switch (orderStatus) {
      case "assigned": return { label: t("assigned"), color: activeTheme.colors.secondary, icon: "assignment" };
      case "started": 
      case "heading to pickup": return { label: t("heading_to_pickup"), color: activeTheme.colors.secondary, icon: "directions-car" };
      case "picked": 
      case "picked up": return { label: t("picked_up"), color: activeTheme.colors.warning, icon: "local-shipping" };
      case "transit": 
      case "in transit": return { label: t("in_transit"), color: activeTheme.colors.primary, icon: "navigation" };
      case "delivered": return { label: t("delivered"), color: activeTheme.colors.success, icon: "check-circle" };
      default: return { label: t("unknown"), color: activeTheme.colors.textMuted, icon: "help" };
    }
  };

  const statusInfo = getStatusInfo();

  const handleOpenNavigation = () => {
    const isHeadingToPickup = !orderStatus || orderStatus === "assigned" || orderStatus === "started" || orderStatus === "heading to pickup";
    const target = isHeadingToPickup ? order.pickup : order.drop;
    const label = encodeURIComponent(target.name);
    const url = Platform.select({
      ios: `maps://app?daddr=${target.latitude},${target.longitude}&q=${label}`,
      android: `google.navigation:q=${target.latitude},${target.longitude}`,
    });

    if (!url) return;

    Linking.canOpenURL(url)
      .then((supported) => supported
        ? Linking.openURL(url)
        : Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`))
      .catch((error) => {
        console.error("Could not launch external navigation:", error);
        Alert.alert("Navigation Error", "Could not open Google Maps.");
      });
  };

  const syncStatusWithDb = async (nextStatus) => {
    const assignmentId = activeMission.assignment_id || activeMission.id;
    const dbOrderId = activeMission.order_id || activeMission.orders?.order_id;

    if (!assignmentId || !dbOrderId) {
      Alert.alert(
        "Sync Error", 
        "Missing identification for this mission. Please try refreshing your dashboard."
      );
      return;
    }

    try {
      setIsUpdating(true);
      
      let latitude = 6.9271;
      let longitude = 79.8612;
      let locationName = "Manual Update";

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 5000
          });
          if (location) {
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
            
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocode && geocode[0]) {
              locationName = `${geocode[0].city || geocode[0].region || "Colombo"}, ${geocode[0].country || "Sri Lanka"}`;
            } else {
              locationName = "Live Update";
            }
          }
        }
      } catch (err) {
        console.warn("Could not retrieve GPS coordinates:", err);
      }

      const response = await authFetch(`${API_BASE_URL}/api/driver/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          orderId: dbOrderId,
          status: nextStatus,
          locationName,
          latitude,
          longitude
        })
      });

      const result = await response.json();
      if (result.success) {
        setOrderStatus(nextStatus);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        navigation.navigate("Tracking", { 
          order: { ...activeMission, status: nextStatus } 
        });
      } else {
        Alert.alert("Server Error", result.message || "Failed to update status on server");
      }
    } catch (error) {
      console.error("Status Sync Error:", error);
      Alert.alert("Network Error", "Please check your internet connection and try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapView
        ref={mapRef}
        showsUserLocation={hasLocationPermission}
        style={styles.map}
        initialRegion={{
          latitude: 6.94,
          longitude: 79.86,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04
        }}
      >
        <Marker coordinate={order.pickup}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerDot, { backgroundColor: activeTheme.colors.primary }]} />
          </View>
        </Marker>

        <Marker coordinate={order.drop}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerDot, { backgroundColor: activeTheme.colors.accent }]} />
          </View>
        </Marker>

        <Polyline
          coordinates={route}
          strokeWidth={5}
          strokeColor={activeTheme.colors.primary}
          lineDashPattern={[0]}
        />
      </MapView>

      {/* FLOATING ACTION BUTTONS */}
      <View style={styles.floatingButtonsContainer}>
        <TouchableOpacity
          style={styles.floatingCircleButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Map", { order: activeMission })}
        >
          <MaterialIcons name="fullscreen" size={24} color={activeTheme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingCircleButton, { marginTop: 12, backgroundColor: activeTheme.colors.primary, borderColor: activeTheme.colors.primary }]}
          activeOpacity={0.8}
          onPress={handleOpenNavigation}
        >
          <MaterialIcons name="navigation" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* TOP BAR */}
      <SafeAreaView style={styles.header} edges={["top"]}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => navigation?.goBack?.()}
        >
          <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
        </TouchableOpacity>

        <Badge
          label={statusInfo.label}
          variant={getStatusBadgeVariant()}
          showDot={true}
        />

        <TouchableOpacity style={styles.circleButton}>
          <MaterialIcons name="more-vert" size={24} color={activeTheme.colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* BOTTOM SHEET */}
      <Animated.View
        style={[styles.bottomSheet, { height: sheetHeight, zIndex: 1000 }]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setIsExpanded(!isExpanded);
          }}
          style={styles.sheetHandleContainer}
          hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
        >
          <View style={styles.sheetHandle} />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
        >
          <View style={styles.orderSummary}>
            <View>
              <Typography variant="h2" weight="bold">{order.id}</Typography>
              <Typography variant="caption" color="textMuted">{t("logistics_id", { id: "4492001" })}</Typography>
            </View>
            <View style={styles.etaContainer}>
              <Typography variant="h3" weight="bold" color="primary">{order.eta}</Typography>
              <Typography variant="tiny" color="textMuted">{order.distance}</Typography>
            </View>
          </View>

          {isExpanded && (
            <>
              <View style={styles.divider} />

              {/* ROUTE INFO */}
              <View style={styles.routeBox}>
                <View style={styles.routeIcons}>
                  <Ionicons name="location" size={20} color={activeTheme.colors.primary} />
                  <View style={styles.routeLine} />
                  <Ionicons name="flag" size={20} color={activeTheme.colors.accent} />
                </View>
                <View style={styles.routeDetails}>
                  <View style={styles.locationInfo}>
                    <Typography variant="body" weight="bold">{order.pickup.name}</Typography>
                    <Typography variant="tiny" color="textMuted">{order.pickup.address}</Typography>
                  </View>
                  <View style={[styles.locationInfo, { marginTop: 22 }]}>
                    <Typography variant="body" weight="bold">{order.drop.name}</Typography>
                    <Typography variant="tiny" color="textMuted">{order.drop.address}</Typography>
                  </View>
                </View>
              </View>

              {/* INFO TILES */}
              <View style={styles.infoGrid}>
                <Card elevation="sm" style={styles.infoTile}>
                  <MaterialIcons name="inventory" size={20} color={activeTheme.colors.primary} />
                  <Typography variant="tiny" weight="bold" style={{ marginTop: 4 }}>{t("type")}</Typography>
                  <Typography variant="tiny" color="textMuted" numberOfLines={1}>{order.type}</Typography>
                </Card>
                <Card elevation="sm" style={styles.infoTile}>
                  <MaterialIcons name="fitness-center" size={20} color={activeTheme.colors.primary} />
                  <Typography variant="tiny" weight="bold" style={{ marginTop: 4 }}>{t("weight")}</Typography>
                  <Typography variant="tiny" color="textMuted" numberOfLines={1}>{order.weight}</Typography>
                </Card>
                <Card elevation="sm" style={styles.infoTile}>
                  <MaterialIcons name="category" size={20} color={activeTheme.colors.warning} />
                  <Typography variant="tiny" weight="bold" style={{ marginTop: 4 }}>{t("cargo")}</Typography>
                  <Typography variant="tiny" color="textMuted" numberOfLines={1}>{order.cargoType}</Typography>
                </Card>
              </View>

              {/* INSTRUCTIONS */}
              {order.instructions ? (
                <View style={styles.instructionsSection}>
                  <View style={styles.instructionsBanner}>
                    <View style={styles.instructionsAccent} />
                    <View style={styles.instructionsBody}>
                      <View style={styles.instructionsHeader}>
                        <View style={styles.instructionsIconBadge}>
                          <MaterialIcons name="priority-high" size={16} color={activeTheme.colors.warning} />
                        </View>
                        <Typography variant="caption" weight="bold" style={{ color: activeTheme.colors.warning }}>
                          {t("special_instructions", "Special Instructions")}
                        </Typography>
                      </View>
                      <Typography variant="caption" style={{ color: activeTheme.colors.text, lineHeight: 20, marginTop: 6 }}>
                        {order.instructions}
                      </Typography>
                    </View>
                  </View>
                </View>
              ) : null}
              
              <View style={styles.supportActions}>
                <TouchableOpacity
                  style={styles.supportButton}
                  onPress={() => navigation.navigate("Support", { order: activeMission, user: navRoute?.params?.user })}
                >
                  <MaterialIcons name="call" size={20} color={activeTheme.colors.primary} />
                  <Typography variant="caption" weight="semiBold" style={{ marginLeft: 6, color: activeTheme.colors.primary }}>
                    {t("call_help")}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.supportButton}
                  onPress={() => navigation.navigate("Support", { order: activeMission, user: navRoute?.params?.user })}
                >
                  <MaterialIcons name="message" size={20} color={activeTheme.colors.primary} />
                  <Typography variant="caption" weight="semiBold" style={{ marginLeft: 6, color: activeTheme.colors.primary }}>
                    {t("messages")}
                  </Typography>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        {/* COMPACT FIXED ACTION BUTTON */}
        <View style={styles.footer}>
          {(!orderStatus || orderStatus === "assigned" || orderStatus === "Assigned") ? (
            <Button
              title={t("start_trip")}
              icon="play-arrow"
              onPress={() => syncStatusWithDb("started")}
              loading={isUpdating}
              style={styles.actionButton}
            />
          ) : (orderStatus === "started" || orderStatus === "heading to pickup") ? (
            <Button
              title={t("arrived_at_pickup")}
              icon="local-shipping"
              variant="secondary"
              onPress={() => syncStatusWithDb("picked")}
              loading={isUpdating}
              style={styles.actionButton}
            />
          ) : (orderStatus === "picked" || orderStatus === "picked up") ? (
            <Button
              title={t("start_delivery")}
              icon="navigation"
              onPress={() => syncStatusWithDb("transit")}
              loading={isUpdating}
              style={styles.actionButton}
            />
          ) : (orderStatus === "transit" || orderStatus === "in transit") ? (
            <>
              <Button
                title={t("start_trip")}
                icon="play-arrow"
                onPress={() => syncStatusWithDb("started")}
                loading={isUpdating}
                style={styles.actionButton}
              />
              <Button
                title={t("mark_delivered")}
                icon="check-circle"
                variant="success"
                onPress={() => syncStatusWithDb("delivered")}
                loading={isUpdating}
                style={[styles.actionButton, { marginTop: activeTheme.spacing.sm }]}
              />
            </>
          ) : orderStatus === "delivered" ? (
            <View style={styles.completedBox}>
              <MaterialIcons name="check-circle" size={24} color={activeTheme.colors.success} />
              <Typography variant="body" weight="bold" color="success" style={{ marginLeft: 8 }}>
                {t("mission_completed_success")}
              </Typography>
            </View>
          ) : (
            <Button
              title={t("start_trip")}
              icon="play-arrow"
              onPress={() => syncStatusWithDb("started")}
              loading={isUpdating}
              style={styles.actionButton}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}
