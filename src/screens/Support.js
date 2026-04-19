import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function Support() {

  const handleCall = () => {
    Linking.openURL("tel:+94712345678");
  };

  const handleEmail = () => {
    Linking.openURL("mailto:logistics@example.com");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      
      

      {/* 🖼️ TOP IMAGE */}
      <Image
        source={require("../../assets/support.jpg")}
        style={{
          width: "100%",
          height: 240,
        }}
        resizeMode="cover"
      />

      {/* 📦 CONTENT CARD */}
      <View style={{
        flex: 1,
        backgroundColor: "#F5F7FB",
        marginTop: -40,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
      }}>

        {/* TITLE */}
        <Text style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 5
        }}>
          Contact Support
        </Text>

        <Text style={{
          color: "#6B7280",
          marginBottom: 20
        }}>
          Need help? Reach out to our logistics team anytime.
        </Text>

        {/* 📞 CALL CARD */}
        <TouchableOpacity
          onPress={handleCall}
          style={{
            backgroundColor: "#fff",
            padding: 18,
            borderRadius: 18,
            marginBottom: 15,
            flexDirection: "row",
            alignItems: "center",
            elevation: 3,
          }}
        >
          <MaterialIcons name="call" size={24} color="#2563EB" />
          <View style={{ marginLeft: 15 }}>
            <Text style={{ fontWeight: "600" }}>
              Call Support
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 12 }}>
              +94 71 234 5678
            </Text>
          </View>
        </TouchableOpacity>

        {/* ✉️ EMAIL CARD */}
        <TouchableOpacity
          onPress={handleEmail}
          style={{
            backgroundColor: "#fff",
            padding: 18,
            borderRadius: 18,
            flexDirection: "row",
            alignItems: "center",
            elevation: 3,
          }}
        >
          <MaterialIcons name="email" size={24} color="#16A34A" />
          <View style={{ marginLeft: 15 }}>
            <Text style={{ fontWeight: "600" }}>
              Email Support
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 12 }}>
              logistics@example.com
            </Text>
          </View>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}