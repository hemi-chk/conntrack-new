import { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "../constants/colors";

export default function LoginScreen({ navigation }) {
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");

  // 🔐 Store password 
  const [storedPassword, setStoredPassword] = useState("1234");

  // 🔁 Toggle forgot-password options
  const [showReset, setShowReset] = useState(false);

  const handleLogin = () => {
    if (driverId === "D001" && password === storedPassword) {
      navigation.navigate("Dashboard");
    } else {
      Alert.alert("Login Failed", "Invalid Driver ID or Password");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", padding: 20 }}>

      {/* 🚚 TOP IMAGE */}
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <Image
          source={require("../../assets/truck.jpg")}
          style={{
            width: 220,
            height: 160,
            resizeMode: "contain",
          }}
        />
      </View>

      {/* 🧾 TITLE */}
      <Text
        style={{
          textAlign: "center",
          fontSize: 22,
          fontWeight: "700",
          marginTop: 20,
        }}
      >
        Welcome Back
      </Text>

      <Text
        style={{
          textAlign: "center",
          color: "#6B7280",
          marginBottom: 30,
          marginTop: 5,
        }}
      >
        Login to continue your journey
      </Text>

      {/* 🔄 LOGIN OR FORGOT PASSWORD OPTIONS */}
      {!showReset ? (
        <>
          {/* LOGIN FORM */}
          <TextInput
            placeholder="Driver ID"
            value={driverId}
            onChangeText={setDriverId}
            style={{
              backgroundColor: "#F3F4F6",
              padding: 16,
              borderRadius: 14,
              marginBottom: 15,
            }}
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              backgroundColor: "#F3F4F6",
              padding: 16,
              borderRadius: 14,
              marginBottom: 10,
            }}
          />

          <TouchableOpacity onPress={() => setShowReset(true)}>
            <Text
              style={{
                textAlign: "right",
                color: colors.primary,
                marginBottom: 25,
              }}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            style={{
              backgroundColor: colors.primary,
              padding: 18,
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* FORGOT PASSWORD OPTIONS */}
          <Text
            style={{
              textAlign: "center",
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 20,
            }}
          >
            Forgot Password
          </Text>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "OTP Sent",
                "A verification code has been sent to your registered phone/email."
              )
            }
            style={{
              backgroundColor: colors.primary,
              padding: 18,
              borderRadius: 14,
              marginBottom: 15,
            }}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Send OTP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Contact Support",
                "Please contact support@company.com to reset your password."
              )
            }
            style={{
              backgroundColor: "#F3F4F6",
              padding: 18,
              borderRadius: 14,
              marginBottom: 15,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                textAlign: "center",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Contact Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowReset(false)}>
            <Text
              style={{
                textAlign: "center",
                color: colors.primary,
                marginTop: 15,
              }}
            >
              Back to Login
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}