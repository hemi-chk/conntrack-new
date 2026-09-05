/**
 * Login Screen
 * Handles user authentication and credential persistence.
 * Supports "Remember Me" functionality using local AsyncStorage.
 */

import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Typography } from "../components/Typography";
import { API_BASE_URL } from "../constants/config";
import { theme } from "../constants/theme";
import { AUTH_TOKEN_KEY } from "../utils/authFetch";

export default function LoginScreen({ navigation }) {
  const [driverId, setDriverId] = useState("");
  const [suggestedDriverId, setSuggestedDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedId = await AsyncStorage.getItem("saved_driver_id");
        const lastDriverId = await AsyncStorage.getItem("last_driver_id");
        const savedRemember = await AsyncStorage.getItem("remember_me");
        const savedUser = await AsyncStorage.getItem("saved_user");
        const savedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (savedId || lastDriverId) {
          setSuggestedDriverId(savedId || lastDriverId);
        }
        if (savedRemember === "true") {
          if (savedToken && savedUser) {
            navigation.reset({
              index: 0,
              routes: [{ name: "Dashboard", params: { user: JSON.parse(savedUser) } }],
            });
            return;
          }

          if (savedId) {
            const savedPassword = await SecureStore.getItemAsync(`saved_password_${savedId}`);
            if (savedPassword) setPassword(savedPassword);
          }
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Error loading credentials:", error);
      }
    };
    loadCredentials();
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.replace("Intro");
      return true;
    };

    const backSubscription = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => backSubscription.remove();
  }, [navigation]);

  useEffect(() => {
    const loadPasswordForDriver = async () => {
      if (!rememberMe || !driverId) return;
      try {
        const savedPassword = await SecureStore.getItemAsync(`saved_password_${driverId}`);
        if (savedPassword) setPassword(savedPassword);
      } catch (err) {
        console.error('Error loading saved password for driver:', err);
      }
    };
    loadPasswordForDriver();
  }, [driverId, rememberMe]);

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
        body: JSON.stringify({ 
          driverId: driverId,
          password: password
        }),
      });

      const result = await response.json();

      if (result.success) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.token);
        await AsyncStorage.setItem("last_driver_id", driverId);

        // Persist credentials locally if "Remember Me" is enabled
        if (rememberMe) {
          await AsyncStorage.setItem("saved_driver_id", driverId);
          await AsyncStorage.setItem("saved_user", JSON.stringify(result.user));
          await AsyncStorage.setItem("remember_me", "true");
          try {
            await SecureStore.setItemAsync(`saved_password_${driverId}`, password);
          } catch (err) {
            console.warn('Could not save password to secure store:', err);
          }
        } else {
          await AsyncStorage.removeItem("saved_driver_id");
          await AsyncStorage.removeItem("saved_user");
          await AsyncStorage.setItem("remember_me", "false");
          try {
            await SecureStore.deleteItemAsync(`saved_password_${driverId}`);
          } catch (err) {
            // ignore
          }
        }

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
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Back to intro"
              onPress={() => navigation.replace("Intro")}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={22} color={theme.colors.primary} />
            </TouchableOpacity>

            <View style={styles.imageContainer}>
              <Image
                source={require("../../assets/truck.jpg")}
                style={styles.image}
              />
            </View>

            <Typography variant="h2" align="center" style={styles.title}>
              Welcome Back
            </Typography>

            <Typography variant="body" color="textMuted" align="center" style={styles.subtitle}>
              Login to continue your journey
            </Typography>

            {!showReset ? (
              <>
                <View style={styles.driverIdContainer}>
                  <TextInput
                    placeholder="Driver ID / Reference"
                    value={driverId}
                    onChangeText={setDriverId}
                    style={[styles.input, styles.driverIdInput]}
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    autoComplete="username"
                  />
                  {suggestedDriverId && driverId !== suggestedDriverId ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Use suggested Driver ID ${suggestedDriverId}`}
                      onPress={() => setDriverId(suggestedDriverId)}
                      style={styles.suggestion}
                    >
                      <MaterialIcons name="person-outline" size={17} color={theme.colors.primary} />
                      <Typography variant="caption" color="primary" style={styles.suggestionText}>
                        Use {suggestedDriverId}
                      </Typography>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.passwordInputContainer}>
                  <TextInput
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={[styles.input, styles.passwordInput]}
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.showPasswordButton}
                    onPress={() => setShowPassword(!showPassword)}
                    accessible
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={22}
                      color={theme.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

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
  backButton: {
    position: "absolute",
    top: 8,
    left: theme.spacing.lg,
    zIndex: 1,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: theme.colors.background,
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
  driverIdContainer: {
    marginBottom: theme.spacing.md,
  },
  driverIdInput: {
    marginBottom: 0,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.roundness.sm,
    backgroundColor: "#DBEAFE",
  },
  suggestionText: {
    marginLeft: theme.spacing.xs,
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
  ,
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    height: 32,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
