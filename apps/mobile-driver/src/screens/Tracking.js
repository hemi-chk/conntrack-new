/**
 * Tracking Screen
 * Visualizes the shipment journey timeline and allows drivers to update mission stages.
 * Integrates real-time GPS coordinates and reverse geocoding for accurate reporting.
 */

import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { useOrder } from "../context/OrderContext";
import { authFetch } from "../utils/authFetch";

export default function Tracking({ route, navigation }) {
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();
  
  const activeMission = route?.params?.order || {};
  const rawOrderType = activeMission.orders?.order_type || activeMission.order_type || "import";
  const orderType = String(rawOrderType).trim().toLowerCase() === "export" ? "export" : "import";
  const orderId = activeMission.orders?.order_reference || "N/A";
  
  const assignmentId = activeMission.assignment_id || activeMission.id;
  const dbOrderId = activeMission.order_id || activeMission.orders?.order_id;
  const { isTracking, lastLocationUpdate, setOrderStatus } = useOrder();

  const [stages, setStages] = useState([]);
  const [isLoadingStages, setIsLoadingStages] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: activeTheme.spacing.lg,
      paddingVertical: activeTheme.spacing.md,
      backgroundColor: activeTheme.colors.surface,
      ...activeTheme.shadows.sm,
    },
    backButton: {
      padding: activeTheme.spacing.xs,
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: activeTheme.spacing.md,
    },
    infoButton: {
      padding: activeTheme.spacing.xs,
    },
    scrollContent: {
      padding: activeTheme.spacing.lg,
    },
    overviewCard: {
      backgroundColor: activeTheme.colors.primary,
      padding: activeTheme.spacing.lg,
      borderRadius: activeTheme.roundness.xl,
      marginBottom: activeTheme.spacing.xl,
    },
    overviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: activeTheme.spacing.md,
    },
    progressTrack: {
      height: 8,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 4,
      marginBottom: activeTheme.spacing.md,
    },
    progressFill: {
      height: "100%",
      backgroundColor: activeTheme.colors.accent,
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
      marginTop: activeTheme.spacing.sm,
    },
    sectionTitle: {
      marginBottom: activeTheme.spacing.lg,
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
      backgroundColor: activeTheme.colors.success,
    },
    dotActive: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 2,
      borderColor: activeTheme.colors.primary,
    },
    dotInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: activeTheme.colors.primary,
    },
    dotPending: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 2,
      borderColor: activeTheme.colors.border,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginVertical: 4,
    },
    lineCompleted: {
      backgroundColor: activeTheme.colors.success,
    },
    linePending: {
      backgroundColor: activeTheme.colors.border,
    },
    timelineRight: {
      flex: 1,
      marginLeft: activeTheme.spacing.md,
      paddingBottom: activeTheme.spacing.lg,
    },
    stepCard: {
      padding: activeTheme.spacing.md,
      borderRadius: activeTheme.roundness.lg,
    },
    activeStepCard: {
      borderColor: activeTheme.colors.primary,
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
      marginTop: activeTheme.spacing.sm,
      backgroundColor: `${activeTheme.colors.primary}10`,
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: activeTheme.colors.primary,
      marginRight: 6,
    },
    footer: {
      marginTop: activeTheme.spacing.lg,
      paddingBottom: activeTheme.spacing.xl,
    },
    mainButton: {
      borderRadius: activeTheme.roundness.lg,
    },
  });

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
      fetchStages();
    })();
  }, []);

  const fetchStages = async () => {
    try {
      setIsLoadingStages(true);
      setFetchError(false);
      
      const response = await authFetch(`${API_BASE_URL}/api/driver/tracking-stages/${orderType}`);
      const result = await response.json();
      
      const matchingStages = (result.data || [])
        .filter((stage) => String(stage.order_type || "").trim().toLowerCase() === orderType)
        .sort((firstStage, secondStage) => firstStage.sequence_order - secondStage.sequence_order);

      if (result.success && matchingStages.length > 0) {
        setStages(matchingStages);
      } else {
        setFetchError(true);
      }
    } catch (error) {
      console.error("Fetch Stages Error:", error);
      setFetchError(true);
    } finally {
      setIsLoadingStages(false);
    }
  };

  const getInitialStep = () => {
    if (!activeMission.status || stages.length === 0) return 0;
    const currentStatus = String(activeMission.status || "").trim().toLowerCase();
    const index = stages.findIndex(
      (stage) => String(stage.stage_name || "").trim().toLowerCase() === currentStatus,
    );
    return index === -1 ? 0 : index;
  };

  useEffect(() => {
    if (stages.length > 0) {
      setCurrentStep(getInitialStep());
    }
  }, [stages]);

  const nextStep = async () => {
    if (currentStep < stages.length - 1) {
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      if (currentStatus !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert("Permission Denied", "Location access is required to update status. Please enable it in your phone settings.");
          return;
        }
      }

      if (!assignmentId || !dbOrderId) {
        Alert.alert(
          "Data Sync Error", 
          `Missing IDs:\n- Assignment: ${assignmentId}\n- Order: ${dbOrderId}`
        );
        return;
      }

      const nextIdx = currentStep + 1;
      const nextStageName = stages[nextIdx].stage_name;

      try {
        setIsUpdating(true);
        
        let location;
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 5000
          });
        } catch (e) {
          location = await Location.getLastKnownPositionAsync({});
          if (!location) throw new Error("Could not determine location");
        }

        const { latitude, longitude } = location.coords;

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

        const response = await authFetch(`${API_BASE_URL}/api/driver/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
          setCurrentStep(nextIdx);
          setOrderStatus(nextStageName);
          navigation.navigate("Map", {
            order: { ...activeMission, status: nextStageName },
            autoStartNavigation: true,
          });
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
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Typography variant="subtitle" weight="bold">
            {t("shipment_tracking")}
          </Typography>
          <Typography variant="tiny" color="textMuted">
            ID: {orderId} • {t("assigned")}
          </Typography>
        </View>

        <TouchableOpacity style={styles.infoButton}>
          <MaterialIcons name="info-outline" size={24} color={activeTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Card elevation="md" style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Typography variant="body" style={{ color: "#FFFFFF" }} weight="medium">
              {t("overall_progress")}
            </Typography>
            <Typography variant="body" style={{ color: "#FFFFFF" }} weight="bold">
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
            <MaterialIcons name="sync" size={14} color="#FFFFFF" />
            <Typography variant="tiny" weight="bold" style={{ color: "#FFFFFF", marginLeft: 4 }}>
              {isTracking ? t("syncing_with_gps") : t("waiting_for_gps", "Waiting for GPS")}
            </Typography>
          </View>
        </Card>

        <View style={styles.timelineContainer}>
          <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
            {t("journey_timeline")}
          </Typography>

          {isLoadingStages ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={activeTheme.colors.primary} />
              <Typography variant="caption" style={{ marginTop: 12 }}>{t("loading_stages", "Loading journey...")}</Typography>
            </View>
          ) : fetchError ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <MaterialIcons name="error-outline" size={48} color={activeTheme.colors.error} />
              <Typography variant="body" style={{ marginTop: 12, textAlign: 'center' }}>
                {t("failed_to_load_stages", "Failed to load journey timeline.")}
              </Typography>
              <TouchableOpacity 
                onPress={fetchStages} 
                style={{ marginTop: 16, backgroundColor: activeTheme.colors.primary, padding: 12, borderRadius: 8 }}
              >
                <Typography variant="button" style={{ color: "#FFFFFF" }}>{t("retry", "Retry")}</Typography>
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
                  <View style={[
                    styles.timelineDot,
                    isCompleted ? styles.dotCompleted : isActive ? styles.dotActive : styles.dotPending
                  ]}>
                    {isCompleted && <MaterialIcons name="check" size={12} color="#FFFFFF" />}
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
                        style={{ color: isActive ? activeTheme.colors.primary : activeTheme.colors.text }}
                      >
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
            {t("data_last_updated")}: <Typography variant="tiny" weight="bold">
              {lastLocationUpdate ? lastLocationUpdate.toLocaleTimeString() : t("waiting_for_gps", "Waiting for GPS")}
            </Typography>
          </Typography>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

