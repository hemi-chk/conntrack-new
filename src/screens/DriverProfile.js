import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export default function DriverProfile({ navigation }) {

  const [available, setAvailable] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  const { t } = useTranslation();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow access to gallery");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // MENU ITEMS 
  const menuItems = [
    { icon: "person", label: t("edit_profile"), screen: "EditProfile" },
    { icon: "directions-car", label: t("vehicle_info"), screen: "VehicleInfo" },
    { icon: "history", label: t("trip_history"), screen: "History" }, // 👈 ONLY LINK
    { icon: "settings", label: t("settings"), screen: "Settings" },
    { icon: "language", label: t("language"), screen: "Language" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Typography variant="h3" style={styles.headerTitle}>
            {t("profile")}
          </Typography>
        </View>

        {/* PROFILE */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage}>
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
          </TouchableOpacity>

          <Typography variant="h3" style={styles.driverName}>
            Driver Name
          </Typography>

          <Typography variant="body" color="textMuted">
            Logistics Driver
          </Typography>
        </View>

        {/* AVAILABILITY */}
        <Card elevation="sm" style={styles.availabilityCard}>
          <Typography variant="subtitle" weight="bold">
            {t("availability")}
          </Typography>

          <View style={styles.availabilityRow}>
            <Typography 
              variant="subtitle" 
              weight="semiBold" 
              style={{ color: available ? theme.colors.success : theme.colors.error }}
            >
              {available ? "Available" : "Not Available"}
            </Typography>

            <Switch 
              value={available} 
              onValueChange={setAvailable} 
              trackColor={{ false: theme.colors.border, true: `${theme.colors.success}80` }}
              thumbColor={available ? theme.colors.success : theme.colors.surface}
            />
          </View>
        </Card>

        {/* MENU */}
        <Card elevation="sm" style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(item.screen)}
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

        {/* LOGOUT */}
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
  menuCard: {
    marginHorizontal: theme.spacing.lg,
    padding: 0, // override card padding to let items stretch
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