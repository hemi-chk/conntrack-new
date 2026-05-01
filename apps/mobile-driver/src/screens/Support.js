import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";

const { width } = Dimensions.get("window");

export default function Support({ navigation }) {

  const handleCall = () => Linking.openURL("tel:+94712345678");
  const handleEmail = () => Linking.openURL("mailto:logistics@example.com");
  const handleWhatsApp = () => Linking.openURL("whatsapp://send?phone=+94712345678");

  const faqs = [
    { q: "How to update trip status?", a: "Go to active job and use the bottom action button." },
    { q: "Issues with GPS tracking?", a: "Ensure location services are enabled and app has permission." },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* 🖼️ TOP SECTION */}
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

        {/* 📦 CONTENT */}
        <View style={styles.content}>
          <Typography variant="subtitle" weight="bold" style={styles.sectionTitle}>
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