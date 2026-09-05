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
import { useTheme } from "../constants/theme";
import { AUTH_TOKEN_KEY } from "../utils/authFetch";

export default function LoginScreen({ navigation }) {
  const { theme: activeTheme } = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.surface,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    innerContainer: {
      flex: 1,
      padding: activeTheme.spacing.lg,
      justifyContent: "center",
    },
    backButton: {
      position: "absolute",
      top: 8,
      left: activeTheme.spacing.lg,
      zIndex: 1,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: activeTheme.colors.background,
    },
    imageContainer: {
      alignItems: "center",
      marginBottom: activeTheme.spacing.lg,
    },
    image: {
      width: 220,
      height: 160,
      resizeMode: "contain",
    },
    title: {
      marginBottom: activeTheme.spacing.xs,
    },
    subtitle: {
      marginBottom: activeTheme.spacing.xl,
    },
    input: {
      backgroundColor: activeTheme.colors.background,
      padding: activeTheme.spacing.md,
      borderRadius: activeTheme.roundness.md,
      marginBottom: activeTheme.spacing.md,
      color: activeTheme.colors.text,
      fontFamily: activeTheme.typography.fontFamily.regular,
      fontSize: activeTheme.typography.sizes.md,
    },
    driverIdContainer: {
      marginBottom: activeTheme.spacing.md,
    },
    driverIdInput: {
      marginBottom: 0,
    },
    suggestion: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginTop: activeTheme.spacing.xs,
      paddingVertical: activeTheme.spacing.xs,
      paddingHorizontal: activeTheme.spacing.sm,
      borderRadius: activeTheme.roundness.sm,
      backgroundColor: "#DBEAFE",
    },
    suggestionText: {
      marginLeft: activeTheme.spacing.xs,
    },
    optionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: activeTheme.spacing.xl,
    },
    rememberMeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    rememberMeText: {
      marginLeft: activeTheme.spacing.xs,
    },
    actionButton: {
      marginBottom: activeTheme.spacing.md,
    },
    resetTitle: {
      marginBottom: activeTheme.spacing.lg,
    },
    resetDescription: {
      marginBottom: activeTheme.spacing.lg,
    },
    backToLogin: {
      marginTop: activeTheme.spacing.md,
    },
    passwordInputContainer: {
      position: "relative",
    },
    passwordInput: {
      paddingRight: 44,
    },
    showPasswordButton: {
      position: "absolute",
      right: 12,
      top: 12,
      height: 32,
      width: 32,
      justifyContent: "center",
      alignItems: "center",
    },
  });

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

  const loginWithPassword = async (loginDriverId, loginPassword) => {
    if (!loginDriverId || !loginPassword) {
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
          driverId: loginDriverId,
          password: loginPassword
        }),
      });

      const result = await response.json();

      if (result.success) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.token);
        await AsyncStorage.setItem("driver_token", result.token);
        await AsyncStorage.setItem("last_driver_id", loginDriverId);
        // Persist credentials locally if "Remember Me" is enabled
        if (rememberMe) {
          await AsyncStorage.setItem("saved_driver_id", loginDriverId);
          await AsyncStorage.setItem("saved_user", JSON.stringify(result.user));
          await AsyncStorage.setItem("remember_me", "true");
          try {
            await SecureStore.setItemAsync(`saved_password_${loginDriverId}`, loginPassword);
          } catch (err) {
            console.warn('Could not save password to secure store:', err);
          }
        } else {
          await AsyncStorage.removeItem("saved_driver_id");
          await AsyncStorage.removeItem("saved_user");
          await AsyncStorage.setItem("remember_me", "false");
          try {
            await SecureStore.deleteItemAsync(`saved_password_${loginDriverId}`);
          } catch (err) {
            // ignore
          }
        }

        navigation.navigate("Dashboard", { user: result.user });
      } else {
        if (rememberMe) {
          await SecureStore.deleteItemAsync(`saved_password_${loginDriverId}`);
          await AsyncStorage.setItem("remember_me", "false");
          setRememberMe(false);
          setPassword("");
        }
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (error) {
      console.log("Login Error:", error);
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => loginWithPassword(driverId.trim(), password);

  const openReset = () => setShowReset(true);

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
              <MaterialIcons name="arrow-back" size={22} color={activeTheme.colors.primary} />
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
                    placeholderTextColor={activeTheme.colors.textMuted}
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
                      <MaterialIcons name="person-outline" size={17} color={activeTheme.colors.primary} />
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
                    placeholderTextColor={activeTheme.colors.textMuted}
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
                      color={activeTheme.colors.textMuted}
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
                      color={rememberMe ? activeTheme.colors.primary : activeTheme.colors.textMuted}
                    />
                    <Typography variant="caption" style={styles.rememberMeText}>
                      Remember Me
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={openReset}>
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
                  Contact Your Administrator
                </Typography>

                <Typography variant="body" color="textMuted" align="center" style={styles.resetDescription}>
                  Please contact your dispatcher or administrator to reset your password. They will provide a temporary password, and you should change it after signing in.
                </Typography>

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

const styles = StyleSheet.create
