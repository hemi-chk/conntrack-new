/**
 * Driver Profile Screen
 * Displays driver information and provides management tools like duty status toggling,
 * profile photo uploads, and navigation to sub-settings (Edit Profile, Vehicle Info, etc).
 */

import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { useTheme } from "../constants/theme";
import { AUTH_TOKEN_KEY, authFetch } from "../utils/authFetch";

export default function DriverProfile({ route, navigation }) {
  const { user } = route.params || {};
  const { theme: activeTheme } = useTheme();

  const [isOnDuty, setIsOnDuty] = useState(user?.status === 'active');
  const [workStatus, setWorkStatus] = useState(user?.availability_status || 'Available');

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profile_photo_url || null);

  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: activeTheme.spacing.lg,
    },
    headerTitle: {
      marginLeft: activeTheme.spacing.sm,
    },
    profileSection: {
      alignItems: "center",
      marginBottom: activeTheme.spacing.lg,
    },
    profileImage: {
      width: 90,
      height: 90,
      borderRadius: activeTheme.roundness.full,
    },
    profilePlaceholder: {
      width: 90,
      height: 90,
      borderRadius: activeTheme.roundness.full,
      backgroundColor: activeTheme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    imageWrapper: {
      position: "relative",
      borderRadius: activeTheme.roundness.full,
      overflow: "hidden",
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    driverName: {
      marginTop: activeTheme.spacing.sm,
    },
    availabilityCard: {
      marginHorizontal: activeTheme.spacing.lg,
      marginBottom: activeTheme.spacing.lg,
    },
    availabilityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: activeTheme.spacing.sm,
      alignItems: "center",
    },
    workStatusCard: {
      marginHorizontal: activeTheme.spacing.lg,
      marginBottom: activeTheme.spacing.lg,
      backgroundColor: activeTheme.colors.surface,
    },
    statusBadge: {
      paddingHorizontal: activeTheme.spacing.md,
      paddingVertical: 4,
      borderRadius: activeTheme.roundness.full,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    menuCard: {
      marginHorizontal: activeTheme.spacing.lg,
      padding: 0, 
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: activeTheme.spacing.md,
    },
    menuItemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: activeTheme.colors.border,
    },
    menuLabel: {
      marginLeft: activeTheme.spacing.md,
      flex: 1,
    },
    logoutContainer: {
      margin: activeTheme.spacing.lg,
    }
  });

  const handleToggleDutyStatus = async (newValue) => {
    try {
      setIsLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/driver/update-duty-status`, {
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
      setProfileImage(result.assets[0].uri);
      
      try {
        setIsUploadingPhoto(true);
        const driverId = user?.driver_id || user?.emp_id;
        
        const response = await authFetch(`${API_BASE_URL}/api/driver/upload-profile-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: driverId,
            base64Image: result.assets[0].base64
          }),
        });

        const uploadResult = await response.json();
        
        if (uploadResult.success) {
          setProfileImage(uploadResult.url);
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

  const removeProfileImage = async () => {
    try {
      setIsUploadingPhoto(true);
      const driverId = user?.driver_id || user?.emp_id;

      const response = await authFetch(`${API_BASE_URL}/api/driver/remove-profile-photo`, {
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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Dashboard", { user });
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [navigation, user]);

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

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
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
                <MaterialIcons name="person" size={50} color={activeTheme.colors.surface} />
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
                style={{ color: isOnDuty ? activeTheme.colors.success : activeTheme.colors.error, marginBottom: 4 }}
              >
                {isOnDuty ? "ON DUTY" : "OFF DUTY"}
              </Typography>

              <Switch
                value={isOnDuty}
                onValueChange={handleToggleDutyStatus}
                disabled={isLoading}
                trackColor={{ false: activeTheme.colors.border, true: `${activeTheme.colors.success}80` }}
                thumbColor={isOnDuty ? activeTheme.colors.success : activeTheme.colors.surface}
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
              { backgroundColor: workStatus === 'Available' ? `${activeTheme.colors.success}20` : `${activeTheme.colors.warning}20` }
            ]}>
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: workStatus === 'Available' ? activeTheme.colors.success : activeTheme.colors.warning }}
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
              <MaterialIcons name={item.icon} size={22} color={activeTheme.colors.primary} />

              <Typography variant="body" style={styles.menuLabel}>
                {item.label}
              </Typography>

              <MaterialIcons name="chevron-right" size={20} color={activeTheme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* LOGOUT ACTION */}
        <View style={styles.logoutContainer}>
          <Button
            title={t("logout")}
            onPress={async () => {
              await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
              await AsyncStorage.removeItem("saved_user");
              await AsyncStorage.removeItem("saved_driver_id");
              await AsyncStorage.removeItem("remember_me");
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            }}
          />
        </View>

        <View style={{ height: activeTheme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

