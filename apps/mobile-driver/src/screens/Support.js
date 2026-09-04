/**
 * Support Screen
 * Provides various help channels including direct communication (Call, Email, WhatsApp)
 * and an issue reporting form that syncs with the management backend.
 */

import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { authFetch } from "../utils/authFetch";

const { width } = Dimensions.get("window");

const ISSUE_TYPES = [
  { key: "Mechanical Breakdown", label: "Mechanical Breakdown", icon: "directions-car", color: "#EF4444" },
  { key: "Traffic/Route Delay", label: "Traffic / Route Delay", icon: "schedule", color: "#F59E0B" },
  { key: "Documentation Issue", label: "Documentation Issue", icon: "description", color: "#6366F1" },
  { key: "Cargo Damage", label: "Cargo Damage", icon: "local-shipping", color: "#DC2626" },
  { key: "Other", label: "Other", icon: "help-outline", color: "#64748B" },
];

const PRIORITIES = [
  { key: "low", label: "Low", color: "#10B981" },
  { key: "medium", label: "Medium", color: "#F59E0B" },
  { key: "high", label: "High", color: "#EF4444" },
];

const ISSUE_STATUS_META = {
  open: { label: "Not Reviewed", color: "#64748B", bg: "#F1F5F9", icon: "schedule" },
  escalated: { label: "Reviewing", color: "#2563EB", bg: "#DBEAFE", icon: "visibility" },
  resolved: { label: "Solved", color: "#059669", bg: "#D1FAE5", icon: "check-circle" },
};
function issueStatusMeta(status) {
  return ISSUE_STATUS_META[status] || ISSUE_STATUS_META.open;
}

