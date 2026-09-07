import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { authFetch } from "../utils/authFetch";

export default function ChangePassword({ route, navigation }) {
  const { user } = route.params || {};
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    scrollContainer: {
      paddingHorizontal: activeTheme.spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: activeTheme.spacing.lg,
      marginBottom: activeTheme.spacing.sm,
    },
    headerTitle: {
      marginLeft: activeTheme.spacing.sm,
    },
    description: {
      marginBottom: activeTheme.spacing.xl,
    },
    form: {
      flex: 1,
    },
    label: {
      marginBottom: activeTheme.spacing.xs,
    },
    passwordInputContainer: {
      position: "relative",
      marginBottom: activeTheme.spacing.lg,
    },
    input: {
      backgroundColor: activeTheme.colors.surface,
      padding: activeTheme.spacing.md,
      borderRadius: activeTheme.roundness.md,
      color: activeTheme.colors.text,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
    },
    passwordInput: {
      paddingRight: 48,
    },
    showPasswordButton: {
      position: "absolute",
      right: activeTheme.spacing.md,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      width: 32,
    },
    button: {
      marginTop: activeTheme.spacing.lg,
    },
  });

  const handleUpdate = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
        Alert.alert("Error", "Password must be at least 8 characters");
        return;
    }

    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/driver/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const driverId = user?.driver_id || user?.emp_id;
        if (driverId) {
          await SecureStore.deleteItemAsync(`saved_password_${driverId}`);
        }
        await AsyncStorage.removeItem("saved_user");
        await AsyncStorage.setItem("remember_me", "false");
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
            </TouchableOpacity>
            <Typography variant="h3" style={styles.headerTitle}>
              {t("change_password")}
            </Typography>
          </View>

          <Typography variant="body" color="textMuted" style={styles.description}>
            Enter your current password and a new secure password to update your account.
          </Typography>

          <View style={styles.form}>
            <Typography variant="body" weight="medium" style={styles.label}>Current Password</Typography>
            <View style={styles.passwordInputContainer}>
              <TextInput
                secureTextEntry={!showOldPassword}
                value={oldPassword}
                onChangeText={setOldPassword}
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={activeTheme.colors.textMuted}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowOldPassword(!showOldPassword)}
                accessibilityLabel={showOldPassword ? "Hide current password" : "Show current password"}
              >
                <MaterialIcons
                  name={showOldPassword ? "visibility-off" : "visibility"}
                  size={22}
                  color={activeTheme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <Typography variant="body" weight="medium" style={styles.label}>New Password</Typography>
            <View style={styles.passwordInputContainer}>
              <TextInput
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={activeTheme.colors.textMuted}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
                accessibilityLabel={showNewPassword ? "Hide new password" : "Show new password"}
              >
                <MaterialIcons
                  name={showNewPassword ? "visibility-off" : "visibility"}
                  size={22}
                  color={activeTheme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <Typography variant="body" weight="medium" style={styles.label}>Confirm New Password</Typography>
            <View style={styles.passwordInputContainer}>
              <TextInput
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={activeTheme.colors.textMuted}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility-off" : "visibility"}
                  size={22}
                  color={activeTheme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

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

