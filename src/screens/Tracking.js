import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export default function Tracking({ navigation }) {
  const { t } = useTranslation();
  const orderType = "import";

  const steps = [
    { title: t("order_started"), time: "08:30 AM", status: "completed" },
    { title: t("arrived_at_port"), time: "10:15 AM", status: "completed" },
    { title: t("custom_clearance"), time: "11:45 AM", status: "active" },
    { title: t("boi_checkpoint"), time: t("pending"), status: "pending" },
    { title: t("delivered"), time: t("pending"), status: "pending" }
  ];

  const [currentStep, setCurrentStep] = useState(2);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
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

        <View style={styles.headerTitleContainer}>
          <Typography variant="subtitle" weight="bold">
            {t("shipment_tracking")}
          </Typography>
          <Typography variant="tiny" color="textMuted">
            ID: IMP-12345 • {t("assigned")}
          </Typography>
        </View>

        <TouchableOpacity style={styles.infoButton}>
          <MaterialIcons name="info-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PROGRESS OVERVIEW */}
        <Card elevation="md" style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Typography variant="body" color="surface" weight="medium">
              {t("overall_progress")}
            </Typography>
            <Typography variant="body" color="surface" weight="bold">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </Typography>
          </View>
          
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
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

        {/* TIMELINE */}
        <View style={styles.timelineContainer}>
          <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
            {t("journey_timeline")}
          </Typography>

          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isLast = index === steps.length - 1;

            return (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
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
                        {step.title}
                      </Typography>
                      <Typography variant="tiny" color="textMuted">
                        {step.time}
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
          })}
        </View>

        {/* ACTION */}
        <View style={styles.footer}>
          <Button
            title={t("complete_current_stage")}
            onPress={nextStep}
            disabled={currentStep === steps.length - 1}
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