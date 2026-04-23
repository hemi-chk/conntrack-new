import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Typography } from "../components/Typography";
import { theme } from "../constants/theme";

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.innerContainer}>
          {/* 🚚 TOP IMAGE */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/truck.jpg")}
              style={styles.image}
            />
          </View>

          {/* 🧾 TITLE */}
          <Typography variant="h2" align="center" style={styles.title}>
            Welcome Back
          </Typography>

          <Typography variant="body" color="textMuted" align="center" style={styles.subtitle}>
            Login to continue your journey
          </Typography>

          {/* 🔄 LOGIN OR FORGOT PASSWORD OPTIONS */}
          {!showReset ? (
            <>
              {/* LOGIN FORM */}
              <TextInput
                placeholder="Driver ID"
                value={driverId}
                onChangeText={setDriverId}
                style={styles.input}
                placeholderTextColor={theme.colors.textMuted}
              />

              <TextInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor={theme.colors.textMuted}
              />

              <TouchableOpacity onPress={() => setShowReset(true)}>
                <Typography variant="caption" color="primary" align="right" style={styles.forgotPassword}>
                  Forgot Password?
                </Typography>
              </TouchableOpacity>

              <Button
                title="Login"
                onPress={handleLogin}
                style={styles.actionButton}
              />
            </>
          ) : (
            <>
              {/* FORGOT PASSWORD OPTIONS */}
              <Typography variant="subtitle" weight="semiBold" align="center" style={styles.resetTitle}>
                Forgot Password
              </Typography>

              <Button
                title="Send OTP"
                onPress={() =>
                  Alert.alert(
                    "OTP Sent",
                    "A verification code has been sent to your registered phone/email."
                  )
                }
                style={styles.actionButton}
              />

              <Button
                title="Contact Support"
                variant="secondary"
                onPress={() =>
                  Alert.alert(
                    "Contact Support",
                    "Please contact support@company.com to reset your password."
                  )
                }
                style={styles.actionButton}
              />

              <TouchableOpacity onPress={() => setShowReset(false)}>
                <Typography variant="caption" color="primary" align="center" style={styles.backToLogin}>
                  Back to Login
                </Typography>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  image: {
    width: 220,
    height: 160,
    resizeMode: "contain",
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.xl,
  },
  input: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.md,
  },
  forgotPassword: {
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  resetTitle: {
    marginBottom: theme.spacing.lg,
  },
  backToLogin: {
    marginTop: theme.spacing.md,
  }
});