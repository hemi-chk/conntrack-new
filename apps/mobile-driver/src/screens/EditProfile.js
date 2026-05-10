/**
 * Edit Profile Screen
 * Allows drivers to modify their personal contact information.
 * Handles validation and synchronization with the backend profile system.
 */

import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Button } from "../components/Button";

import { API_BASE_URL } from "../constants/config";

export default function EditProfile({ route, navigation }) {
  // Extract initial user data from navigation parameters
  const { user } = route.params || {};
  const { t } = useTranslation();

  // Local state for form fields
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.contact_number || "");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validates and submits updated profile information to the server.
   */
  const handleSave = async () => {
    // Basic presence validation
    if (!firstName || !lastName || !phone) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/driver/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: user?.driver_id,
          empId: user?.emp_id,
          first_name: firstName,
          last_name: lastName,
          contact_number: phone
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert("Success", "Profile updated successfully");
        navigation.goBack(); // Return to profile overview
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.log("Update Error:", error);
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
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* HEADER SECTION */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <Typography variant="h3" style={styles.headerTitle}>
              {t("my_profile")}
            </Typography>
          </View>

          {/* EDITABLE FORM FIELDS */}
          <Typography variant="body" weight="medium" style={styles.label}>{t("first_name") || "First Name"}</Typography>
          <TextInput 
            value={firstName} 
            onChangeText={setFirstName} 
            style={styles.input} 
            placeholderTextColor={theme.colors.textMuted}
          />

          <Typography variant="body" weight="medium" style={styles.label}>{t("last_name") || "Last Name"}</Typography>
          <TextInput 
            value={lastName} 
            onChangeText={setLastName} 
            style={styles.input} 
            placeholderTextColor={theme.colors.textMuted}
          />

          <Typography variant="body" weight="medium" style={styles.label}>{t("phone_number")}</Typography>
          <TextInput 
            value={phone} 
            onChangeText={setPhone} 
            style={styles.input} 
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.textMuted}
          />

          {/* PRIMARY ACTION: Save Changes */}
          <Button 
            title={isLoading ? "Saving..." : t("save_changes")}
            style={styles.saveButton}
            disabled={isLoading}
            onPress={handleSave}
          />

          {/* SECONDARY ACTIONS: Security and Session Management */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <MaterialIcons name="lock" size={20} color={theme.colors.primary} />
            <Typography variant="body" color="primary" style={styles.secondaryButtonText}>
              {t("change_password")}
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              Alert.alert(t("sign_out"), t("are_you_sure_logout"), [
                { text: t("cancel"), style: "cancel" },
                { text: t("logout"), onPress: () => navigation.navigate("Login") },
              ])
            }
          >
            <MaterialIcons name="logout" size={20} color={theme.colors.error} />
            <Typography variant="body" weight="semiBold" color="error" style={styles.secondaryButtonText}>
              {t("sign_out")}
            </Typography>
          </TouchableOpacity>

          <View style={{ height: theme.spacing.xl }} />
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
  label: {
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  secondaryButtonText: {
    marginLeft: theme.spacing.sm,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  }
});