import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRef } from "react";
import {
    Animated,
    ImageBackground,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AUTH_TOKEN_KEY } from "../utils/authFetch";

export default function IntroScreen({ navigation }) {
  const continueFromIntro = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const savedUser = await AsyncStorage.getItem("saved_user");
      const savedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

      if (savedToken && savedUser) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Dashboard", params: { user: JSON.parse(savedUser) } }],
        });
        return;
      }
    } catch (error) {
      console.error("Error checking saved session:", error);
    }

    navigation.navigate("Login");
  };

  const swipePosition = useRef(new Animated.Value(0)).current;
  const swipeTravel = 190;
  
  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dx > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      onPanResponderMove: (_, gestureState) => {
        swipePosition.setValue(Math.max(0, Math.min(swipeTravel, gestureState.dx)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= swipeTravel * 0.70) {
          Animated.timing(swipePosition, {
            toValue: swipeTravel,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            continueFromIntro();
          });
          return;
        }

        Animated.spring(swipePosition, {
          toValue: 0,
          useNativeDriver: false,
          tension: 90,
          friction: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipePosition, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  return (
    <ImageBackground
      source={require("../../assets/WhatsApp Image 2026-08-25 at 3.42.37 AM.jpeg")}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      {/* Layered Gradient & Backdrop Overlay */}
      <View style={styles.topGradientOverlay} />
      <View style={styles.darkOverlay} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Brand Header */}
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>C</Text>
            </View>
            <View>
              <Text style={styles.brandName}>ConnTrack</Text>
              <Text style={styles.brandSubtitle}>LOGISTICS NETWORK</Text>
            </View>
          </View>

          {/* Bottom Hero Content Block */}
          <View style={styles.copyBlock}>
            <Text style={styles.welcome}>WELCOME</Text>
            <Text style={[styles.welcome, styles.welcomeAccent]}>BACK</Text>
            
            <Text style={styles.subtitle}>
              Container Transport & Route Management System for drivers, dispatchers, and terminals.
            </Text>

            {/* Interactive Swipe Track */}
            <View
              {...swipeResponder.panHandlers}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Slide to continue"
              accessibilityHint="Swipe right to open the login screen"
              style={styles.swipeTrack}
            >
              <Animated.View
                style={[
                  styles.swipeProgress,
                  { width: Animated.add(swipePosition, 42) }
                ]}
              />

              <Text style={styles.swipeText}>Slide to continue</Text>
              
              <Animated.View
                style={[styles.swipeHandle, { transform: [{ translateX: swipePosition }] }]}
              >
                <Text style={styles.swipeArrow}>→</Text>
              </Animated.View>
            </View>

            {/* Tap Fallback */}
            <TouchableOpacity 
              onPress={continueFromIntro}
              activeOpacity={0.7}
              style={styles.tapFallback}
            >
              <Text style={styles.tapFallbackText}>or tap here to sign in →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>DRIVER PORTAL  /  v1.0</Text>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  topGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 25, 47, 0.40)",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 14, 34, 0.65)",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 50,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 12,
  },
  logoText: {
    color: "#1E40AF",
    fontSize: 26,
    fontWeight: "900",
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  brandSubtitle: {
    color: "#93C5FD",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 1,
  },
  copyBlock: {
    maxWidth: 320,
  },
  welcome: {
    color: "#FFFFFF",
    fontSize: 44,
    lineHeight: 46,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  welcomeAccent: {
    color: "#60A5FA",
  },
  subtitle: {
    marginTop: 16,
    color: "#CBD5E1",
    fontSize: 13.5,
    lineHeight: 21,
  },
  swipeTrack: {
    flexDirection: "row",
    alignItems: "center",
    width: 248,
    height: 52,
    marginTop: 26,
    padding: 5,
    borderRadius: 26,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(96, 165, 250, 0.5)",
    position: "relative",
    overflow: "hidden",
  },
  swipeProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(37, 99, 235, 0.45)",
    borderRadius: 26,
  },
  swipeText: {
    flex: 1,
    marginLeft: 20,
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    zIndex: 2,
  },
  swipeHandle: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 3,
  },
  swipeArrow: {
    color: "#1E40AF",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 22,
  },
  tapFallback: {
    marginTop: 14,
    paddingVertical: 4,
  },
  tapFallbackText: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "600",
  },
  version: {
    position: "absolute",
    right: 28,
    bottom: 25,
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
  },
});