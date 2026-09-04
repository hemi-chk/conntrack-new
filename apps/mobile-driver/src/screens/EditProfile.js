import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { AUTH_TOKEN_KEY, authFetch } from "../utils/authFetch";

export default function EditProfile({ route, navigation }) {
  const { user } = route.params || {};
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.contact_number || "");
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact || "");
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
    label: {
      marginBottom: activeTheme.spacing.xs,
    },
    input: {
      backgroundColor: activeTheme.colors.surface,
      padding: activeTheme.spacing.md,
      borderRadius: activeTheme.roundness.md,
      marginBottom: activeTheme.spacing.md,
      color: activeTheme.colors.text,
      fontFamily: activeTheme.typography.fontFamily.regular,
      fontSize: activeTheme.typography.sizes.md,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
    },
    saveButton: {
      marginTop: activeTheme.spacing.sm,
      marginBottom: activeTheme.spacing.lg,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: activeTheme.spacing.md,
    },
    secondaryButtonText: {
      marginLeft: activeTheme.spacing.sm,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: activeTheme.spacing.md,
    }
  });

  const handleSave = async () => {
    if (!firstName || !lastName || !phone) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/driver/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: user?.driver_id,
          empId: user?.emp_id,
          first_name: firstName,
          last_name: lastName,
          contact_number: phone,
          emergency_contact: emergencyContact
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert("Success", "Profile updated successfully");
        navigation.goBack();
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
            </TouchableOpacity>

            <Typography variant="h3" style={styles.headerTitle}>
              {t("my_profile")}
            </Typography>
          </View>

          <Typography variant="body" weight="medium" style={styles.label}>{t("first_name") || "First Name"}</Typography>
          <TextInput 
            value={firstName} 
            onChangeText={setFirstName} 
            style={styles.input} 
            placeholderTextColor={activeTheme.colors.textMuted}
          />

          <Typography variant="body" weight="medium" style={styles.label}>{t("last_name") || "Last Name"}</Typography>
          <TextInput 
            value={lastName} 
            onChangeText={setLastName} 
            style={styles.input} 
            placeholderTextColor={activeTheme.colors.textMuted}
          />

          <Typography variant="body" weight="medium" style={styles.label}>{t("phone_number")}</Typography>
          <TextInput 
            value={phone} 
            onChangeText={setPhone} 
            style={styles.input} 
            keyboardType="phone-pad"
            placeholderTextColor={activeTheme.colors.textMuted}
          />

          <Typography variant="body" weight="medium" style={styles.label}>{t("emergency_contact") || "Emergency Contact"}</Typography>
          <TextInput 
            value={emergencyContact} 
            onChangeText={setEmergencyContact} 
            style={styles.input} 
            keyboardType="phone-pad"
            placeholderTextColor={activeTheme.colors.textMuted}
            placeholder={t("enter_emergency_contact") || "Emergency Contact Phone Number"}
          />

          <Button 
            title={isLoading ? "Saving..." : t("save_changes")}
            style={styles.saveButton}
            disabled={isLoading}
            onPress={handleSave}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("ChangePassword", { user })}
          >
            <MaterialIcons name="lock" size={20} color={activeTheme.colors.primary} />
            <Typography variant="body" color="primary" style={styles.secondaryButtonText}>
              {t("change_password")}
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              Alert.alert(t("sign_out"), t("are_you_sure_logout"), [
                { text: t("cancel"), style: "cancel" },
                { 
                  text: t("logout"), 
                  onPress: async () => {
                    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
                    await AsyncStorage.removeItem("saved_user");
                    await AsyncStorage.removeItem("saved_driver_id");
                    await AsyncStorage.removeItem("remember_me");
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "Login" }],
                    });
                  } 
                },
              ])
            }
          >
            <MaterialIcons name="logout" size={20} color={activeTheme.colors.error} />
            <Typography variant="body" weight="semiBold" color="error" style={styles.secondaryButtonText}>
              {t("sign_out")}
            </Typography>
          </TouchableOpacity>

          <View style={{ height: activeTheme.spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

