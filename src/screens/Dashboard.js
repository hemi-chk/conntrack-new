import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";
import { useTranslation } from "react-i18next";

export default function Dashboard({ navigation }) {
  const { t } = useTranslation();

  // 🔔 ALERTS (DO NOT TRANSLATE TEXT HERE)
  const alerts = [
    {
      id: 1,
      text: "New delivery assigned",
      type: "info",
      icon: "local-shipping"
    },
    {
      id: 2,
      text: "Documents verified successfully",
      type: "success",
      icon: "check-circle"
    },
    {
      id: 3,
      text: "Route delay due to traffic",
      type: "warning",
      icon: "warning"
    }
  ];

  const quickActions = [
    { icon: "local-shipping", label: t("tracking"), screen: "Tracking" },
    { icon: "notifications-active", label: t("alerts"), screen: "Notifications" },
    { icon: "description", label: t("docs"), screen: "Documents" },
    { icon: "support-agent", label: t("help"), screen: "Support" },
  ];

  const getColor = (type) => {
    if (type === "success") return "#16A34A";
    if (type === "warning") return "#F59E0B";
    return "#2563EB";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>

      <ScrollView style={{ flex: 1, padding: 20 }}>

        {/* HEADER */}
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700" }}>
              {t("welcome_driver")}
            </Text>
            <Text style={{ color: "#6B7280" }}>
              Ready for your next job
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <View style={{
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 50,
              elevation: 3,
            }}>
              <MaterialIcons name="person" size={24} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 🚚 CURRENT JOB */}
        <View style={{
          backgroundColor: colors.primary,
          padding: 20,
          borderRadius: 20,
          marginBottom: 20,
          elevation: 4
        }}>
          <Text style={{ color: "#fff", opacity: 0.8 }}>
            {t("current_job")}
          </Text>

          <Text style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "700",
            marginTop: 5,
          }}>
            IMP-12345
          </Text>

          <Text style={{ color: "#E5E7EB", marginTop: 5 }}>
            Freezone → Colombo Port
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("OrderDetails")}
            style={{
              backgroundColor: "#fff",
              marginTop: 15,
              padding: 12,
              borderRadius: 10,
            }}
          >
            <Text style={{
              textAlign: "center",
              color: colors.primary,
              fontWeight: "600"
            }}>
              {t("view_details")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ⚡ QUICK ACTIONS */}
        <Text style={{
          fontWeight: "700",
          marginBottom: 10
        }}>
          {t("quick_actions")}
        </Text>

        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 20,
        }}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(item.screen)}
              style={{ alignItems: "center", width: "22%" }}
            >
              <View style={{
                backgroundColor: "#fff",
                padding: 15,
                borderRadius: 15,
                elevation: 3,
                marginBottom: 5,
              }}>
                <MaterialIcons
                  name={item.icon}
                  size={26}
                  color={colors.primary}
                />
              </View>

              <Text style={{ fontSize: 12, textAlign: "center" }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔔 ALERTS */}
        <Text style={{
          fontWeight: "700",
          marginBottom: 10
        }}>
          {t("alerts")}
        </Text>

        {alerts.map((alert) => (
          <View
            key={alert.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: 15,
              borderRadius: 15,
              marginBottom: 10,
              elevation: 2,
            }}
          >
            <View style={{
              backgroundColor: `${getColor(alert.type)}20`,
              padding: 10,
              borderRadius: 10,
              marginRight: 10
            }}>
              <MaterialIcons
                name={alert.icon}
                size={20}
                color={getColor(alert.type)}
              />
            </View>

            <Text style={{ flex: 1 }}>
              {alert.text}
            </Text>
          </View>
        ))}

        {/* VIEW ALL ALERTS */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          style={{
            marginTop: 5,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#E5E7EB"
          }}
        >
          <Text style={{
            textAlign: "center",
            color: colors.primary,
            fontWeight: "600"
          }}>
            {t("view_all_alerts")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

      </ScrollView>
    </View>
  );
}