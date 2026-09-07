/**
 * History Screen
 * Displays a list of all completed or delivered trips for the driver.
 * Shows order references, routes, and completion timestamps.
 */

import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { API_BASE_URL } from "../constants/config";
import { authFetch } from "../utils/authFetch";

export default function History({ route, navigation }) {
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();
  const user = route?.params?.user || {};
  
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollContainer: {
      paddingHorizontal: activeTheme.spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: activeTheme.spacing.lg,
      paddingVertical: activeTheme.spacing.lg,
      backgroundColor: activeTheme.colors.surface,
      ...activeTheme.shadows.sm,
      marginBottom: activeTheme.spacing.md,
    },
    headerTitle: {
      marginLeft: activeTheme.spacing.sm,
    },
    card: {
      marginBottom: activeTheme.spacing.md,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    routeText: {
      marginTop: activeTheme.spacing.xs,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: activeTheme.spacing.sm,
    },
    statusText: {
      marginLeft: activeTheme.spacing.xs,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 100,
    }
  });

  const fetchHistory = async () => {
    try {
      const driverId = user.driver_id || user.emp_id;
      if (!driverId) {
        setIsLoading(false);
        return;
      }

      const response = await authFetch(`${API_BASE_URL}/api/driver/history/${driverId}`);
      const result = await response.json();

      if (result.success) {
        setTrips(result.data || []);
      }
    } catch (error) {
      console.error("Fetch History Error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === "delivered" || s === "completed") return activeTheme.colors.success;
    if (s === "in_transit" || s === "assigned") return activeTheme.colors.primary;
    return activeTheme.colors.warning;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>
          {t("trip_history")}
        </Typography>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activeTheme.colors.primary} />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.colors.primary]} />
          }
        >
          {trips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={64} color={activeTheme.colors.border} />
              <Typography variant="body" color="textMuted" style={{ marginTop: 16 }}>
                No completed trips found.
              </Typography>
            </View>
          ) : (
            trips.map((trip, index) => (
              <Card key={index} elevation="sm" style={styles.card}>
                <View style={styles.cardHeader}>
                  <Typography variant="h3">{trip.orders?.order_reference || "N/A"}</Typography>
                  <Typography variant="tiny" color="textMuted">
                    {formatDate(trip.assigned_at)}
                  </Typography>
                </View>
                
                <Typography variant="body" color="textMuted" style={styles.routeText}>
                  {trip.orders?.pickup_state}, {trip.orders?.pickup_country} → {trip.orders?.destination_state}, {trip.orders?.destination_country}
                </Typography>

                <View style={styles.statusRow}>
                  <MaterialIcons
                    name="local-shipping"
                    size={18}
                    color={getStatusColor(trip.status)}
                  />
                  <Typography 
                    variant="body" 
                    weight="semiBold" 
                    style={[styles.statusText, { color: getStatusColor(trip.status) }]}
                  >
                    {trip.status?.toUpperCase()}
                  </Typography>
                </View>
              </Card>
            ))
          )}
          <View style={{ height: activeTheme.spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

