import React, { useState } from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export default function VehicleInfo({ navigation }) {
  const [licenseImage, setLicenseImage] = useState(null);
  const licenseExpiryDays = 12;

  const pickDoc = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setLicenseImage(result.assets[0].uri);
    }
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
            Vehicle Information
          </Typography>
        </View>

        {/* VEHICLE CARD */}
        <Card elevation="sm" style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="local-shipping" size={32} color={theme.colors.primary} />
          </View>
          <Typography variant="h3" weight="bold">Truck ID: TRK-9087</Typography>
          <Typography variant="body" color="textMuted" style={styles.subtitle}>
            Type: Heavy Duty Cargo Truck
          </Typography>
          <Typography variant="body" color="textMuted">
            Plate No: WP-AB-1234
          </Typography>
        </Card>

        {/* LICENSE STATUS */}
        <Card 
          elevation="sm" 
          style={[
            styles.card, 
            licenseExpiryDays < 15 && { backgroundColor: `${theme.colors.warning}10`, borderColor: theme.colors.warning, borderWidth: 1 }
          ]}
        >
          <View style={styles.row}>
            <MaterialIcons 
              name="verified-user" 
              size={24} 
              color={licenseExpiryDays < 15 ? theme.colors.warning : theme.colors.success} 
            />
            <Typography variant="subtitle" weight="bold" style={styles.rowTitle}>
              Driving License Status
            </Typography>
          </View>

          <Typography variant="body" style={styles.expiryText}>
            Expires in: <Typography weight="bold">{licenseExpiryDays} days</Typography>
          </Typography>

          {licenseExpiryDays < 15 && (
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={16} color={theme.colors.error} />
              <Typography variant="caption" color="error" style={styles.warningText}>
                License expiring soon! Please update documents.
              </Typography>
            </View>
          )}
        </Card>

        {/* DOCUMENT UPLOAD */}
        <Card elevation="sm" style={styles.card}>
          <Typography variant="subtitle" weight="bold" style={styles.cardTitle}>
            Upload Vehicle Documents
          </Typography>
          <Typography variant="caption" color="textMuted" style={styles.cardSubtitle}>
            Please upload clear photos of your License, RC, and Insurance.
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
    marginBottom: theme.spacing.sm,
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
  subtitle: {
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