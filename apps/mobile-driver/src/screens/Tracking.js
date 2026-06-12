/**
 * Tracking Screen
 * Visualizes the shipment journey timeline and allows drivers to update mission stages.
 * Integrates real-time GPS coordinates and reverse geocoding for accurate reporting.
 */

import React, { useState, useEffect } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { API_BASE_URL } from "../constants/config";

export default function Tracking({ route, navigation }) {
  const { t } = useTranslation();
  
  // Get mission context from navigation parameters
  const activeMission = route?.params?.order || {};
  // Normalize to lowercase to match database values exactly
  const orderType = (activeMission.orders?.order_type || "import").toLowerCase();
  const orderId = activeMission.orders?.order_reference || "N/A";
  
  // Safe IDs for database operations
  const assignmentId = activeMission.assignment_id || activeMission.id;
  const dbOrderId = activeMission.order_id || activeMission.orders?.order_id;

  console.log('--- TRACKING DIAGNOSTIC ---');
  console.log('Object Keys:', Object.keys(activeMission));
  console.log('Full Object:', JSON.stringify(activeMission, null, 2));

  const [locationPermission, setLocationPermission] = useState(null);
  const [stages, setStages] = useState([]);
  const [isLoadingStages, setIsLoadingStages] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Request location permissions and fetch dynamic stages on screen entry
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      fetchStages();
    })();
  }, []);

  /**
   * Fetches the dynamic journey milestones from the database.
   */
  const fetchStages = async () => {
    try {
      setIsLoadingStages(true);
      setFetchError(false);
      console.log(`Fetching stages for type: ${orderType}`);
      
      const response = await fetch(`${API_BASE_URL}/api/driver/tracking-stages/${orderType}`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        setStages(result.data);
      } else {
        console.warn("No stages found for this order type");
        setFetchError(true);
      }
    } catch (error) {
      console.error("Fetch Stages Error:", error);
      setFetchError(true);
    } finally {
      setIsLoadingStages(false);
    }
  };

  /**
   * Calculates the current progress index based on the status received from the backend.
   */
  const getInitialStep = () => {
    if (!activeMission.status || stages.length === 0) return 0;
    // Match against stage_name from database
    const index = stages.findIndex(s => s.stage_name === activeMission.status);
    return index === -1 ? 0 : index;
  };

  const [currentStep, setCurrentStep] = useState(0);

  // Update current step once stages are loaded
  useEffect(() => {
    if (stages.length > 0) {
      setCurrentStep(getInitialStep());
    }
  }, [stages]);
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Primary function to advance the mission stage.
   * Captures GPS location, reverse geocodes the address, and syncs with the backend.
   */
  const nextStep = async () => {
    if (currentStep < stages.length - 1) {
      // Re-check permissions in case they were changed in settings
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      if (currentStatus !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert("Permission Denied", "Location access is required to update status. Please enable it in your phone settings.");
          return;
        }
        setLocationPermission(true);
      }

      if (!assignmentId || !dbOrderId) {
        Alert.alert(
          "Data Sync Error", 
          `Missing IDs:\n- Assignment: ${assignmentId}\n- Order: ${dbOrderId}\n\nPlease check your console logs for 'Active Mission' details.`
        );
        return;
      }

      const nextIdx = currentStep + 1;
      const nextStageName = stages[nextIdx].stage_name;

      try {
        setIsUpdating(true);
        
        // 📍 Capture real-time GPS coordinates with a fallback for slow signals
        let location;
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 5000 // 5 seconds timeout
          });
        } catch (e) {
          // Fallback to last known position if real-time fix fails (common indoors)
          location = await Location.getLastKnownPositionAsync({});
          if (!location) throw new Error("Could not determine location");
        }

        const { latitude, longitude } = location.coords;

        // 🗺️ Convert coordinates to human-readable address name (e.g. "Colombo, Sri Lanka")
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        const locationName = geocode[0] ? `${geocode[0].city || geocode[0].region}, ${geocode[0].country}` : "Live Update";

        const payload = {
            assignmentId: assignmentId,
            orderId: dbOrderId,
            status: nextStageName,
            locationName: locationName, 
            latitude: latitude,
            longitude: longitude
        };

        // Push update to the central server
        const response = await fetch(`${API_BASE_URL}/api/driver/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
          setCurrentStep(nextIdx);
        } else {
          Alert.alert("Error", "Failed to update status on server");
        }
      } catch (error) {
        console.error("Update Status Error:", error);
        Alert.alert("Network Error", "Check your connection or GPS settings");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER: Displays Shipment ID and Back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Typography variant="subtitle" weight="bold">
            {t("shipment_tracking")}
          </Typography>
          <Typography variant="tiny" color="textMuted">
            ID: {orderId} • {t("assigned")}
          </Typography>
        </View>

        <TouchableOpacity style={styles.infoButton}>
          <MaterialIcons name="info-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PROGRESS OVERVIEW: Visual progress bar for overall journey */}
        <Card elevation="md" style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Typography variant="body" color="surface" weight="medium">
              {t("overall_progress")}
            </Typography>
            <Typography variant="body" color="surface" weight="bold">
              {stages.length > 0 ? Math.round(((currentStep + 1) / stages.length) * 100) : 0}%
            </Typography>
          </View>
          
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${stages.length > 0 ? ((currentStep + 1) / stages.length) * 100 : 0}%` }
              ]} 
            />
          </View>

          <View style={styles.statusBadge}>
            <MaterialIcons name="sync" size={14} color={theme.colors.surface} />
            <Typography variant="tiny" weight="bold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
              {t("syncing_with_gps")}
            </Typography>
          </View>
        </Card>

        {/* TIMELINE: Vertical list showing journey milestones */}
        <View style={styles.timelineContainer}>
          <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
            {t("journey_timeline")}
          </Typography>

          {isLoadingStages ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Typography variant="caption" style={{ marginTop: 12 }}>{t("loading_stages", "Loading journey...")}</Typography>
            </View>
          ) : fetchError ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
              <Typography variant="body" style={{ marginTop: 12, textAlign: 'center' }}>
                {t("failed_to_load_stages", "Failed to load journey timeline.")}
              </Typography>
              <TouchableOpacity 
                onPress={fetchStages} 
                style={{ marginTop: 16, backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8 }}
              >
                <Typography variant="button" color="surface">{t("retry", "Retry")}</Typography>
              </TouchableOpacity>
            </View>
          ) : (
            stages.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isLast = index === stages.length - 1;

            return (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  {/* Indicator Dot */}
                  <View style={[
                    styles.timelineDot,
                    isCompleted ? styles.dotCompleted : isActive ? styles.dotActive : styles.dotPending
                  ]}>
                    {isCompleted && <MaterialIcons name="check" size={12} color={theme.colors.surface} />}
                    {isActive && <View style={styles.dotInner} />}
                  </View>
                  {!isLast && (
                    <View style={[
                      styles.timelineLine,
                      isCompleted ? styles.lineCompleted : styles.linePending
                    ]} />
                  )}
                </View>

                <View style={styles.timelineRight}>
                  <Card 
                    elevation={isActive ? "md" : "sm"} 
                    style={[
                      styles.stepCard,
                      isActive && styles.activeStepCard
                    ]}
                  >
                    <View style={styles.stepHeader}>
                      <Typography 
                        variant="subtitle" 
                        weight="bold"
                        style={{ color: isActive ? theme.colors.primary : theme.colors.text }}
                      >
                        {/* Try to translate the stage name, fallback to raw name */}
                        {t(step.stage_name.toLowerCase().replace(/ /g, "_"), step.stage_name)}
                      </Typography>
                    </View>
                    
                    <Typography variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                      {isCompleted ? t("successfully_verified") : isActive ? t("current_stage_of_shipment") : t("upcoming_milestone")}
                    </Typography>

                    {isActive && (
                      <View style={styles.activeIndicator}>
                        <View style={styles.pulseDot} />
                        <Typography variant="tiny" weight="bold" color="primary">
                          {t("in_progress")}
                        </Typography>
                      </View>
                    )}
                  </Card>
                </View>
              </View>
            );
            })
          )}
        </View>

        {/* FOOTER ACTION: The primary button to update stage */}
        <View style={styles.footer}>
          <Button
            title={isLoadingStages ? t("loading") : isUpdating ? t("updating") : t("complete_current_stage")}
            onPress={nextStep}
            disabled={isLoadingStages || isUpdating || currentStep === stages.length - 1}
            style={styles.mainButton}
          />
          <Typography variant="tiny" color="textMuted" align="center" style={{ marginTop: 12 }}>
            {t("data_last_updated")}: <Typography variant="tiny" weight="bold">{t("minutes_ago", { count: 2 })}</Typography>
          </Typography>
        </View>

      </ScrollView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoButton: {
    padding: theme.spacing.xs,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  overviewCard: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
    marginBottom: theme.spacing.xl,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timelineContainer: {
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 100,
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  dotCompleted: {
    backgroundColor: theme.colors.success,
  },
  dotActive: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  dotPending: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: theme.colors.success,
  },
  linePending: {
    backgroundColor: theme.colors.border,
  },
  timelineRight: {
    flex: 1,
    marginLeft: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  stepCard: {
    padding: theme.spacing.md,
    borderRadius: theme.roundness.lg,
  },
  activeStepCard: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    backgroundColor: `${theme.colors.primary}10`,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginRight: 6,
  },
  footer: {
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  mainButton: {
    borderRadius: theme.roundness.lg,
  },
});