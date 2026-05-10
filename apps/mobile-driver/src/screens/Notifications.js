/**
 * Notifications Screen
 * Displays a feed of reported issues and system alerts relevant to the driver.
 * Includes tabbed filtering for 'All', 'Active', and 'Resolved' statuses.
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { API_BASE_URL } from "../constants/config";

export default function Notifications({ route, navigation }) {
  const { t } = useTranslation();
  
  // User context for fetching driver-specific issues
  const user = route?.params?.user || {};

  const [activeTab, setActiveTab] = useState("all");
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetches the list of reported issues from the backend.
   * Logic handles different identification keys (driver_id or emp_id).
   */
  const fetchIssues = useCallback(async () => {
    try {
      const driverId = user?.driver_id || user?.emp_id;
      if (!driverId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/driver/issues/${driverId}`);
      const result = await response.json();

      if (result.success) {
        setIssues(result.data || []);
      }
    } catch (error) {
      console.error("Fetch Issues Error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Initial load effect
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  /**
   * Pull-to-refresh handler.
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  /**
   * Maps issue types to specific Material Icons and associated colors.
   */
  const getIssueIcon = (type) => {
    switch (type) {
      case "vehicle_issue": return { name: "directions-car", color: "#EF4444" };
      case "delay_issue": return { name: "schedule", color: "#F59E0B" };
      case "document_issue": return { name: "description", color: "#6366F1" };
      default: return { name: "report-problem", color: "#64748B" };
    }
  };

  /**
   * Maps current status strings to semantic UI badge configurations.
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case "open": return { label: "Open", bg: "#FEF3C7", color: "#D97706" };
      case "escalated": return { label: "Escalated", bg: "#FEE2E2", color: "#DC2626" };
      case "resolved": return { label: "Resolved", bg: "#D1FAE5", color: "#059669" };
      default: return { label: status, bg: "#F1F5F9", color: "#64748B" };
    }
  };

  /**
   * Maps priority strings to colored dots for visual hierarchy.
   */
  const getPriorityDot = (priority) => {
    switch (priority) {
      case "high": return "#EF4444";
      case "medium": return "#F59E0B";
      case "low": return "#10B981";
      default: return "#94A3B8";
    }
  };

  /**
   * Formats raw snake_case database strings into user-friendly titles.
   */
  const formatIssueType = (type) => {
    if (!type) return "Issue";
    return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  /**
   * Utility to calculate a human-readable relative time string.
   */
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

  /**
   * Filters the main issues array based on the selected UI tab.
   */
  const filteredIssues = issues.filter((issue) => {
    if (activeTab === "all") return true;
    if (activeTab === "open") return issue.status === "open" || issue.status === "escalated";
    if (activeTab === "resolved") return issue.status === "resolved";
    return true;
  });

  /**
   * Renderer for individual list items.
   */
  const renderItem = ({ item }) => {
    const icon = getIssueIcon(item.issue_type);
    const statusBadge = getStatusBadge(item.status);
    const isUnresolved = item.status !== "resolved";

    return (
      <Card
        elevation={isUnresolved ? "md" : "sm"}
        style={[
          styles.notificationCard,
          isUnresolved && styles.unreadCard,
        ]}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
            <MaterialIcons name={icon.name} size={22} color={icon.color} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Typography variant="subtitle" weight="bold" style={isUnresolved && { color: theme.colors.text }}>
                  {formatIssueType(item.issue_type)}
                </Typography>
              </View>
              <Typography variant="tiny" color="textMuted">
                {getTimeAgo(item.created_at)}
              </Typography>
            </View>

            <Typography variant="body" color="textMuted" style={styles.message} numberOfLines={2}>
              {item.description}
            </Typography>

            {/* METADATA ROW: Order ID, Status Badge, and Priority */}
            <View style={styles.metaRow}>
              {item.orders?.order_reference && (
                <View style={styles.orderRefBadge}>
                  <MaterialIcons name="inventory-2" size={12} color={theme.colors.primary} />
                  <Typography variant="tiny" weight="semiBold" style={{ marginLeft: 4, color: theme.colors.primary }}>
                    {item.orders.order_reference}
                  </Typography>
                </View>
              )}

              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                <View style={[styles.statusDotSmall, { backgroundColor: statusBadge.color }]} />
                <Typography variant="tiny" weight="bold" style={{ color: statusBadge.color }}>
                  {statusBadge.label}
                </Typography>
              </View>

              <View style={styles.priorityIndicator}>
                <View style={[styles.priorityDotSmall, { backgroundColor: getPriorityDot(item.priority) }]} />
                <Typography variant="tiny" color="textMuted" weight="medium">
                  {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : ""}
                </Typography>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  /**
   * Configuration for the top filtering tabs.
   */
  const tabs = [
    { key: "all", label: t("all") },
    { key: "open", label: "Active" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* SCREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Typography variant="h3" weight="bold" style={styles.headerTitle}>
          {t("notifications")}
        </Typography>

        <TouchableOpacity onPress={onRefresh} activeOpacity={0.6}>
          <MaterialIcons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* FILTERING TABS SECTION */}
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
              style={{ color: activeTab === tab.key ? theme.colors.primary : theme.colors.textMuted }}
            >
              {tab.label}
            </Typography>
            {/* Badge for unresolved issues count */}
            {tab.key === "open" && issues.filter(i => i.status === "open" || i.status === "escalated").length > 0 && (
              <View style={styles.tabBadge}>
                <Typography variant="tiny" weight="bold" style={{ color: "white", fontSize: 10 }}>
                  {issues.filter(i => i.status === "open" || i.status === "escalated").length}
                </Typography>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* NOTIFICATION FEED */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Typography variant="caption" color="textMuted" style={{ marginTop: 12 }}>
            Loading issues...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredIssues}
          keyExtractor={(item) => item.issue_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="check-circle-outline" size={48} color={theme.colors.border} />
              </View>
              <Typography variant="body" weight="semiBold" style={{ marginTop: 16 }}>
                {activeTab === "resolved" ? "No resolved issues" : "No issues found"}
              </Typography>
              <Typography variant="caption" color="textMuted" style={{ marginTop: 4, textAlign: "center" }}>
                {activeTab === "open" ? "Great! You have no active issues." : "Issues reported by you or your team will appear here."}
              </Typography>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: theme.colors.background,
  },
  activeTab: {
    backgroundColor: `${theme.colors.primary}15`,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  tabBadge: {
    marginLeft: 6,
    backgroundColor: theme.colors.error,
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  notificationCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.lg,
    backgroundColor: theme.colors.surface,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
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
    marginRight: theme.spacing.md,
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
    backgroundColor: `${theme.colors.primary}10`,
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
    backgroundColor: `${theme.colors.border}30`,
    justifyContent: "center",
    alignItems: "center",
  },
});