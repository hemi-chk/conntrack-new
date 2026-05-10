/**
 * Support Screen
 * Provides various help channels including direct communication (Call, Email, WhatsApp)
 * and an issue reporting form that syncs with the management backend.
 */

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, TextInput, ActivityIndicator, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { API_BASE_URL } from "../constants/config";

const { width } = Dimensions.get("window");

/**
 * Predefined issue categories for structured reporting.
 */
const ISSUE_TYPES = [
  { key: "vehicle_issue", label: "Vehicle Issue", icon: "directions-car", color: "#EF4444" },
  { key: "delay_issue", label: "Delay / Route Issue", icon: "schedule", color: "#F59E0B" },
  { key: "document_issue", label: "Document Issue", icon: "description", color: "#6366F1" },
  { key: "other", label: "Other", icon: "help-outline", color: "#64748B" },
];

/**
 * Priority levels to help the support team triage reports.
 */
const PRIORITIES = [
  { key: "low", label: "Low", color: "#10B981" },
  { key: "medium", label: "Medium", color: "#F59E0B" },
  { key: "high", label: "High", color: "#EF4444" },
];

export default function Support({ route, navigation }) {
  // User context passed from navigation
  const user = route?.params?.user || {};

  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Intent handlers for direct communication channels
  const handleCall = () => Linking.openURL("tel:+94712345678");
  const handleEmail = () => Linking.openURL("mailto:logistics@example.com");
  const handleWhatsApp = () => Linking.openURL("whatsapp://send?phone=+94712345678");

  /**
   * Resets the issue reporting form to its default state.
   */
  const resetForm = () => {
    setSelectedType(null);
    setSelectedPriority("medium");
    setDescription("");
    setShowForm(false);
  };

  /**
   * Submits the reported issue to the backend database.
   */
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
      const response = await fetch(`${API_BASE_URL}/api/driver/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          issueType: selectedType,
          priority: selectedPriority,
          description: description.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Issue Reported", "Your issue has been submitted successfully. Our team will review it shortly.");
        resetForm();
      } else {
        Alert.alert("Error", result.message || "Failed to submit issue.");
      }
    } catch (error) {
      console.error("Report Issue Error:", error);
      Alert.alert("Connection Error", "Could not connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Mock data for Frequently Asked Questions.
   */
  const faqs = [
    { q: "How to update trip status?", a: "Go to active job and use the bottom action button." },
    { q: "Issues with GPS tracking?", a: "Ensure location services are enabled and app has permission." },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* TOP BRANDING SECTION: Support representative image and overlay */}
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
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </SafeAreaView>
          
          <View style={styles.headerText}>
            <Typography variant="h1" style={{ color: theme.colors.surface }}>Help Center</Typography>
            <Typography variant="body" style={{ color: theme.colors.surface, opacity: 0.9 }}>How can we assist you today?</Typography>
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
                    <MaterialIcons name="report-problem" size={24} color="#D97706" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Typography variant="body" weight="bold">Having a problem?</Typography>
                    <Typography variant="tiny" color="textMuted">Tap here to report a vehicle, delay, or document issue</Typography>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.border} />
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
                      <MaterialIcons name={type.icon} size={18} color={isActive ? type.color : theme.colors.textMuted} />
                      <Typography
                        variant="tiny"
                        weight={isActive ? "bold" : "medium"}
                        style={{ marginLeft: 6, color: isActive ? type.color : theme.colors.textMuted }}
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
                        style={{ color: isActive ? p.color : theme.colors.textMuted }}
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
                placeholderTextColor={theme.colors.textMuted}
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

          {/* DIRECT SUPPORT CHANNELS */}
          <Typography variant="subtitle" weight="bold" style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>
            Direct Support
          </Typography>
          
          <View style={styles.contactGrid}>
            <TouchableOpacity onPress={handleCall} style={styles.contactItem}>
              <Card elevation="md" style={styles.contactCard}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <MaterialIcons name="call" size={26} color={theme.colors.primary} />
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
                <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.accent}15` }]}>
                  <MaterialIcons name="email" size={26} color={theme.colors.accent} />
                </View>
                <Typography variant="caption" weight="bold" style={{ marginTop: 8 }}>Email</Typography>
                <Typography variant="tiny" color="textMuted">Quick Response</Typography>
              </Card>
            </TouchableOpacity>
          </View>

          {/* FAQ SECTION */}
          <Typography variant="subtitle" weight="bold" style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>
            Frequently Asked Questions
          </Typography>

          {faqs.map((faq, i) => (
            <Card key={i} elevation="sm" style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <Typography variant="body" weight="bold" style={{ flex: 1 }}>{faq.q}</Typography>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={theme.colors.textMuted} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    padding: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  headerText: {
    position: "absolute",
    bottom: 60,
    left: theme.spacing.lg,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },

  // Report Banner (collapsed state)
  reportBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
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
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },

  // Form Card
  formCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
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
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
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
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    ...theme.shadows.sm,
  },

  // Contact
  contactGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactItem: {
    width: (width - 48 - 24) / 3,
  },
  contactCard: {
    padding: theme.spacing.sm,
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
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: 12,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    opacity: 0.6,
  },
});