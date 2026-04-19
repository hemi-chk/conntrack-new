import { View, Text, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function Documents() {
  const docs = [
    "BOI Clearance",
    "Gate Pass",
    "Port Documents",
  ];

  // 📥 Download function
  const handleDownload = (doc) => {
    Alert.alert("Download", `${doc} downloaded successfully`);
  };

  // ✅ Confirm all clearances
  const handleConfirmAll = () => {
    Alert.alert(
      "Clearance Confirmed",
      "All documents verified and logistics team notified"
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#F5F7FB" }}>

      {/* 🔝 TITLE */}
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
        Documents
      </Text>

      {/* 📄 DOCUMENT LIST */}
      {docs.map((doc, index) => (
        <View
          key={index}
          style={{
            backgroundColor: "#fff",
            padding: 18,
            borderRadius: 15,
            marginTop: 15,
            elevation: 3,
          }}
        >
          {/* 📄 Document Name */}
          <Text style={{ fontWeight: "600", marginBottom: 10 }}>
            {doc}
          </Text>

          {/* 📥 DOWNLOAD BUTTON */}
          <TouchableOpacity
            onPress={() => handleDownload(doc)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#E0EDFF",
              padding: 10,
              borderRadius: 10,
              alignSelf: "flex-start",
            }}
          >
            <MaterialIcons name="download" size={18} color="#2563EB" />
            <Text style={{ marginLeft: 5, color: "#2563EB" }}>
              Download
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* ✅ SINGLE CONFIRM BUTTON */}
      <TouchableOpacity
        onPress={handleConfirmAll}
        style={{
          marginTop: 30,
          backgroundColor: "#16A34A",
          padding: 15,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          Confirm Clearance
        </Text>
      </TouchableOpacity>

    </View>
  );
}