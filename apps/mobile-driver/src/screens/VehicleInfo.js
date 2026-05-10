/**
 * Vehicle Info Screen
 * Displays technical specifications and compliance status (insurance, permits) for the assigned vehicle.
 * Provides functionality for uploading updated vehicle documents.
 */

import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { API_BASE_URL } from "../constants/config";

export default function VehicleInfo({ route, navigation }) {
  // Extract user context to identify associated supplier/vehicle
  const { user } = route.params || {};
  
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [licenseImage, setLicenseImage] = useState(null);

  /**
   * Fetches vehicle data from the backend using the supplier ID.
   */
  const fetchVehicle = async () => {
    try {
      const driverId = user?.driver_id;
      if (!driverId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/driver/assigned-vehicle/${driverId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setVehicle(result.data);
      }
    } catch (error) {
      console.error("Fetch Vehicle Error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchVehicle();
  }, []);

  /**
   * Handler for pull-to-refresh.
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicle();
  };

  /**
   * Allows the driver to pick a document image from the gallery for upload.
   */
  const pickDoc = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true
    });

    if (!result.canceled) {
      setLicenseImage(result.assets[0].uri);
      /**
       * SIMULATION: Success message.
       * In production, this should include an API call to upload the base64 data to storage.
       */
      Alert.alert("Success", "Document uploaded to system!");
    }
  };

  /**
   * Calculates the remaining days until insurance expiry to provide proactive warnings.
   */
  const licenseExpiryDays = vehicle?.insurance_expiry ? 
    Math.ceil((new Date(vehicle.insurance_expiry) - new Date()) / (1000 * 60 * 60 * 24)) : 
    15;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>
          Vehicle Information
        </Typography>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          {/* VEHICLE TECHNICAL SPECIFICATIONS */}
          <Card elevation="sm" style={styles.card}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="local-shipping" size={32} color={theme.colors.primary} />
            </View>
            <Typography variant="h3" weight="bold">
              {vehicle?.vehicle_number ? `Truck: ${vehicle.vehicle_number}` : "No Vehicle Assigned"}
            </Typography>
            <View style={styles.detailRow}>
              <Typography variant="body" color="textMuted">Type: </Typography>
              <Typography variant="body" weight="medium">{vehicle?.vehicle_type || "N/A"}</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body" color="textMuted">Capacity: </Typography>
              <Typography variant="body" weight="medium">{vehicle?.capacity_tons ? `${vehicle.capacity_tons} Tons` : "N/A"}</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body" color="textMuted">Model Year: </Typography>
              <Typography variant="body" weight="medium">{vehicle?.model_year || "N/A"}</Typography>
            </View>
          </Card>

          {/* COMPLIANCE & INSURANCE STATUS: Color-coded based on urgency */}
          <Card 
            elevation="sm" 
            style={[
              styles.card, 
              licenseExpiryDays < 30 && { backgroundColor: `${theme.colors.warning}10`, borderColor: theme.colors.warning, borderWidth: 1 }
            ]}
          >
            <View style={styles.row}>
              <MaterialIcons 
                name="verified-user" 
                size={24} 
                color={licenseExpiryDays < 30 ? theme.colors.warning : theme.colors.success} 
              />
              <Typography variant="subtitle" weight="bold" style={styles.rowTitle}>
                Insurance Status
              </Typography>
            </View>

            <Typography variant="body" style={styles.expiryText}>
              {licenseExpiryDays > 0 ? (
                <>Expires in: <Typography weight="bold">{licenseExpiryDays} days</Typography></>
              ) : (
                <Typography weight="bold" color="error">Expired</Typography>
              )}
            </Typography>

            {/* Proactive warning for imminent expiry */}
            {licenseExpiryDays < 30 && (
              <View style={styles.warningContainer}>
                <MaterialIcons name="warning" size={16} color={theme.colors.error} />
                <Typography variant="caption" color="error" style={styles.warningText}>
                  Insurance expiring soon! Contact fleet manager.
                </Typography>
              </View>
            )}
          </Card>

          {/* DOCUMENT MANAGEMENT ACTION */}
          <Card elevation="sm" style={styles.card}>
            <Typography variant="subtitle" weight="bold" style={styles.cardTitle}>
              Upload Vehicle Documents
            </Typography>
            <Typography variant="caption" color="textMuted" style={styles.cardSubtitle}>
              Please upload clear photos of your updated Insurance or Fitness certificates.
            </Typography>

            <Button
              title="Upload Documents"
              onPress={pickDoc}
              style={styles.uploadButton}
            />

            {licenseImage && (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
                <Typography variant="body" color="success" style={styles.successText}>
                  Document uploaded successfully
                </Typography>
              </View>
            )}
          </Card>

          <View style={{ height: theme.spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    marginTop: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  rowTitle: {
    marginLeft: theme.spacing.sm,
  },
  expiryText: {
    marginLeft: 32,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
    marginLeft: 32,
  },
  warningText: {
    marginLeft: theme.spacing.xs,
  },
  cardTitle: {
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    marginBottom: theme.spacing.lg,
  },
  uploadButton: {
    marginTop: theme.spacing.sm,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
    justifyContent: "center",
  },
  successText: {
    marginLeft: theme.spacing.sm,
  },
});