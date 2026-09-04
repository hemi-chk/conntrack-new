/**
 * Dashboard Screen
 * The main landing page for the driver after login. 
 * Displays the current active mission, quick action buttons, and recent notifications.
 */

import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { useOrder } from "../context/OrderContext";
import { authFetch } from "../utils/authFetch";

const { width } = Dimensions.get("window");

export default function Dashboard({ route, navigation }) {
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();
  
  // Extract user data passed from Login or previous screen
  const user = route?.params?.user || {};
  
  const [activeMission, setActiveMission] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { orderStatus, setOrderStatus, registerTrackingMission } = useOrder();

  // Load mission data on component mount
  useEffect(() => {
    fetchActiveMission();
    fetchRecentIssues();
    const notificationPoll = setInterval(checkForNewAssignments, 15000);

    const handleBackPress = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard", params: { user } }],
      });
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => {
      subscription.remove();
      clearInterval(notificationPoll);
    };
  }, []);

  const checkForNewAssignments = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/driver/notifications`);
      const result = await response.json();
      if (!response.ok || !result.success) return;
    } catch (error) {
      console.error("Dashboard: Notification Poll Error:", error);
    }
  };

  /**
   * Fetches the current active assignment for the driver from the backend.
   * If a mission exists, it is displayed in the primary card.
   */
  const fetchActiveMission = async () => {
    try {
      setIsLoading(true);

      if (!user?.driver_id && !user?.emp_id) {
        setIsLoading(false);
        return;
      }

      const idToUse = user.driver_id || user.emp_id;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await authFetch(`${API_BASE_URL}/api/driver/mission/${idToUse}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.success && result.data) {
        setActiveMission(result.data);
        registerTrackingMission(result.data);
        if (result.data.status) {
          setOrderStatus(result.data.status.toLowerCase());
        }
      }
    } catch (error) {
      console.error("Dashboard: Fetch Mission Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches the 3 most recent issues/updates for this driver.
   */
  const fetchRecentIssues = async () => {
    try {
      const idToUse = user.driver_id || user.emp_id;
      if (!idToUse) return;

      const response = await authFetch(`${API_BASE_URL}/api/driver/issues/${idToUse}`);
      const result = await response.json();
      
      if (result.success) {
        // Only show top 3 for the dashboard preview
        setRecentIssues(result.data.slice(0, 3));
      }
    } catch (error) {
      console.error("Dashboard: Fetch Issues Error:", error);
    }
  };

  /**
   * Quick status update directly from the Dashboard.
   */
  const syncStatusWithDb = async (nextStatus) => {
    const assignmentId = activeMission.assignment_id || activeMission.id;
    const dbOrderId = activeMission.order_id || activeMission.orders?.order_id;

    if (!assignmentId || !dbOrderId) return;

    try {
      setIsUpdating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location is required to update status.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      const locationName = geocode[0] ? `${geocode[0].city || geocode[0].region}, ${geocode[0].country}` : "Live Update";

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
        // Refresh mission data to show new status
        fetchActiveMission();
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Maps issue types to specific UI icons and colors for the dashboard feed.
   */
  const getIssueUI = (type) => {
    switch (type) {
      case "vehicle_issue": return { icon: "directions-car", color: "#EF4444" };
      case "delay_issue": return { icon: "schedule", color: "#F59E0B" };
      case "document_issue": return { icon: "description", color: "#6366F1" };
      default: return { icon: "report-problem", color: "#64748B" };
    }
  };

  /**
   * Formats database time to relative human-readable string.
   */
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) return t("just_now");
    if (diffHrs < 24) return `${diffHrs}${t("h_ago")}`;
    return date.toLocaleDateString();
  };

  /**
   * Configuration for the 2x2 grid of action buttons.
   */
  const quickActions = [
    { 
      icon: "local-shipping", 
      label: t("tracking"), 
      onPress: () => navigation.navigate("Tracking", { order: activeMission }),
      color: "#6366F1" 
    },
    { 
      icon: "notifications-active", 
      label: t("alerts"), 
      onPress: () => navigation.navigate("Notifications", { user }),
      color: "#F59E0B" 
    },
    { 
      icon: "description", 
      label: t("docs"), 
      onPress: () => navigation.navigate("Documents", { order: activeMission, user: user }),
      color: "#10B981" 
    },
    { 
      icon: "support-agent", 
      label: t("help"), 
      onPress: () => navigation.navigate("Support", { user, order: activeMission }),
      color: "#EC4899" 
    },
  ];

  /**
   * Utility to map alert types to theme colors.
   */
  const getColor = (type) => {
    if (type === "success") return activeTheme.colors.success;
    if (type === "warning") return activeTheme.colors.warning;
    return activeTheme.colors.secondary;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: activeTheme.spacing.lg,
      paddingTop: activeTheme.spacing.md,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: activeTheme.spacing.xl,
    },
    profileIconContainer: {
      backgroundColor: activeTheme.colors.surface,
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
      ...activeTheme.shadows.md,
      position: "relative",
    },
    onlineBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 13,
      height: 13,
      borderRadius: 6.5,
      backgroundColor: activeTheme.colors.success,
      borderWidth: 2,
      borderColor: activeTheme.colors.surface,
    },
    sectionTitle: {
      marginBottom: activeTheme.spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: activeTheme.spacing.md,
      marginTop: activeTheme.spacing.lg,
    },
    currentJobCard: {
      backgroundColor: activeTheme.colors.primary,
      marginBottom: activeTheme.spacing.xl,
      padding: activeTheme.spacing.lg,
      borderRadius: activeTheme.roundness.xl,
      borderWidth: 0,
    },
    jobHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: activeTheme.spacing.lg,
    },
    jobRouteContainer: {
      flexDirection: "row",
      marginBottom: activeTheme.spacing.lg,
      paddingLeft: 4,
    },
    routeIconColumn: {
      alignItems: "center",
      marginRight: activeTheme.spacing.md,
      paddingVertical: 6,
    },
    routeDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 2,
      borderColor: activeTheme.colors.primary,
    },
    routeLine: {
      width: 2,
      height: 34,
      backgroundColor: "rgba(255, 255, 255, 0.35)",
      marginVertical: 4,
    },
    routeTextColumn: {
      justifyContent: "space-between",
      flex: 1,
    },
    viewDetailsButton: {
      backgroundColor: activeTheme.colors.surface,
      borderRadius: activeTheme.roundness.lg,
    },
    viewDetailsButtonText: {
      color: activeTheme.colors.primary,
    },
    jobActionRow: {
      marginTop: 6,
    },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    quickActionItem: {
      width: "48%",
      marginBottom: activeTheme.spacing.md,
    },
    quickActionIconContainer: {
      padding: activeTheme.spacing.md,
      alignItems: "center",
      borderRadius: activeTheme.roundness.lg,
    },
    iconBg: {
      width: 54,
      height: 54,
      borderRadius: 27,
      justifyContent: "center",
      alignItems: "center",
    },
    alertCard: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: activeTheme.spacing.sm,
      padding: activeTheme.spacing.md,
      borderRadius: activeTheme.roundness.md,
    },
    alertIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: activeTheme.spacing.sm + 4,
    },
    alertTextContainer: {
      flex: 1,
      marginRight: activeTheme.spacing.sm,
    },
    noJobCard: {
      alignItems: "center",
      justifyContent: "center",
      padding: activeTheme.spacing.xl,
      marginBottom: activeTheme.spacing.xl,
      borderRadius: activeTheme.roundness.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Typography variant="h2" weight="bold">
              {t("welcome")} 👋
            </Typography>
            <Typography variant="body" color="textMuted">
              {t("everything_looks_good")}
            </Typography>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Profile", { user })}
            style={styles.profileIconContainer}
          >
            {user?.profile_photo_url ? (
              <Image 
                source={{ uri: user.profile_photo_url }} 
                style={{ width: 42, height: 42, borderRadius: 21 }}
              />
            ) : (
              <MaterialIcons name="person" size={28} color={activeTheme.colors.primary} />
            )}
            <View style={styles.onlineBadge} />
          </TouchableOpacity>
        </View>

        <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
          {t("active_mission")}
        </Typography>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={activeTheme.colors.primary} style={{ marginVertical: 20 }} />
        ) : activeMission ? (
          <Card elevation="lg" bordered={false} style={styles.currentJobCard}>
            <View style={styles.jobHeader}>
              <Badge
                label={activeMission.orders?.order_type?.toUpperCase() || t("in_progress")}
                variant="accent"
                showDot={true}
              />
              <Typography variant="body" weight="bold" style={{ color: activeTheme.colors.surface }}>
                {activeMission.orders?.order_reference || "N/A"}
              </Typography>
            </View>

            <View style={styles.jobRouteContainer}>
              <View style={styles.routeIconColumn}>
                <View style={styles.routeDot} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, { backgroundColor: activeTheme.colors.accent, borderColor: activeTheme.colors.accent }]} />
              </View>
              <View style={styles.routeTextColumn}>
                <Typography variant="subtitle" weight="semiBold" style={{ color: activeTheme.colors.surface }}>
                  {activeMission.orders?.origin_name || t("freezone_warehouse")}
                </Typography>
                <Typography variant="subtitle" weight="semiBold" style={{ color: activeTheme.colors.surface, marginTop: 22 }}>
                  {activeMission.orders?.destination_name || t("colombo_port_terminal")}
                </Typography>
              </View>
            </View>

            <View style={styles.jobActionRow}>
              <Button
                title={t("view_details")}
                variant="secondary"
                icon="arrow-forward"
                iconPosition="right"
                style={styles.viewDetailsButton}
                textStyle={styles.viewDetailsButtonText}
                onPress={() => navigation.navigate("OrderDetails", { order: activeMission, user })}
              />
            </View>
          </Card>
        ) : (
          <Card elevation="sm" style={styles.noJobCard}>
            <MaterialIcons name="event-busy" size={36} color={activeTheme.colors.textMuted} />
            <Typography variant="body" color="textMuted" style={{ marginTop: 8 }}>
              {t("no_active_mission")}
            </Typography>
          </Card>
        )}

        <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
          {t("quick_actions")}
        </Typography>

        <View style={styles.quickActionsGrid}>
          {quickActions.map((item, index) => (
            <View key={index} style={styles.quickActionItem}>
              <Card
                elevation="sm"
                onPress={item.onPress ? item.onPress : () => navigation.navigate(item.screen)}
                style={styles.quickActionIconContainer}
              >
                <View style={[styles.iconBg, { backgroundColor: `${item.color}15` }]}>
                  <MaterialIcons
                    name={item.icon}
                    size={28}
                    color={item.color}
                  />
                </View>
                <Typography variant="caption" weight="medium" style={{ marginTop: 10 }}>
                  {item.label}
                </Typography>
              </Card>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Typography variant="subtitle" weight="bold">
            {t("recent_updates")}
          </Typography>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications", { user })}>
            <Typography variant="caption" color="primary" weight="semiBold">
              {t("see_all")}
            </Typography>
          </TouchableOpacity>
        </View>

        {recentIssues.length > 0 ? (
          recentIssues.map((issue) => {
            const ui = getIssueUI(issue.issue_type);
            return (
              <Card key={issue.issue_id} elevation="sm" style={styles.alertCard}>
                <View style={[styles.alertIconContainer, { backgroundColor: `${ui.color}15` }]}>
                  <MaterialIcons
                    name={ui.icon}
                    size={22}
                    color={ui.color}
                  />
                </View>

                <View style={styles.alertTextContainer}>
                  <Typography variant="body" weight="medium" numberOfLines={1}>
                    {issue.description}
                  </Typography>
                  <Typography variant="tiny" color="textMuted">
                    {formatTime(issue.created_at)}
                  </Typography>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={activeTheme.colors.border} />
              </Card>
            );
          })
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Typography variant="caption" color="textMuted">
              {t("no_recent_updates")}
            </Typography>
          </View>
        )}

        <View style={{ height: activeTheme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
