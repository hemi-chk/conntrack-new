import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";

export default function VehicleInfo() {

  const [licenseImage, setLicenseImage] = useState(null);

  const licenseExpiryDays = 12; // mock data (backend later)

  const pickDoc = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setLicenseImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 20 }}>

      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 15 }}>
        Vehicle Information
      </Text>

      {/* VEHICLE CARD */}
      <View style={{
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 15,
        marginBottom: 15
      }}>
        <Text style={{ fontWeight: "700" }}>Truck ID: TRK-9087</Text>
        <Text style={{ color: "#666", marginTop: 5 }}>
          Type: Heavy Duty Cargo Truck
        </Text>
        <Text style={{ color: "#666" }}>
          Plate No: WP-AB-1234
        </Text>
      </View>

      {/* LICENSE STATUS */}
      <View style={{
        backgroundColor: licenseExpiryDays < 15 ? "#FFF3CD" : "#fff",
        padding: 15,
        borderRadius: 15,
        marginBottom: 15
      }}>
        <Text style={{ fontWeight: "700" }}>
          Driving License Status
        </Text>

        <Text style={{ marginTop: 5 }}>
          Expires in: {licenseExpiryDays} days
        </Text>

        {licenseExpiryDays < 15 && (
          <Text style={{ color: "red", marginTop: 5 }}>
            ⚠ License expiring soon! Please update documents.
          </Text>
        )}
      </View>

      {/* DOCUMENT UPLOAD */}
      <View style={{
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 15,
        marginBottom: 15
      }}>
        <Text style={{ fontWeight: "700", marginBottom: 10 }}>
          Upload Vehicle Documents
        </Text>

        <TouchableOpacity
          onPress={pickDoc}
          style={{
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 10
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Upload License / RC / Insurance
          </Text>
        </TouchableOpacity>

        {licenseImage && (
          <Text style={{ marginTop: 10, color: "green" }}>
            Document uploaded successfully ✔
          </Text>
        )}
      </View>

    </ScrollView>
  );
}