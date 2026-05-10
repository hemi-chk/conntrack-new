/**
 * Login Screen
 * Handles user authentication and credential persistence.
 * Supports "Remember Me" functionality using local AsyncStorage.
 */

import { useState, useEffect } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { API_BASE_URL } from "../constants/config";

export default function LoginScreen({ navigation }) {
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Effect hook to retrieve saved credentials on initial app launch.
   * Ensures a faster login experience for returning users.
   */
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedId = await AsyncStorage.getItem("saved_driver_id");
        const savedPass = await AsyncStorage.getItem("saved_password");
        const savedRemember = await AsyncStorage.getItem("remember_me");

        if (savedRemember === "true") {
          if (savedId) setDriverId(savedId);
          if (savedPass) setPassword(savedPass);
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Error loading credentials:", error);
      }
    };
    loadCredentials();
  }, []);

  /**
   * Primary login handler. 
   * Authenticates against the backend and manages credential storage based on user preference.
   */
  const handleLogin = async () => {
    if (!driverId) {
      Alert.alert("Error", "Please enter your Driver ID / Reference");
      return;
    }

    try {
      setIsLoading(true);
      const fullUrl = `${API_BASE_URL}/api/driver/login`;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: driverId }),
      });

      const result = await response.json();

      if (result.success) {
        // Persist credentials locally if "Remember Me" is enabled
        if (rememberMe) {
          await AsyncStorage.setItem("saved_driver_id", driverId);
          await AsyncStorage.setItem("saved_password", password);
          await AsyncStorage.setItem("remember_me", "true");
        } else {
          // Clear credentials if "Remember Me" is disabled
          await AsyncStorage.removeItem("saved_driver_id");
          await AsyncStorage.removeItem("saved_password");
          await AsyncStorage.setItem("remember_me", "false");
        }

        // Navigate to the Dashboard and pass user object for context
        navigation.navigate("Dashboard", { user: result.user });
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (error) {
      console.log("Login Error:", error);
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.innerContainer}>
            {/* BRANDING SECTION */}
            <View style={styles.imageContainer}>
              <Image
                source={require("../../assets/truck.jpg")}
                style={styles.image}
              />
            </View>

            {/* HEADER TEXT */}
            <Typography variant="h2" align="center" style={styles.title}>
              Welcome Back
            </Typography>

            <Typography variant="body" color="textMuted" align="center" style={styles.subtitle}>
              Login to continue your journey
            </Typography>

            {/* AUTHENTICATION FORM */}
            {!showReset ? (
              <>
                <TextInput
                  placeholder="Driver ID / Reference"
                  value={driverId}
                  onChangeText={setDriverId}
                  style={styles.input}
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                />

                <TextInput
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  placeholderTextColor={theme.colors.textMuted}
                />

                {/* LOGIN PREFERENCES & HELP */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity 
                    style={styles.rememberMeContainer} 
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <MaterialIcons 
                      name={rememberMe ? "check-box" : "check-box-outline-blank"} 
                      size={20} 
                      color={rememberMe ? theme.colors.primary : theme.colors.textMuted} 
                    />
                    <Typography variant="caption" style={styles.rememberMeText}>
                      Remember Me
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowReset(true)}>
                    <Typography variant="caption" color="primary">
                      Forgot Password?
                    </Typography>
                  </TouchableOpacity>
                </View>

                <Button
                  title={isLoading ? "Logging in..." : "Login"}
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={styles.actionButton}
                />
              </>
            ) : (
              // PASSWORD RESET FLOW
              <>
                <Typography variant="subtitle" weight="semiBold" align="center" style={styles.resetTitle}>
                  Forgot Password
                </Typography>

                <Button
                  title="Send OTP"
                  onPress={() => Alert.alert("OTP Sent", "Code sent to your phone.")}
                  style={styles.actionButton}
                />

                <Button
                  title="Contact Support"
                  variant="secondary"
                  onPress={() => Alert.alert("Support", "Email: support@company.com")}
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
        </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    marginLeft: theme.spacing.xs,
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