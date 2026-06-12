/**
 * Driver Profile Screen
 * Displays driver information and provides management tools like duty status toggling,
 * profile photo uploads, and navigation to sub-settings (Edit Profile, Vehicle Info, etc).
 */

import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { theme } from "../constants/theme";

export default function DriverProfile({ route, navigation }) {
  // Extract user context from navigation route
  const { user } = route.params || {};

  // Manual toggle for driver availability (On Duty vs Off Duty)
  const [isOnDuty, setIsOnDuty] = useState(user?.status === 'active');

  // System-derived availability status (e.g. 'Available', 'On Mission')
  const [workStatus, setWorkStatus] = useState(user?.availability_status || 'Available');

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profile_photo_url || null);

  const { t } = useTranslation();

  /**
   * Toggles the driver's duty status in the backend.
   * @param {boolean} newValue - True for 'active', False for 'inactive'.
   */
  const handleToggleDutyStatus = async (newValue) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/driver/update-duty-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: user?.driver_id,
          active: newValue
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsOnDuty(newValue);
      } else {
        Alert.alert("Error", "Failed to update duty status");
      }
    } catch (error) {
      console.log("Toggle Error:", error);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Opens the system image gallery to pick a new profile photo.
   * Compresses and uploads the selected image as a base64 string to the backend.
   */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permission_required"), t("allow_access_gallery"));
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      // Optimistic UI update: show local image immediately
      setProfileImage(result.assets[0].uri);
      
      try {
        setIsUploadingPhoto(true);
        const driverId = user?.driver_id || user?.emp_id;
        
        const response = await fetch(`${API_BASE_URL}/api/driver/upload-profile-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: driverId,
            base64Image: result.assets[0].base64
          }),
        });

        const uploadResult = await response.json();
        
        if (uploadResult.success) {
          // Sync state with the permanent public URL from storage
          setProfileImage(uploadResult.url);
          
          // Update persistent user object
          if (user) {
            user.profile_photo_url = uploadResult.url;
          }
          
          Alert.alert("Success", "Profile photo updated successfully!");
        } else {
          Alert.alert("Error", uploadResult.message || "Failed to upload photo.");
        }
      } catch (error) {
        console.error("Upload Error:", error);
        Alert.alert("Connection Error", "Could not connect to server to upload photo.");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  /**
   * Context menu handler for profile photo interactions.
   */
  const handleProfileImagePress = () => {
    if (profileImage) {
      Alert.alert(
        "Profile Photo",
        "What would you like to do?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove Photo", onPress: removeProfileImage, style: "destructive" },
          { text: "Change Photo", onPress: pickImage }
        ]
      );
    } else {
      pickImage();
    }
  };

  /**
   * Removes the profile photo from both the UI and backend storage.
   */
  const removeProfileImage = async () => {
    try {
      setIsUploadingPhoto(true);
      const driverId = user?.driver_id || user?.emp_id;

      const response = await fetch(`${API_BASE_URL}/api/driver/remove-profile-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });

      const result = await response.json();

      if (result.success) {
        setProfileImage(null);
        if (user) {
          user.profile_photo_url = null;
        }
        Alert.alert("Success", "Profile photo removed successfully!");
      } else {
        Alert.alert("Error", result.message || "Failed to remove photo.");
      }
    } catch (error) {
      console.error("Remove Error:", error);
      Alert.alert("Connection Error", "Could not connect to server to remove photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  /**
   * Configuration for the profile settings menu.
   */
  const menuItems = [
    { icon: "person", label: t("edit_profile"), screen: "EditProfile" },
    { icon: "directions-car", label: t("vehicle_info"), screen: "VehicleInfo" },
    { icon: "history", label: t("trip_history"), screen: "History" },
    { icon: "settings", label: t("settings"), screen: "Settings" },
    { icon: "language", label: t("language"), screen: "Language" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER SECTION */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Typography variant="h3" style={styles.headerTitle}>
            {t("profile")}
          </Typography>
        </View>

        {/* PROFILE PHOTO & IDENTITY SECTION */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleProfileImagePress} disabled={isUploadingPhoto} style={styles.imageWrapper}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <MaterialIcons name="person" size={50} color={theme.colors.surface} />
              </View>
            )}
            
            {/* Loading indicator for asynchronous photo uploads */}
            {isUploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          <Typography variant="h3" style={styles.driverName}>
            {user?.first_name} {user?.last_name}
          </Typography>

          <Typography variant="body" color="textMuted">
            {t("logistics_driver")}
          </Typography>
        </View>

        {/* DUTY STATUS: Manual control for shifts */}
        <Card elevation="sm" style={styles.availabilityCard}>
          <View style={styles.availabilityRow}>
            <View>
              <Typography variant="subtitle" weight="bold">
                Duty Status
              </Typography>
              <Typography variant="caption" color="textMuted">
                Toggle when starting/ending shift
              </Typography>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Typography
                variant="subtitle"
                weight="semiBold"
                style={{ color: isOnDuty ? theme.colors.success : theme.colors.error, marginBottom: 4 }}
              >
                {isOnDuty ? "ON DUTY" : "OFF DUTY"}
              </Typography>

              <Switch
                value={isOnDuty}
                onValueChange={handleToggleDutyStatus}
                disabled={isLoading}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.success}80` }}
                thumbColor={isOnDuty ? theme.colors.success : theme.colors.surface}
              />
            </View>
          </View>
        </Card>

        {/* WORK STATUS: Informational badge based on mission state */}
        <Card elevation="sm" style={styles.workStatusCard}>
          <View style={styles.availabilityRow}>
            <View>
              <Typography variant="subtitle" weight="bold">
                Current Work Status
              </Typography>
              <Typography variant="caption" color="textMuted">
                Automatically updated by system
              </Typography>
            </View>

            <View style={[
              styles.statusBadge,
              { backgroundColor: workStatus === 'Available' ? `${theme.colors.success}20` : `${theme.colors.warning}20` }
            ]}>
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: workStatus === 'Available' ? theme.colors.success : theme.colors.warning }}
              >
                {workStatus.toUpperCase()}
              </Typography>
            </View>
          </View>
        </Card>

        {/* NAVIGATION MENU */}
        <Card elevation="sm" style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(item.screen, { user })}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && styles.menuItemBorder
              ]}
            >
              <MaterialIcons name={item.icon} size={22} color={theme.colors.primary} />

              <Typography variant="body" style={styles.menuLabel}>
                {item.label}
              </Typography>

              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* LOGOUT ACTION */}
        <View style={styles.logoutContainer}>
          <Button
            title={t("logout")}
            onPress={() => navigation.navigate("Login")}
          />
        </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: theme.roundness.full,
  },
  profilePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrapper: {
    position: "relative",
    borderRadius: theme.roundness.full,
    overflow: "hidden",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  driverName: {
    marginTop: theme.spacing.sm,
  },
  availabilityCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.sm,
    alignItems: "center",
  },
  workStatusCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuCard: {
    marginHorizontal: theme.spacing.lg,
    padding: 0, 
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  menuLabel: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  logoutContainer: {
    margin: theme.spacing.lg,
  }
});