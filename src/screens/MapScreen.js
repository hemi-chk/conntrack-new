import { View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MapScreen() {
  return (
    <View style={{ flex: 1 }}>

      {/* Full Map */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        <Marker coordinate={{ latitude: 6.9271, longitude: 79.8612 }} />
      </MapView>

      {/* Floating Bottom Card */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 20,
          elevation: 8,
        }}
      >
        <Text style={{ fontWeight: "600", fontSize: 16 }}>
          Next Stop
        </Text>
        <Text>Colombo Port</Text>

        <Text style={{ color: "green", marginTop: 5 }}>
          1 hr 12 min
        </Text>
      </View>
    </View>
  );
}