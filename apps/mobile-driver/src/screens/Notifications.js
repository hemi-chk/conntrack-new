import React, { useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";

export default function Notifications({ navigation }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([
    { id: 1, title: t("new_order_assigned_title"), message: t("new_order_assigned_msg", { id: "IMP-12345", location: t("freezone_warehouse") }), read: false, time: "2m ago", type: "order" },
    { id: 2, title: t("doc_approved_title"), message: t("doc_approved_msg"), read: false, time: "1h ago", type: "system" },
    { id: 3, title: t("system_update_title"), message: t("system_update_msg"), read: true, time: t("yesterday"), type: "update" },
    { id: 4, title: t("payment_received_title"), message: t("payment_received_msg"), read: true, time: "2 days ago", type: "payment" },
  ]);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const getIcon = (type) => {
    switch(type) {
      case "order": return { name: "local-shipping", color: "#6366F1" };
      case "system": return { name: "verified-user", color: "#10B981" };
      case "payment": return { name: "payments", color: "#F59E0B" };
      default: return { name: "notifications", color: "#64748B" };
    }
  };

  const renderItem = ({ item }) => {
    const icon = getIcon(item.type);
    
    return (
      <Card 
        elevation={item.read ? "sm" : "md"} 
        style={[
          styles.notificationCard, 
          !item.read && styles.unreadCard
        ]}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
            <MaterialIcons name={icon.name} size={22} color={icon.color} />
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.cardHeader}>
              <Typography variant="subtitle" weight="bold" style={!item.read && { color: theme.colors.primary }}>
                {item.title}
              </Typography>
              <Typography variant="tiny" color="textMuted">
                {item.time}
              </Typography>
            </View>
            
            <Typography variant="body" color="textMuted" style={styles.message}>
              {item.message}
            </Typography>
            
            {!item.read && <View style={styles.unreadIndicator} />}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
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

        <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.6}>
          <Typography variant="body" color="primary" weight="semiBold">
            {t("clear_all")}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* TABS (Visual only) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Typography variant="caption" weight="bold" style={{ color: theme.colors.primary }}>{t("all")}</Typography>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Typography variant="caption" weight="bold" color="textMuted">{t("unread")}</Typography>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Typography variant="caption" weight="bold" color="textMuted">{t("system")}</Typography>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={64} color={theme.colors.border} />
            <Typography variant="body" color="textMuted" style={{ marginTop: theme.spacing.md }}>
              {t("no_notifications")}
            </Typography>
          </View>
        }
      />
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
  },
  unreadIndicator: {
    position: "absolute",
    top: 4,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 120,
  }
});