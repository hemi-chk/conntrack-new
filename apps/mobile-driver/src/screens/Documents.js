/**
 * Documents Screen
 * Handles fetching, viewing, and downloading clearance documents for a specific order.
 */

import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { authFetch } from "../utils/authFetch";

export default function Documents({ route, navigation }) {
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();
  
  const activeMission = route?.params?.order || {};
  const orderId = activeMission.order_id;

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollContent: {
      paddingHorizontal: activeTheme.spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: activeTheme.spacing.lg,
      paddingVertical: activeTheme.spacing.lg,
      backgroundColor: activeTheme.colors.surface,
      ...activeTheme.shadows.sm,
      marginBottom: activeTheme.spacing.md,
    },
    headerTitle: {
      marginLeft: activeTheme.spacing.sm,
    },
    description: {
      marginBottom: activeTheme.spacing.xl,
      marginTop: activeTheme.spacing.md,
    },
    docCard: {
      marginBottom: activeTheme.spacing.md,
      padding: activeTheme.spacing.md,
    },
    docInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: activeTheme.spacing.md,
    },
    iconBackground: {
      width: 44,
      height: 44,
      borderRadius: activeTheme.roundness.md,
      backgroundColor: `${activeTheme.colors.primary}15`,
      justifyContent: "center",
      alignItems: "center",
    },
    docNameContainer: {
      marginLeft: activeTheme.spacing.md,
      flex: 1,
    },
    docName: {
      flex: 1,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      borderTopWidth: 1,
      borderTopColor: activeTheme.colors.border,
      paddingTop: activeTheme.spacing.sm,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${activeTheme.colors.secondary}15`,
      paddingHorizontal: activeTheme.spacing.md,
      paddingVertical: activeTheme.spacing.sm,
      borderRadius: activeTheme.roundness.md,
    },
    actionText: {
      marginLeft: activeTheme.spacing.xs,
    },
    confirmButton: {
      marginTop: activeTheme.spacing.xl,
      backgroundColor: activeTheme.colors.success,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 60,
      marginBottom: 40,
    }
  });

  const fetchDocuments = async () => {
    try {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      const response = await authFetch(`${API_BASE_URL}/api/driver/order-documents/${orderId}`);
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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const handleView = async (url) => {
    if (url) {
      await WebBrowser.openBrowserAsync(url);
    } else {
      Alert.alert("Error", "No preview URL available");
    }
  };

  const handleDownload = async (url, fileName = "document") => {
    if (!url) {
      Alert.alert("Error", "No file URL available");
      return;
    }

    try {
      setIsLoading(true);
      
      const extension = url.split('.').pop().split(/\#|\?/)[0] || 'pdf';
      const cleanFileName = `${fileName.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
      const fileUri = `${FileSystem.cacheDirectory}${cleanFileName}`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      if (downloadResult.status !== 200) {
        throw new Error("Download failed");
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: downloadResult.headers['Content-Type'] || 'application/pdf',
          dialogTitle: t("save_document", "Save Document"),
          UTI: `public.${extension}`
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Download Error:", error);
      Alert.alert("Download Failed", "There was an issue saving this file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>
          {t("documents")}
        </Typography>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activeTheme.colors.primary} />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.colors.primary]} />
          }
        >
          <Typography variant="body" color="textMuted" style={styles.description}>
            {t("docs_description")}
          </Typography>

          {/* DOCUMENT LIST: Renders cards for each clearance record */}
          {documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="folder-open" size={64} color={activeTheme.colors.border} />
              <Typography variant="body" color="textMuted" style={{ marginTop: 16 }}>
                No documents found for this order.
              </Typography>
            </View>
          ) : (
            documents.map((doc, index) => {
              const fileUrl = doc.file_url || doc.document_url || doc.file_path || doc.url;
              const docType = doc.document_type || doc.doc_type || doc.name || doc.type || doc.document_name || "Document";
              const location = doc.location ? `${doc.location} - ` : "";
              
              return (
                <Card key={index} elevation="sm" style={styles.docCard}>
                  <View style={styles.docInfo}>
                    <View style={styles.iconBackground}>
                      <MaterialIcons name={getDocIcon(docType)} size={24} color={activeTheme.colors.primary} />
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
                      <MaterialIcons name="visibility" size={18} color={activeTheme.colors.primary} />
                      <Typography variant="tiny" color="primary" weight="bold" style={styles.actionText}>
                        {t("view")}
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDownload(fileUrl, docType)}
                      style={[styles.actionButton, { marginLeft: 8, backgroundColor: `${activeTheme.colors.primary}10` }]}
                    >
                      <MaterialIcons name="file-download" size={18} color={activeTheme.colors.primary} />
                      <Typography variant="tiny" color="primary" weight="bold" style={styles.actionText}>
                        {t("download")}
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}

          <View style={{ height: activeTheme.spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

