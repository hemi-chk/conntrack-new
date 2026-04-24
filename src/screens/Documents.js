import React from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export default function Documents({ navigation }) {
  const { t } = useTranslation();

  const docs = [
    { name: t("boi_clearance"), icon: "assignment" },
    { name: t("gate_pass"), icon: "vpn-key" },
    { name: t("port_docs"), icon: "folder" },
    { name: t("freezone_clearance"), icon: "description" },
  ];

  const handleDownload = (doc) => {
    Alert.alert(t("download_success_title"), t("download_success_msg", { doc }));
  };

  const handleConfirmAll = () => {
    Alert.alert(
      t("clearance_confirmed_title"),
      t("clearance_confirmed_msg")
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>
            {t("documents")}
          </Typography>
        </View>

        <Typography variant="body" color="textMuted" style={styles.description}>
          {t("docs_description")}
        </Typography>

        {/* DOCUMENT LIST */}
        {docs.map((doc, index) => (
          <Card key={index} elevation="sm" style={styles.docCard}>
            <View style={styles.docInfo}>
              <View style={styles.iconBackground}>
                <MaterialIcons name={doc.icon} size={24} color={theme.colors.primary} />
              </View>
              <Typography variant="subtitle" weight="semiBold" style={styles.docName}>
                {doc.name}
              </Typography>
            </View>

            <TouchableOpacity
              onPress={() => handleDownload(doc.name)}
              style={styles.downloadButton}
            >
              <MaterialIcons name="download" size={20} color={theme.colors.primary} />
              <Typography variant="body" color="primary" weight="medium" style={styles.downloadText}>
                {t("download")}
              </Typography>
            </TouchableOpacity>
          </Card>
        ))}

        {/* CONFIRM BUTTON */}
        <Button
          title={t("confirm_clearance")}
          onPress={handleConfirmAll}
          style={styles.confirmButton}
          variant="primary"
        />

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
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
  },
  description: {
    marginBottom: theme.spacing.xl,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  docInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: theme.roundness.md,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  docName: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.secondary}15`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness.md,
  },
  downloadText: {
    marginLeft: theme.spacing.xs,
  },
  confirmButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.success,
  },
});