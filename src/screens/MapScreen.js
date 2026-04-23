import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Card } from "../components/Card";

export default function MapScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Full Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        <Marker coordinate={{ latitude: 6.9271, longitude: 79.8612 }}>
          <MaterialIcons name="location-on" size={35} color={theme.colors.primary} />
        </Marker>
      </MapView>

      {/* Floating Back Button */}
      <SafeAreaView style={styles.backButtonContainer} edges={["top"]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Floating Bottom Card */}
      <Card elevation="lg" style={styles.bottomCard}>
        <Typography variant="h3" weight="bold">
          Next Stop
        </Typography>
        <Typography variant="body" color="textMuted">
          Colombo Port
        </Typography>

        <Typography variant="body" color="success" style={styles.etaText}>
          1 hr 12 min
        </Typography>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  backButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  bottomCard: {
    position: "absolute",
    bottom: theme.spacing.xl,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  etaText: {
    marginTop: theme.spacing.xs,
  },
});