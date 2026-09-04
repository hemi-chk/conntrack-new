/**
 * Notifications Screen
 * Displays a feed of reported issues and system alerts relevant to the driver.
 * Includes tabbed filtering for 'All', 'Active', and 'Resolved' statuses.
 */

import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { authFetch } from "../utils/authFetch";

export default function Notifications({ route, navigation }) {
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();
  const user = route?.params?.user || {};

  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: activeTheme.spacing.lg,
      paddingVertical: activeTheme.spacing.md,
      backgroundColor: activeTheme.colors.surface,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      flex: 1,
      marginLeft: activeTheme.spacing.md,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: activeTheme.colors.surface,
      paddingHorizontal: activeTheme.spacing.lg,
      paddingBottom: activeTheme.spacing.md,
      ...activeTheme.shadows.sm,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: activeTheme.colors.background,
    },
    activeTab: {
      backgroundColor: `${activeTheme.colors.primary}15`,
      borderWidth: 1,
      borderColor: activeTheme.colors.primary,
    },
    tabBadge: {
      marginLeft: 6,
      backgroundColor: activeTheme.colors.error,
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      paddingHorizontal: activeTheme.spacing.lg,
      paddingTop: activeTheme.spacing.lg,
      paddingBottom: activeTheme.spacing.xl,
    },
    notificationCard: {
      marginBottom: activeTheme.spacing.md,
      padding: activeTheme.spacing.md,
      borderRadius: activeTheme.roundness.lg,
      backgroundColor: activeTheme.colors.surface,
    },
    unreadCard: {
      borderLeftWidth: 4,
      borderLeftColor: activeTheme.colors.primary,
    },
    cardContent: {
      flexDirection: "row",
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: activeTheme.spacing.md,
    },
    textContainer: {
      flex: 1,
      position: "relative",
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    message: {
      lineHeight: 18,
      marginBottom: 10,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    orderRefBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${activeTheme.colors.primary}10`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusDotSmall: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 5,
    },
    priorityIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },
    priorityDotSmall: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 100,
      paddingHorizontal: 32,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${activeTheme.colors.border}30`,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  const fetchNotifications = useCallback(async () => {
    try {
      if (!user?.driver_id && !user?.emp_id) {
        setIsLoading(false);
        return;
      }

      const response = await authFetch(`${API_BASE_URL}/api/driver/notifications`);
      const result = await response.json();

      if (!response.ok || !result.success) throw new Error(result.message || "Could not load notifications");
      setNotifications(result.data || []);
    } catch (error) {
      console.error("Fetch Notifications Error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const notificationPoll = setInterval(fetchNotifications, 15000);

    return () => clearInterval(notificationPoll);
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "driver_assigned": return { name: "local-shipping", color: activeTheme.colors.primary };
      case "document": return { name: "description", color: "#6366F1" };
      case "system": return { name: "info-outline", color: "#0EA5E9" };
      default: return { name: "notifications-none", color: "#64748B" };
    }
  };

  const formatType = (type) => {
    if (!type) return t("notifications");
    return type.replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase());
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.is_read;
    return true;
  });

  const renderItem = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    const isUnread = !item.is_read;

    return (
      <Card
        elevation={isUnread ? "md" : "sm"}
        style={[
          styles.notificationCard,
          isUnread && styles.unreadCard,
        ]}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
            <MaterialIcons name={icon.name} size={22} color={icon.color} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Typography variant="subtitle" weight="bold">
                  {item.title || formatType(item.type)}
                </Typography>
              </View>
              <Typography variant="tiny" color="textMuted">
                {getTimeAgo(item.created_at)}
              </Typography>
            </View>

            <Typography variant="body" color="textMuted" style={styles.message} numberOfLines={2}>
              {item.message || t("no_notifications")}
            </Typography>

            <View style={styles.metaRow}>
              {item.orders?.order_reference && (
                <View style={styles.orderRefBadge}>
                  <MaterialIcons name="inventory-2" size={12} color={activeTheme.colors.primary} />
                  <Typography variant="tiny" weight="semiBold" style={{ marginLeft: 4, color: activeTheme.colors.primary }}>
                    {item.orders.order_reference}
                  </Typography>
                </View>
              )}

              <View style={[styles.statusBadge, { backgroundColor: `${icon.color}15` }]}>
                <View style={[styles.statusDotSmall, { backgroundColor: icon.color }]} />
                <Typography variant="tiny" weight="bold" style={{ color: icon.color }}>
                  {formatType(item.type)}
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const tabs = [
    { key: "all", label: t("all") },
    { key: "unread", label: t("unread") },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
        </TouchableOpacity>

        <Typography variant="h3" weight="bold" style={styles.headerTitle}>
          {t("notifications")}
        </Typography>

        <TouchableOpacity onPress={onRefresh} activeOpacity={0.6}>
          <MaterialIcons name="refresh" size={22} color={activeTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Typography
              variant="caption"
              weight="bold"
              style={{ color: activeTab === tab.key ? activeTheme.colors.primary : activeTheme.colors.textMuted }}
            >
              {tab.label}
            </Typography>
            {tab.key === "unread" && notifications.filter(notification => !notification.is_read).length > 0 && (
              <View style={styles.tabBadge}>
                <Typography variant="tiny" weight="bold" style={{ color: "white", fontSize: 10 }}>
                  {notifications.filter(notification => !notification.is_read).length}
                </Typography>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* NOTIFICATION FEED */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activeTheme.colors.primary} />
          <Typography variant="caption" color="textMuted" style={{ marginTop: 12 }}>
            Loading notifications...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="check-circle-outline" size={48} color={activeTheme.colors.border} />
              </View>
              <Typography variant="body" weight="semiBold" style={{ marginTop: 16 }}>
                {activeTab === "unread" ? "No unread notifications" : t("no_notifications")}
              </Typography>
              <Typography variant="caption" color="textMuted" style={{ marginTop: 4, textAlign: "center" }}>
                {activeTab === "unread" ? "You are all caught up." : "Updates from your assignments and logistics team will appear here."}
              </Typography>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

