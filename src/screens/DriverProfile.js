import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";
import { useTranslation } from "react-i18next";

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

  // MENU ITEMS (CLEAN)
  const menuItems = [
    { icon: "person", label: t("edit_profile"), screen: "EditProfile" },
    { icon: "directions-car", label: t("vehicle_info"), screen: "VehicleInfo" },
    { icon: "history", label: t("trip_history"), screen: "History" }, // 👈 ONLY LINK
    { icon: "settings", label: t("settings"), screen: "Settings" },
    { icon: "language", label: t("language"), screen: "Language" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>

      {/* HEADER */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        marginTop: 10
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} />
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: "700",
          marginLeft: 10
        }}>
          {t("profile")}
        </Text>
      </View>

      {/* PROFILE */}
      <View style={{
        alignItems: "center",
        marginBottom: 15
      }}>
        <TouchableOpacity onPress={pickImage}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={{ width: 90, height: 90, borderRadius: 50 }}
            />
          ) : (
            <View style={{
              width: 90,
              height: 90,
              borderRadius: 50,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center"
            }}>
              <MaterialIcons name="person" size={50} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "700", marginTop: 8 }}>
          Driver Name
        </Text>

        <Text style={{ color: "#6B7280" }}>
          Logistics Driver
        </Text>
      </View>

      {/* AVAILABILITY */}
      <View style={{
        backgroundColor: "#fff",
        marginHorizontal: 20,
        borderRadius: 15,
        padding: 15,
        elevation: 2
      }}>
        <Text style={{ fontWeight: "700" }}>
          {t("availability")}
        </Text>

        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
          alignItems: "center"
        }}>
          <Text style={{
            fontWeight: "600",
            color: available ? "green" : "red"
          }}>
            {available ? "Available" : "Not Available"}
          </Text>

          <Switch value={available} onValueChange={setAvailable} />
        </View>
      </View>

      {/* MENU */}
      <View style={{
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginTop: 15,
        borderRadius: 15,
        elevation: 2
      }}>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate(item.screen)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 15,
              borderBottomWidth: index !== menuItems.length - 1 ? 0.5 : 0,
              borderColor: "#eee"
            }}
          >
            <MaterialIcons name={item.icon} size={22} color={colors.primary} />

            <Text style={{ marginLeft: 15, flex: 1 }}>
              {item.label}
            </Text>

            <MaterialIcons name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        ))}

      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        style={{
          backgroundColor: colors.primary,
          margin: 20,
          padding: 15,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          {t("logout")}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}