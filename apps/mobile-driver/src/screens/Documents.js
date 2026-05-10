/**
 * Documents Screen
 * Handles fetching, viewing, and downloading clearance documents for a specific order.
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, RefreshControl, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { API_BASE_URL } from "../constants/config";

export default function Documents({ route, navigation }) {
  const { t } = useTranslation();
  
  // Extract order context from navigation parameters
  const activeMission = route?.params?.order || {};
  const orderId = activeMission.order_id;

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetches the list of clearance documents associated with the current order.
   */
  const fetchDocuments = async () => {
    try {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/driver/order-documents/${orderId}`);
      const result = await response.json();

      if (result.success) {
        setDocuments(result.data || []);
      }
    } catch (error) {
      console.error("Fetch Documents Error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch documents on initial screen load
  useEffect(() => {
    fetchDocuments();
  }, []);

  /**
   * Refresh handler for pull-to-refresh functionality.
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  /**
   * Opens the document URL in an in-app browser for quick viewing.
   * @param {string} url - The public URL of the document file.
   */
  const handleView = async (url) => {
    if (url) {
      await WebBrowser.openBrowserAsync(url);
    } else {
      Alert.alert("Error", "No preview URL available");
    }
  };

  /**
   * Triggers a system-level download/open request for the file.
   * @param {string} url - The public URL of the document file.
   */
  const handleDownload = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        Alert.alert("Error", "Could not trigger download");
      });
    } else {
      Alert.alert("Error", "No file URL available");
    }
  };

  /**
   * Logic for confirming that all required clearance documents are processed.
   */
  const handleConfirmAll = () => {
    Alert.alert(
      t("clearance_confirmed_title"),
      t("clearance_confirmed_msg")
    );
  };

  /**
   * Maps document types to specific Material Icons for visual categorization.
   * @param {string} type - The document type string from the database.
   */
  const getDocIcon = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes("clearance")) return "assignment";
    if (t?.includes("gate")) return "vpn-key";
    if (t?.includes("port")) return "folder";
    return "description";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* SCREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>
          {t("documents")}
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
          <Typography variant="body" color="textMuted" style={styles.description}>
            {t("docs_description")}
          </Typography>

          {/* DOCUMENT LIST: Renders cards for each clearance record */}
          {documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="folder-open" size={64} color={theme.colors.border} />
              <Typography variant="body" color="textMuted" style={{ marginTop: 16 }}>
                No documents found for this order.
              </Typography>
            </View>
          ) : (
            documents.map((doc, index) => {
              // Extract data with robust fallbacks for different schema variations
              const fileUrl = doc.file_url || doc.document_url || doc.file_path || doc.url;
              const docType = doc.document_type || doc.doc_type || doc.name || doc.type || doc.document_name || "Document";
              const location = doc.location ? `${doc.location} - ` : "";
              
              return (
                <Card key={index} elevation="sm" style={styles.docCard}>
                  <View style={styles.docInfo}>
                    <View style={styles.iconBackground}>
                      <MaterialIcons name={getDocIcon(docType)} size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.docNameContainer}>
                      <Typography variant="subtitle" weight="semiBold" style={styles.docName}>
                        {location.toUpperCase()}{docType.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="tiny" color="textMuted">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </Typography>
                    </View>
                  </View>

                  {/* ACTION BUTTONS: View and Download */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleView(fileUrl)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="visibility" size={18} color={theme.colors.primary} />
                      <Typography variant="tiny" color="primary" weight="bold" style={styles.actionText}>
                        {t("view")}
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDownload(fileUrl)}
                      style={[styles.actionButton, { marginLeft: 8, backgroundColor: `${theme.colors.primary}10` }]}
                    >
                      <MaterialIcons name="file-download" size={18} color={theme.colors.primary} />
                      <Typography variant="tiny" color="primary" weight="bold" style={styles.actionText}>
                        {t("download")}
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}

          {/* SUBMIT/CONFIRM BUTTON */}
          <Button
            title={t("confirm_clearance")}
            onPress={handleConfirmAll}
            style={styles.confirmButton}
            variant="primary"
            disabled={documents.length === 0}
          />

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
  description: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  docCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  docInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: theme.roundness.md,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  docNameContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  docName: {
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.secondary}15`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness.md,
  },
  actionText: {
    marginLeft: theme.spacing.xs,
  },
  confirmButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.success,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 40,
  }
});