import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function Settings({ navigation }) {
  const { t } = useTranslation();

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);

  const Row = ({ icon, title, subtitle, right }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderColor: "#eee",
      }}
    >
      <MaterialIcons name={icon} size={22} color="#2563EB" />

      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontWeight: "600" }}>{title}</Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: "#6B7280" }}>{subtitle}</Text>
        )}
      </View>

      {right}
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#F5F7FB" }}>

      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 20 }}>
        {t("settings")}
      </Text>

      {/* APPEARANCE */}
      <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 10, marginBottom: 15 }}>
        <Row
          icon="dark-mode"
          title="Dark Mode"
          subtitle="Reduce eye strain at night"
          right={<Switch value={darkMode} onValueChange={setDarkMode} />}
        />
      </View>

      {/* ALERTS */}
      <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 10, marginBottom: 15 }}>
        <Row
          icon="notifications"
          title="Notifications"
          subtitle="Order updates & system alerts"
          right={<Switch value={notifications} onValueChange={setNotifications} />}
        />

        <Row
          icon="volume-up"
          title="Sound Alerts"
          subtitle="Play sound for new jobs"
          right={<Switch value={soundAlerts} onValueChange={setSoundAlerts} />}
        />
      </View>

      {/* SYSTEM */}
      <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 10, marginBottom: 15 }}>
        <Row
          icon="location-on"
          title="Location Access"
          subtitle="Required for live tracking"
          right={<Switch value={locationAccess} onValueChange={setLocationAccess} />}
        />

        <TouchableOpacity onPress={() => navigation.navigate("Support")}>
          <Row
            icon="support-agent"
            title="Help & Support"
            subtitle="Contact our support team"
            right={<MaterialIcons name="chevron-right" size={22} color="#999" />}
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Row
            icon="security"
            title="Privacy & Security"
            subtitle="Password, data & account safety"
            right={<MaterialIcons name="chevron-right" size={22} color="#999" />}
          />
        </TouchableOpacity>
      </View>

      {/* INFO */}
      <View
        style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontWeight: "700" }}>App Information</Text>
        <Text style={{ color: "#6B7280", marginTop: 5, fontSize: 12 }}>
          Driver App v1.0.0 • Logistics Management System
        </Text>
      </View>

    </View>
  );
}