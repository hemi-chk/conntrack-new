/**
 * Settings Screen
 * Manages user preferences including theme, notification toggles, and system permissions.
 * Persists settings locally using AsyncStorage.
 */

import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Typography } from "../components/Typography";
import { theme } from "../constants/theme";
import { AUTH_TOKEN_KEY } from "../utils/authFetch";

export default function Settings({ route, navigation }) {
  const { t } = useTranslation();
  const user = route?.params?.user || {};

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem("settings_darkMode");
        const savedNotif = await AsyncStorage.getItem("settings_notifications");
        const savedSound = await AsyncStorage.getItem("settings_sound");
        const savedLoc = await AsyncStorage.getItem("settings_location");

        if (savedDarkMode !== null) setDarkMode(savedDarkMode === "true");
        if (savedNotif !== null) setNotifications(savedNotif === "true");
        if (savedSound !== null) setSoundAlerts(savedSound === "true");
        if (savedLoc !== null) setLocationAccess(savedLoc === "true");
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t("logout_title") || "Logout",
      t("logout_confirm") || "Are you sure you want to logout?",
      [
        { text: t("cancel") || "Cancel", style: "cancel" },
        { 
          text: t("logout") || "Logout", 
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            await AsyncStorage.removeItem("saved_driver_id");
            await AsyncStorage.removeItem("saved_user");
            await AsyncStorage.removeItem("saved_password");
            await AsyncStorage.removeItem("remember_me");
            await AsyncStorage.removeItem("driver_token");
            
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }
        },
      ]
    );
  };

  const Row = ({ icon, title, subtitle, right, isLast, onPress }) => (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <View style={[styles.row, !isLast && styles.rowBorder]}>
        <MaterialIcons name={icon} size={22} color={theme.colors.primary} />
        <View style={styles.rowTextContainer}>
          <Typography variant="body" weight="semiBold">{title}</Typography>
          {subtitle && (
            <Typography variant="tiny" color="textMuted" style={{ marginTop: 2 }}>{subtitle}</Typography>
          )}
        </View>
        {right}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>
            {t("settings")}
          </Typography>
        </View>

        <Typography variant="caption" color="textMuted" style={styles.sectionTitle}>APPEARANCE</Typography>
        <Card elevation="sm" style={styles.card}>
          <Row
            icon="dark-mode"
            title="Dark Mode"
            subtitle="Reduce eye strain at night"
            isLast={true}
            right={
              <Switch 
                value={darkMode} 
                onValueChange={(val) => { setDarkMode(val); saveSetting("settings_darkMode", val); }}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor={darkMode ? theme.colors.primary : theme.colors.surface}
              />
            }
          />
        </Card>

        <Typography variant="caption" color="textMuted" style={styles.sectionTitle}>ALERTS & NOTIFICATIONS</Typography>
        <Card elevation="sm" style={styles.card}>
          <Row
            icon="notifications"
            title="Notifications"
            subtitle="Order updates & system alerts"
            right={
              <Switch 
                value={notifications} 
                onValueChange={(val) => { setNotifications(val); saveSetting("settings_notifications", val); }}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor={notifications ? theme.colors.primary : theme.colors.surface}
              />
            }
          />

          <Row
            icon="volume-up"
            title="Sound Alerts"
            subtitle="Play sound for new jobs"
            isLast={true}
            right={
              <Switch 
                value={soundAlerts} 
                onValueChange={(val) => { setSoundAlerts(val); saveSetting("settings_sound", val); }}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor={soundAlerts ? theme.colors.primary : theme.colors.surface}
              />
            }
          />
        </Card>

        <Typography variant="caption" color="textMuted" style={styles.sectionTitle}>SYSTEM & SUPPORT</Typography>
        <Card elevation="sm" style={styles.card}>
          <Row
            icon="location-on"
            title="Location Access"
            subtitle="Required for live tracking"
            right={
              <Switch 
                value={locationAccess} 
                onValueChange={(val) => { setLocationAccess(val); saveSetting("settings_location", val); }}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor={locationAccess ? theme.colors.primary : theme.colors.surface}
              />
            }
          />

          <Row
            icon="support-agent"
            title="Help & Support"
            subtitle="Contact our support team"
            onPress={() => navigation.navigate("Support", { user })}
            right={<MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
          />

          <Row
            icon="security"
            title="Privacy & Security"
            subtitle="Password, data & account safety"
            isLast={true}
            onPress={() => Alert.alert("Privacy", "Security features coming soon!")}
            right={<MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
          />
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color={theme.colors.error} />
          <Typography variant="body" weight="semiBold" style={styles.logoutText}>
            Logout Account
          </Typography>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Typography variant="tiny" color="textMuted">
            Driver App v1.0.0
          </Typography>
          <Typography variant="tiny" color="textMuted">
            Logistics Management System • ConnTrack
          </Typography>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
  },
  sectionTitle: {
    marginLeft: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  card: {
    marginBottom: theme.spacing.xl,
    paddingVertical: 0,
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  rowTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${theme.colors.error}10`,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.error}30`,
  },
  logoutText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.error,
  },
  infoContainer: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  }
});
