import React from "react";
import { View, Text, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function History() {

  const trips = [
    { id: "IMP-10234", route: "Colombo → Freezone", status: "Delivered" },
    { id: "EXP-77889", route: "Port → Warehouse", status: "Completed" },
    { id: "IMP-55678", route: "Airport → Colombo Port", status: "In Transit" },
    { id: "EXP-99821", route: "BOI → Export Port", status: "Delivered" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 20 }}>

      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 15 }}>
        Trip History
      </Text>

      {trips.map((trip, index) => (
        <View
          key={index}
          style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 12,
            marginBottom: 12,
            elevation: 2,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 15 }}>
            {trip.id}
          </Text>

          <Text style={{ color: "#6B7280", marginTop: 4 }}>
            {trip.route}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <MaterialIcons
              name="local-shipping"
              size={18}
              color={
                trip.status === "Delivered"
                  ? "green"
                  : trip.status === "In Transit"
                  ? "#2563EB"
                  : "#F59E0B"
              }
            />

            <Text style={{
              marginLeft: 6,
              fontWeight: "600",
              color:
                trip.status === "Delivered"
                  ? "green"
                  : trip.status === "In Transit"
                  ? "#2563EB"
                  : "#F59E0B"
            }}>
              {trip.status}
            </Text>
          </View>

        </View>
      ))}

    </ScrollView>
  );
}