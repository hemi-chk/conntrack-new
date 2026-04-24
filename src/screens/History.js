import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";

export default function History({ navigation }) {
  const { t } = useTranslation();

  const trips = [
    { id: "IMP-10234", route: t("colombo_freezone"), status: t("delivered") },
    { id: "EXP-77889", route: t("port_warehouse"), status: t("completed") },
    { id: "IMP-55678", route: t("airport_colombo_port"), status: t("in_transit") },
    { id: "EXP-99821", route: t("boi_export_port"), status: t("delivered") },
  ];

  const getStatusColor = (status) => {
    if (status === t("delivered") || status === t("completed")) return theme.colors.success;
    if (status === t("in_transit")) return theme.colors.primary;
    return theme.colors.warning;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>
            {t("trip_history")}
          </Typography>
        </View>

        {trips.map((trip, index) => (
          <Card key={index} elevation="sm" style={styles.card}>
            <Typography variant="h3">{trip.id}</Typography>
            
            <Typography variant="body" color="textMuted" style={styles.routeText}>
              {trip.route}
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
                {trip.status}
              </Typography>
            </View>
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
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  routeText: {
    marginTop: theme.spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  statusText: {
    marginLeft: theme.spacing.xs,
  }
});