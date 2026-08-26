import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRef } from "react";
import {
    Animated,
    ImageBackground,
    PanResponder,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AUTH_TOKEN_KEY } from "../utils/authFetch";

export default function IntroScreen({ navigation }) {
  const continueFromIntro = async () => {
    try {
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
  const swipeTravel = 176;
  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dx > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        swipePosition.setValue(Math.max(0, Math.min(swipeTravel, gestureState.dx)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= swipeTravel * 0.72) {
          continueFromIntro();
          return;
        }

        Animated.spring(swipePosition, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipePosition, {
          toValue: 0,
          useNativeDriver: true,
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
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.brandName}>ConnTrack</Text>
        </View>

          <View style={styles.copyBlock}>
            <Text style={styles.welcome}>WELCOME</Text>
            <Text style={styles.welcome}>BACK</Text>
            <Text style={styles.subtitle}>
              Container Transport Management System for routes, fleets, and BOI operations.
            </Text>

            <View
              {...swipeResponder.panHandlers}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Slide to continue"
              accessibilityHint="Swipe right to open the login screen"
              style={styles.swipeTrack}
            >
              <Text style={styles.swipeText}>Slide to continue</Text>
              <Animated.View
                style={[styles.swipeHandle, { transform: [{ translateX: swipePosition }] }]}
              >
                <Text style={styles.swipeArrow}>→</Text>
              </Animated.View>
            </View>
          </View>
        </View>

        <Text style={styles.version}>DRIVER PORTAL  /  01</Text>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 16, 43, 0.48)",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 54,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#F7FAFF",
  },
  logoText: {
    color: "#1D5AC7",
    fontSize: 23,
    fontWeight: "800",
  },
  brandName: {
    marginLeft: 10,
    color: "#F7FAFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  copyBlock: {
    maxWidth: 300,
  },
  welcome: {
    color: "#FFFFFF",
    fontSize: 42,
    lineHeight: 43,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  subtitle: {
    marginTop: 18,
    color: "#A9BBD7",
    fontSize: 13,
    lineHeight: 20,
  },
  swipeTrack: {
    flexDirection: "row",
    alignItems: "center",
    width: 230,
    marginTop: 22,
    padding: 5,
    borderRadius: 24,
    backgroundColor: "rgba(8, 39, 82, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(112, 210, 255, 0.65)",
  },
  swipeText: {
    flex: 1,
    marginLeft: 17,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    opacity: 0.9,
  },
  swipeHandle: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#E8F5FF",
  },
  swipeArrow: {
    color: "#1262B5",
    fontSize: 18,
    lineHeight: 19,
  },
  version: {
    position: "absolute",
    right: 28,
    bottom: 25,
    color: "#B4C8E3",
    fontSize: 9,
    letterSpacing: 1.1,
  },
});