import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useOrder } from "../context/OrderContext";

export default function OrderDetails() {
  const { orderStatus, setOrderStatus } = useOrder();
  const { t } = useTranslation();

  const order = {
    id: "IMP-12345",
    pickup: {
      name: "Freezone Warehouse",
      latitude: 6.933,
      longitude: 79.85
    },
    drop: {
      name: "Colombo Port",
      latitude: 6.948,
      longitude: 79.873
    },
    instructions: "Fragile items. Handle with care.",
    eta: "1 hr 12 min"
  };

  const route = [
    { latitude: 6.933, longitude: 79.85 },
    { latitude: 6.936, longitude: 79.855 },
    { latitude: 6.939, longitude: 79.86 },
    { latitude: 6.942, longitude: 79.865 },
    { latitude: 6.945, longitude: 79.87 },
    { latitude: 6.948, longitude: 79.873 }
  ];

  const [vehiclePos, setVehiclePos] = useState(order.pickup);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (orderStatus !== "transit") return;

    const interval = setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next < route.length) {
          setVehiclePos(route[next]);
          return next;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [orderStatus]);

  return (
    <View style={{ flex: 1 }}>

      {/* MAP */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 6.94,
          longitude: 79.86,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }}
      >
        <Marker coordinate={vehiclePos}>
          <MaterialIcons name="local-shipping" size={35} color="#2563EB" />
        </Marker>

        <Marker coordinate={order.pickup}>
          <MaterialIcons name="location-on" size={30} color="green" />
        </Marker>

        <Marker coordinate={order.drop}>
          <MaterialIcons name="flag" size={30} color="red" />
        </Marker>

        <Polyline coordinates={route} strokeWidth={4} strokeColor="#2563EB" />
      </MapView>

      {/* BOTTOM SHEET */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20
      }}>

        {/* HANDLE */}
        <View style={{
          width: 50,
          height: 5,
          backgroundColor: "#ddd",
          alignSelf: "center",
          borderRadius: 10,
          marginBottom: 15
        }} />

        {/* ORDER ID */}
        <Text style={{ fontSize: 18, fontWeight: "700" }}>
          {order.id}
        </Text>

        {/* STATUS */}
        <Text style={{ marginTop: 5, color: "#6B7280" }}>
          {t(orderStatus)}
        </Text>

        {/* ROUTE */}
        <Text style={{ marginTop: 10 }}>
          📍 {order.pickup.name}
        </Text>
        <Text>
          🏁 {order.drop.name}
        </Text>

        <Text style={{ marginTop: 5, color: "#6B7280" }}>
          {t("eta")}: {order.eta}
        </Text>

        {/* INSTRUCTIONS */}
        <View style={{
          marginTop: 15,
          backgroundColor: "#FEF3C7",
          padding: 10,
          borderRadius: 10
        }}>
          <Text style={{ fontWeight: "600" }}>
            {t("instructions")}
          </Text>
          <Text style={{ fontSize: 13 }}>
            {order.instructions}
          </Text>
        </View>

        {/* FLOW BUTTONS */}

        {orderStatus === "assigned" && (
          <TouchableOpacity
            onPress={() => setOrderStatus("picked")}
            style={{
              backgroundColor: "#2563EB",
              padding: 15,
              borderRadius: 12,
              marginTop: 15
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {t("start_trip")}
            </Text>
          </TouchableOpacity>
        )}

        {orderStatus === "picked" && (
          <TouchableOpacity
            onPress={() => setOrderStatus("transit")}
            style={{
              backgroundColor: "#F59E0B",
              padding: 15,
              borderRadius: 12,
              marginTop: 10
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {t("start_delivery")}
            </Text>
          </TouchableOpacity>
        )}

        {orderStatus === "transit" && (
          <TouchableOpacity
            onPress={() => setOrderStatus("delivered")}
            style={{
              backgroundColor: "#16A34A",
              padding: 15,
              borderRadius: 12,
              marginTop: 10
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {t("mark_delivered")}
            </Text>
          </TouchableOpacity>
        )}

        {orderStatus === "delivered" && (
          <Text style={{
            textAlign: "center",
            marginTop: 15,
            color: "green",
            fontWeight: "700"
          }}>
            {t("delivery_completed")}
          </Text>
        )}

      </View>
    </View>
  );
}