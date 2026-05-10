import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { theme } from "../constants/theme";
import { useOrder } from "../context/OrderContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function OrderDetails({ route: navRoute, navigation }) {
  const { orderStatus, setOrderStatus } = useOrder();
  const { t } = useTranslation();
  
  // Get real order data from Dashboard
  const activeMission = navRoute?.params?.order || {};
  const orderData = activeMission.orders || {};

  const [isExpanded, setIsExpanded] = useState(true);

  // Animation for sheet height
  const sheetHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.6)).current;

  useEffect(() => {
    Animated.spring(sheetHeight, {
      toValue: isExpanded ? SCREEN_HEIGHT * 0.6 : 140,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [isExpanded]);

  const order = {
    id: orderData.order_reference || "IMP-12345",
    pickup: {
      name: orderData.origin_name || t("freezone_warehouse"),
      address: orderData.origin_address || t("katunayake_address"),
      latitude: 6.933,
      longitude: 79.85
    },
    drop: {
      name: orderData.destination_name || t("colombo_port_terminal"),
      address: orderData.destination_address || t("colombo_port_address"),
      latitude: 6.948,
      longitude: 79.873
    },
    instructions: orderData.special_instructions || orderData.instructions || t("temp_sensitive_cargo"),
    eta: "45 mins",
    distance: "12.4 km",
    type: orderData.order_type || t("container"),
    cargoType: orderData.cargo_type || t("general"),
    weight: orderData.cargo_weight ? `${orderData.cargo_weight} ${t("tons")}` : t("n_a")
  };

  const route = [
    { latitude: 6.933, longitude: 79.85 },
    { latitude: 6.936, longitude: 79.855 },
    { latitude: 6.939, longitude: 79.86 },
    { latitude: 6.942, longitude: 79.865 },
    { latitude: 6.945, longitude: 79.87 },
    { latitude: 6.948, longitude: 79.873 }
  ];

  const getStatusInfo = () => {
    switch (orderStatus) {
      case "assigned": return { label: t("assigned"), color: theme.colors.secondary, icon: "assignment" };
      case "started": return { label: t("heading_to_pickup"), color: theme.colors.secondary, icon: "directions-car" };
      case "picked": return { label: t("picked_up"), color: theme.colors.warning, icon: "local-shipping" };
      case "transit": return { label: t("in_transit"), color: theme.colors.primary, icon: "navigation" };
      case "delivered": return { label: t("delivered"), color: theme.colors.success, icon: "check-circle" };
      default: return { label: t("unknown"), color: theme.colors.textMuted, icon: "help" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapView
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
            <View style={[styles.markerDot, { backgroundColor: theme.colors.primary }]} />
          </View>
        </Marker>

        <Marker coordinate={order.drop}>
          <View style={styles.markerContainer}>
            <View style={[styles.markerDot, { backgroundColor: theme.colors.accent }]} />
          </View>
        </Marker>

        <Polyline
          coordinates={route}
          strokeWidth={5}
          strokeColor={theme.colors.primary}
          lineDashPattern={[0]}
        />
      </MapView>

      {/* TOP BAR */}
      <SafeAreaView style={styles.header} edges={["top"]}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => navigation?.goBack?.()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerStatus}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Typography variant="caption" weight="bold">{statusInfo.label}</Typography>
        </View>

        <TouchableOpacity style={styles.circleButton}>
          <MaterialIcons name="more-vert" size={24} color={theme.colors.text} />
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
            console.log("Toggle Sheet:", !isExpanded);
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
                  <Ionicons name="location" size={20} color={theme.colors.primary} />
                  <View style={styles.routeLine} />
                  <Ionicons name="flag" size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.routeDetails}>
                  <View style={styles.locationInfo}>
                    <Typography variant="body" weight="bold">{order.pickup.name}</Typography>
                    <Typography variant="tiny" color="textMuted">{order.pickup.address}</Typography>
                  </View>
                  <View style={[styles.locationInfo, { marginTop: 20 }]}>
                    <Typography variant="body" weight="bold">{order.drop.name}</Typography>
                    <Typography variant="tiny" color="textMuted">{order.drop.address}</Typography>
                  </View>
                </View>
              </View>

              {/* INFO TILES */}
              <View style={styles.infoGrid}>
                <Card style={styles.infoTile}>
                  <MaterialIcons name="inventory" size={20} color={theme.colors.primary} />
                  <Typography variant="tiny" weight="bold" style={{ marginTop: 4 }}>{t("type")}</Typography>
                  <Typography variant="tiny" color="textMuted" numberOfLines={1}>{order.type}</Typography>
                </Card>
                <Card style={styles.infoTile}>
                  <MaterialIcons name="fitness-center" size={20} color={theme.colors.primary} />
                  <Typography variant="tiny" weight="bold" style={{ marginTop: 4 }}>{t("weight")}</Typography>
                  <Typography variant="tiny" color="textMuted" numberOfLines={1}>{order.weight}</Typography>
                </Card>
                <Card style={styles.infoTile}>
                  <MaterialIcons name="category" size={20} color={theme.colors.warning} />
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
                          <MaterialIcons name="priority-high" size={16} color="#D97706" />
                        </View>
                        <Typography variant="caption" weight="bold" style={{ color: "#92400E" }}>
                          {t("special_instructions", "Special Instructions")}
                        </Typography>
                      </View>
                      <Typography variant="caption" style={{ color: "#78350F", lineHeight: 20, marginTop: 6 }}>
                        {order.instructions}
                      </Typography>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* ACTIONS */}
              <View style={styles.footer}>
                {orderStatus === "assigned" && (
                  <Button
                    title={t("start_trip")}
                    onPress={() => setOrderStatus("started")}
                    style={styles.actionButton}
                  />
                )}

                {orderStatus === "started" && (
                  <Button
                    title={t("arrived_at_pickup")}
                    onPress={() => setOrderStatus("picked")}
                    style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                  />
                )}

                {orderStatus === "picked" && (
                  <Button
                    title={t("start_delivery")}
                    onPress={() => setOrderStatus("transit")}
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                  />
                )}

                {orderStatus === "transit" && (
                  <Button
                    title={t("mark_delivered")}
                    onPress={() => setOrderStatus("delivered")}
                    style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                  />
                )}

                {orderStatus === "delivered" && (
                  <View style={styles.completedBox}>
                    <MaterialIcons name="check-circle" size={24} color={theme.colors.success} />
                    <Typography variant="body" weight="bold" color="success" style={{ marginLeft: 8 }}>
                      {t("mission_completed_success")}
                    </Typography>
                  </View>
                )}

                <View style={styles.supportActions}>
                  <TouchableOpacity
                    style={styles.supportButton}
                    onPress={() => navigation.navigate("Support")}
                  >
                    <MaterialIcons name="call" size={20} color={theme.colors.primary} />
                    <Typography variant="caption" weight="semiBold" style={{ marginLeft: 4 }}>{t("call_help")}</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.supportButton}
                    onPress={() => navigation.navigate("Support")}
                  >
                    <MaterialIcons name="message" size={20} color={theme.colors.primary} />
                    <Typography variant="caption" weight="semiBold" style={{ marginLeft: 4 }}>{t("messages")}</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    width: "100%",
    height: "100%",
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
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  headerStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    ...theme.shadows.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 20,
    ...theme.shadows.lg,
    overflow: "hidden",
  },
  sheetHandleContainer: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
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
    backgroundColor: theme.colors.border,
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
    height: 35,
    backgroundColor: theme.colors.border,
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
    borderRadius: 16,
    backgroundColor: theme.colors.background,
  },
  footer: {
    marginTop: 32,
    paddingBottom: 40,
  },
  actionButton: {
    borderRadius: 16,
    height: 56,
  },
  completedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${theme.colors.success}15`,
    padding: 16,
    borderRadius: 16,
  },
  supportActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  instructionsSection: {
    marginTop: 24,
  },
  instructionsBanner: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    overflow: "hidden",
  },
  instructionsAccent: {
    width: 4,
    backgroundColor: "#F59E0B",
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
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
});