export default function Support({ route, navigation }) {
  const user = route?.params?.user || {};
  const activeMission = route?.params?.order || {};
  const { theme: activeTheme } = useTheme();

  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myIssues, setMyIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  const driverId = user?.driver_id || user?.emp_id;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    imageContainer: {
      width: "100%",
      height: 260,
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    backButtonContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      padding: activeTheme.spacing.lg,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: activeTheme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      ...activeTheme.shadows.md,
    },
    headerText: {
      position: "absolute",
      bottom: 60,
      left: activeTheme.spacing.lg,
    },
    content: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
      marginTop: -30,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: activeTheme.spacing.lg,
      paddingTop: activeTheme.spacing.xl,
    },
    sectionTitle: {
      marginBottom: activeTheme.spacing.md,
    },
    emptyIssuesCard: {
      padding: 16,
      borderRadius: 16,
    },
    issueCard: {
      padding: 14,
      borderRadius: 16,
      marginBottom: 10,
    },
    issueCardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    reportBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderRadius: 16,
      backgroundColor: `${activeTheme.colors.warning}15`,
      borderWidth: 1,
      borderColor: activeTheme.colors.warning,
    },
    reportBannerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    reportIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${activeTheme.colors.warning}25`,
      justifyContent: "center",
      alignItems: "center",
    },
    formCard: {
      padding: 20,
      borderRadius: 20,
      backgroundColor: activeTheme.colors.surface,
    },
    typeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    typeChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: activeTheme.colors.border,
      backgroundColor: activeTheme.colors.background,
    },
    priorityRow: {
      flexDirection: "row",
      gap: 10,
    },
    priorityChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: activeTheme.colors.border,
      backgroundColor: activeTheme.colors.background,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    textArea: {
      borderWidth: 1.5,
      borderColor: activeTheme.colors.border,
      borderRadius: 14,
      padding: 14,
      minHeight: 100,
      fontSize: 14,
      fontFamily: activeTheme.typography.fontFamily.regular,
      color: activeTheme.colors.text,
      backgroundColor: activeTheme.colors.background,
      lineHeight: 20,
    },
    formActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: 20,
      gap: 12,
    },
    cancelButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: activeTheme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      ...activeTheme.shadows.sm,
    },
    contactGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    contactItem: {
      width: (width - 48 - 24) / 3,
    },
    contactCard: {
      padding: activeTheme.spacing.sm,
      alignItems: "center",
      borderRadius: 16,
    },
    iconCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
    },
    faqCard: {
      marginBottom: activeTheme.spacing.sm,
      padding: activeTheme.spacing.md,
      borderRadius: 12,
    },
    faqHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    footer: {
      marginTop: activeTheme.spacing.xl,
      paddingBottom: activeTheme.spacing.xl,
      opacity: 0.6,
    },
  });

  const fetchMyIssues = async () => {
    if (!driverId) {
      setLoadingIssues(false);
      return;
    }
    try {
      const response = await authFetch(`${API_BASE_URL}/api/driver/issues/${driverId}`);
      const result = await response.json();
      if (result.success) setMyIssues(result.data || []);
    } catch (error) {
      console.error("Fetch My Issues Error:", error);
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    fetchMyIssues();
  }, []);

  const handleCall = () => Linking.openURL("tel:+94712345678");
  const handleEmail = () => Linking.openURL("mailto:logistics@example.com");
  const handleWhatsApp = () => Linking.openURL("whatsapp://send?phone=+94712345678");

  const resetForm = () => {
    setSelectedType(null);
    setSelectedPriority("medium");
    setDescription("");
    setShowForm(false);
  };

  const handleSubmitIssue = async () => {
    if (!selectedType) {
      Alert.alert("Missing Info", "Please select an issue type.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Missing Info", "Please describe the issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const driverId = user?.driver_id || user?.emp_id;
      const orderData = activeMission.orders || {};
      const response = await authFetch(`${API_BASE_URL}/api/driver/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          orderId: activeMission.order_id || orderData.order_id,
          assignmentId: activeMission.assignment_id || activeMission.id,
          supplierId: activeMission.supplier_id || orderData.supplier_id,
          issueType: selectedType,
          priority: selectedPriority,
          description: description.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Issue Reported", "Your issue has been submitted successfully. Our team will review it shortly.");
        resetForm();
        fetchMyIssues();
      } else {
        Alert.alert("Error", result.message || result.error || `Failed to submit issue (${response.status}).`);
      }
    } catch (error) {
      console.error("Report Issue Error:", error);
      Alert.alert("Connection Error", "Could not connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    { q: "How to update trip status?", a: "Go to active job and use the bottom action button." },
    { q: "Issues with GPS tracking?", a: "Ensure location services are enabled and app has permission." },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/support.jpg")}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.overlay} />
          <SafeAreaView style={styles.backButtonContainer} edges={["top"]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation?.goBack?.()}
            >
              <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
            </TouchableOpacity>
          </SafeAreaView>
          
          <View style={styles.headerText}>
            <Typography variant="h1" style={{ color: "#FFFFFF" }}>Help Center</Typography>
            <Typography variant="body" style={{ color: "#FFFFFF", opacity: 0.9 }}>How can we assist you today?</Typography>
          </View>
        </View>

        <View style={styles.content}>

          {/* ISSUE REPORTING SECTION: Collapsible form for structured problem reports */}
          <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
            Report an Issue
          </Typography>

          {!showForm ? (
            <TouchableOpacity activeOpacity={0.85} onPress={() => setShowForm(true)}>
              <Card elevation="md" style={styles.reportBanner}>
                <View style={styles.reportBannerLeft}>
                  <View style={styles.reportIconCircle}>
                    <MaterialIcons name="report-problem" size={24} color={activeTheme.colors.warning} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Typography variant="body" weight="bold">Having a problem?</Typography>
                    <Typography variant="tiny" color="textMuted">Tap here to report a vehicle, delay, or document issue</Typography>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={activeTheme.colors.border} />
              </Card>
            </TouchableOpacity>
          ) : (
            <Card elevation="md" style={styles.formCard}>
              {/* Type Selection */}
              <Typography variant="caption" weight="bold" style={{ marginBottom: 10 }}>
                What type of issue?
              </Typography>
              <View style={styles.typeGrid}>
                {ISSUE_TYPES.map((type) => {
                  const isActive = selectedType === type.key;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      activeOpacity={0.7}
                      onPress={() => setSelectedType(type.key)}
                      style={[
                        styles.typeChip,
                        isActive && { backgroundColor: `${type.color}18`, borderColor: type.color },
                      ]}
                    >
                      <MaterialIcons name={type.icon} size={18} color={isActive ? type.color : activeTheme.colors.textMuted} />
                      <Typography
                        variant="tiny"
                        weight={isActive ? "bold" : "medium"}
                        style={{ marginLeft: 6, color: isActive ? type.color : activeTheme.colors.textMuted }}
                      >
                        {type.label}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Priority Selection */}
              <Typography variant="caption" weight="bold" style={{ marginBottom: 10, marginTop: 20 }}>
                Priority
              </Typography>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const isActive = selectedPriority === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      activeOpacity={0.7}
                      onPress={() => setSelectedPriority(p.key)}
                      style={[
                        styles.priorityChip,
                        isActive && { backgroundColor: `${p.color}18`, borderColor: p.color },
                      ]}
                    >
                      <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                      <Typography
                        variant="tiny"
                        weight={isActive ? "bold" : "medium"}
                        style={{ color: isActive ? p.color : activeTheme.colors.textMuted }}
                      >
                        {p.label}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Detailed Description Input */}
              <Typography variant="caption" weight="bold" style={{ marginBottom: 10, marginTop: 20 }}>
                Describe the issue
              </Typography>
              <TextInput
                style={styles.textArea}
                placeholder="Explain what happened..."
                placeholderTextColor={activeTheme.colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />

              {/* Form Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetForm}
                  activeOpacity={0.7}
                >
                  <Typography variant="caption" weight="semiBold" color="textMuted">Cancel</Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleSubmitIssue}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={16} color="white" style={{ marginRight: 6 }} />
                      <Typography variant="caption" weight="bold" style={{ color: "white" }}>Submit</Typography>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* MY REPORTED ISSUES: past reports and their review status */}
          <Typography variant="subtitle" weight="bold" style={[styles.sectionTitle, { marginTop: activeTheme.spacing.xl }]}>
            My Reported Issues
          </Typography>

          {loadingIssues ? (
            <ActivityIndicator size="small" color={activeTheme.colors.primary} style={{ marginVertical: 12 }} />
          ) : myIssues.length === 0 ? (
            <Card elevation="sm" style={styles.emptyIssuesCard}>
              <Typography variant="caption" color="textMuted" align="center">
                You haven&apos;t reported any issues yet.
              </Typography>
            </Card>
          ) : (
            myIssues.map((issue) => {
              const statusMeta = issueStatusMeta(issue.status);
              return (
                <Card key={issue.issue_id} elevation="sm" style={styles.issueCard}>
                  <View style={styles.issueCardHeader}>
                    <Typography variant="body" weight="bold" style={{ flex: 1 }}>
                      {issue.issue_type || "Issue"}
                    </Typography>
                    <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
                      <MaterialIcons name={statusMeta.icon} size={12} color={statusMeta.color} />
                      <Typography variant="tiny" weight="bold" style={{ color: statusMeta.color, marginLeft: 4 }}>
                        {statusMeta.label}
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="tiny" color="textMuted" style={{ marginTop: 4 }} numberOfLines={2}>
                    {issue.description}
                  </Typography>
                  {issue.orders?.order_reference && (
                    <Typography variant="tiny" color="textMuted" style={{ marginTop: 4 }}>
                      Order: {issue.orders.order_reference}
                    </Typography>
                  )}
                </Card>
              );
            })
          )}

          {/* DIRECT SUPPORT CHANNELS */}
          <Typography variant="subtitle" weight="bold" style={[styles.sectionTitle, { marginTop: activeTheme.spacing.xl }]}>
            Direct Support
          </Typography>
          
          <View style={styles.contactGrid}>
            <TouchableOpacity onPress={handleCall} style={styles.contactItem}>
              <Card elevation="md" style={styles.contactCard}>
                <View style={[styles.iconCircle, { backgroundColor: `${activeTheme.colors.primary}15` }]}>
                  <MaterialIcons name="call" size={26} color={activeTheme.colors.primary} />
                </View>
                <Typography variant="caption" weight="bold" style={{ marginTop: 8 }}>Call Us</Typography>
                <Typography variant="tiny" color="textMuted">Available 24/7</Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleWhatsApp} style={styles.contactItem}>
              <Card elevation="md" style={styles.contactCard}>
                <View style={[styles.iconCircle, { backgroundColor: "#25D36615" }]}>
                  <FontAwesome5 name="whatsapp" size={26} color="#25D366" />
                </View>
                <Typography variant="caption" weight="bold" style={{ marginTop: 8 }}>WhatsApp</Typography>
                <Typography variant="tiny" color="textMuted">Instant Chat</Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEmail} style={styles.contactItem}>
              <Card elevation="md" style={styles.contactCard}>
                <View style={[styles.iconCircle, { backgroundColor: `${activeTheme.colors.accent}15` }]}>
                  <MaterialIcons name="email" size={26} color={activeTheme.colors.accent} />
                </View>
                <Typography variant="caption" weight="bold" style={{ marginTop: 8 }}>Email</Typography>
                <Typography variant="tiny" color="textMuted">Quick Response</Typography>
              </Card>
            </TouchableOpacity>
          </View>

          {/* FAQ SECTION */}
          <Typography variant="subtitle" weight="bold" style={[styles.sectionTitle, { marginTop: activeTheme.spacing.xl }]}>
            Frequently Asked Questions
          </Typography>

          {faqs.map((faq, i) => (
            <Card key={i} elevation="sm" style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <Typography variant="body" weight="bold" style={{ flex: 1 }}>{faq.q}</Typography>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={activeTheme.colors.textMuted} />
              </View>
              <Typography variant="caption" color="textMuted" style={{ marginTop: 8 }}>
                {faq.a}
              </Typography>
            </Card>
          ))}

          <View style={styles.footer}>
            <Typography variant="tiny" color="textMuted" align="center">
              Driver App Support v1.0.0
            </Typography>
            <Typography variant="tiny" color="textMuted" align="center" style={{ marginTop: 4 }}>
              © 2026 Logistics Management Systems
            </Typography>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

