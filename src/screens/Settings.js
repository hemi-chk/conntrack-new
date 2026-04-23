import React, { useState } from "react";
import { View, Switch, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";

export default function Settings({ navigation }) {
  const { t } = useTranslation();

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);

  const Row = ({ icon, title, subtitle, right, isLast }) => (
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
  );

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

        {/* APPEARANCE */}
        <Card elevation="sm" style={styles.card}>
          <Row
            icon="dark-mode"
            title="Dark Mode"
            subtitle="Reduce eye strain at night"
            isLast={true}
            right={
              <Switch 
                value={darkMode} 
                onValueChange={setDarkMode}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor={darkMode ? theme.colors.primary : theme.colors.surface}
              />
            }
          />
        </Card>

        {/* ALERTS */}
        <Card elevation="sm" style={styles.card}>
          <Row
            icon="notifications"
            title="Notifications"
            subtitle="Order updates & system alerts"
            right={
              <Switch 
                value={notifications} 
                onValueChange={setNotifications} 
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
                onValueChange={setSoundAlerts} 
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor={soundAlerts ? theme.colors.primary : theme.colors.surface}
              />
            }
          />
        </Card>

        {/* SYSTEM */}
        <Card elevation="sm" style={styles.card}>
          <Row
            icon="location-on"
            title="Location Access"
            subtitle="Required for live tracking"
            right={
              <Switch 
                value={locationAccess} 
                onValueChange={setLocationAccess} 
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
                thumbColor={locationAccess ? theme.colors.primary : theme.colors.surface}
              />
            }
          />

          <TouchableOpacity onPress={() => navigation.navigate("Support")}>
            <Row
              icon="support-agent"
              title="Help & Support"
              subtitle="Contact our support team"
              right={<MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
            />
          </TouchableOpacity>

          <TouchableOpacity>
            <Row
              icon="security"
              title="Privacy & Security"
              subtitle="Password, data & account safety"
              isLast={true}
              right={<MaterialIcons name="chevron-right" size={22} color={theme.colors.textMuted} />}
            />
          </TouchableOpacity>
        </Card>

        {/* INFO */}
        <Card elevation="sm" style={styles.card}>
          <Typography variant="body" weight="semiBold">App Information</Typography>
          <Typography variant="tiny" color="textMuted" style={{ marginTop: 4 }}>
            Driver App v1.0.0 • Logistics Management System
          </Typography>
        </Card>

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
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.lg,
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
  }
});