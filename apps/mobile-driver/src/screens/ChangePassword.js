/**
 * Change Password Screen
 * Facilitates secure password updates for the driver account.
 * Includes validation for matching passwords and minimum length constraints.
 */

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Button } from "../components/Button";
import { API_BASE_URL } from "../constants/config";

export default function ChangePassword({ route, navigation }) {
  const { user } = route.params || {};
  const { t } = useTranslation();
  
  // State for form control
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validates input fields and triggers the password update process.
   */
  const handleUpdate = async () => {
    // 1. Mandatory field check
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // 2. Matching validation
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    // 3. Length constraint
    if (newPassword.length < 4) {
        Alert.alert("Error", "Password must be at least 4 characters");
        return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/driver/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: user?.driver_id,
          oldPassword: oldPassword,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success", "Password updated successfully");
        navigation.goBack();
      } else {
        Alert.alert("Error", result.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Change Password Error:", error);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* HEADER SECTION */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Typography variant="h3" style={styles.headerTitle}>
              {t("change_password")}
            </Typography>
          </View>

          <Typography variant="body" color="textMuted" style={styles.description}>
            Enter your current password and a new secure password to update your account.
          </Typography>

          {/* INPUT FORM */}
          <View style={styles.form}>
            <Typography variant="body" weight="medium" style={styles.label}>Current Password</Typography>
            <TextInput
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Typography variant="body" weight="medium" style={styles.label}>New Password</Typography>
            <TextInput
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Typography variant="body" weight="medium" style={styles.label}>Confirm New Password</Typography>
            <TextInput
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Button
              title={isLoading ? "Updating..." : "Update Password"}
              onPress={handleUpdate}
              disabled={isLoading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
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
  description: {
    marginBottom: theme.spacing.xl,
  },
  form: {
    flex: 1,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    marginTop: theme.spacing.lg,
  },
});
