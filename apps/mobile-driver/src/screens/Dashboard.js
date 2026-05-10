/**
 * Dashboard Screen
 * The main landing page for the driver after login. 
 * Displays the current active mission, quick action buttons, and recent notifications.
 */

import { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { theme } from "../constants/theme";
import { API_BASE_URL } from "../constants/config";

const { width } = Dimensions.get("window");

export default function Dashboard({ route, navigation }) {
  const { t } = useTranslation();
  
  // Extract user data passed from Login or previous screen
  const user = route?.params?.user || {};
  
  const [activeMission, setActiveMission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load mission data on component mount
  useEffect(() => {
    fetchActiveMission();
  }, []);

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
      
      // Implement AbortController to handle potential slow network timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/api/driver/mission/${idToUse}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (result.success && result.data) {
        setActiveMission(result.data);
      }
    } catch (error) {
      console.error("Dashboard: Fetch Mission Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mock alerts for demonstration purposes.
   * In production, these should be fetched from a notifications API.
   */
  const alerts = [
    {
      id: 1,
      text: t("new_delivery_assigned"),
      type: "info",
      icon: "local-shipping",
      time: t("10:30 AM")
    },
    {
      id: 2,
      text: t("docs_verified_success"),
      type: "success",
      icon: "check-circle",
      time: t("yesterday")
    }
  ];

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
      onPress: () => navigation.navigate("Support", { user }),
      color: "#EC4899" 
    },
  ];

  /**
   * Utility to map alert types to theme colors.
   */
  const getColor = (type) => {
    if (type === "success") return theme.colors.success;
    if (type === "warning") return theme.colors.warning;
    return theme.colors.secondary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER SECTION: Welcome message and Profile link */}
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
                style={{ width: 40, height: 40, borderRadius: 20 }} 
              />
            ) : (
              <MaterialIcons name="person" size={26} color={theme.colors.primary} />
            )}
            <View style={styles.onlineBadge} />
          </TouchableOpacity>
        </View>

        {/* ACTIVE MISSION SECTION: Highlights the primary current task */}
        <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
          {t("active_mission")}
        </Typography>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
        ) : activeMission ? (
          <Card elevation="lg" style={styles.currentJobCard}>
            <View style={styles.jobHeader}>
              <View style={styles.jobBadge}>
                <Typography variant="tiny" weight="bold" style={{ color: theme.colors.surface }}>
                  {activeMission.orders?.order_type?.toUpperCase() || t("in_progress")}
                </Typography>
              </View>
              <Typography variant="body" weight="bold" style={{ color: theme.colors.surface }}>
                {activeMission.orders?.order_reference || "N/A"}
              </Typography>
            </View>

            <View style={styles.jobRouteContainer}>
              <View style={styles.routeIconColumn}>
                <View style={styles.routeDot} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, { backgroundColor: theme.colors.accent }]} />
              </View>
              <View style={styles.routeTextColumn}>
                <Typography variant="subtitle" weight="semiBold" style={{ color: theme.colors.surface }}>
                  {activeMission.orders?.origin_name || t("freezone_warehouse")}
                </Typography>
                <Typography variant="subtitle" weight="semiBold" style={{ color: theme.colors.surface, marginTop: 20 }}>
                  {activeMission.orders?.destination_name || t("colombo_port_terminal")}
                </Typography>
              </View>
            </View>

            <Button
              title={t("view_details")}
              variant="secondary"
              style={styles.viewDetailsButton}
              textStyle={styles.viewDetailsButtonText}
              onPress={() => navigation.navigate("OrderDetails", { order: activeMission })}
            />
          </Card>
        ) : (
          <Card elevation="sm" style={styles.noJobCard}>
            <MaterialIcons name="event-busy" size={32} color={theme.colors.textMuted} />
            <Typography variant="body" color="textMuted" style={{ marginTop: 8 }}>
              {t("no_active_mission")}
            </Typography>
          </Card>
        )}

        {/* QUICK ACTIONS GRID */}
        <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
          {t("quick_actions")}
        </Typography>

        <View style={styles.quickActionsGrid}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => item.onPress ? item.onPress() : navigation.navigate(item.screen)}
              style={styles.quickActionItem}
            >
              <Card elevation="md" style={styles.quickActionIconContainer}>
                <View style={[styles.iconBg, { backgroundColor: `${item.color}15` }]}>
                  <MaterialIcons
                    name={item.icon}
                    size={28}
                    color={item.color}
                  />
                </View>
                <Typography variant="caption" weight="medium" style={{ marginTop: 8 }}>
                  {item.label}
                </Typography>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT UPDATES SECTION: Feed-like view for recent events */}
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

        {alerts.map((alert) => (
          <Card key={alert.id} elevation="sm" style={styles.alertCard}>
            <View style={[styles.alertIconContainer, { backgroundColor: `${getColor(alert.type)}15` }]}>
              <MaterialIcons
                name={alert.icon}
                size={22}
                color={getColor(alert.type)}
              />
            </View>

            <View style={styles.alertTextContainer}>
              <Typography variant="body" weight="medium">
                {alert.text}
              </Typography>
              <Typography variant="tiny" color="textMuted">
                {alert.time}
              </Typography>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.border} />
          </Card>
        ))}

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  profileIconContainer: {
    backgroundColor: theme.colors.surface,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
    position: "relative",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  currentJobCard: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  jobBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.roundness.sm,
  },
  jobRouteContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.lg,
    paddingLeft: 4,
  },
  routeIconColumn: {
    alignItems: "center",
    marginRight: theme.spacing.md,
    paddingVertical: 6,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginVertical: 4,
  },
  routeTextColumn: {
    justifyContent: "space-between",
  },
  viewDetailsButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
  },
  viewDetailsButtonText: {
    color: theme.colors.primary,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: "48%",
    marginBottom: theme.spacing.md,
  },
  quickActionIconContainer: {
    padding: theme.spacing.md,
    alignItems: "center",
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  alertTextContainer: {
    flex: 1,
  },
  noJobCard: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
  },
});