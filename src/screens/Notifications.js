import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";

export default function Notifications({ navigation }) {

  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Order Assigned", message: "You have been assigned IMP-12345", read: false },
    { id: 2, title: "Document Approved", message: "Your vehicle documents are approved", read: false },
    { id: 3, title: "System Update", message: "App updated successfully", read: true },
  ]);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const renderItem = ({ item }) => (
    <View style={{
      backgroundColor: item.read ? "#fff" : "#E8F0FF",
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      elevation: 2
    }}>
      <Text style={{ fontSize: 16, fontWeight: "700" }}>
        {item.title}
      </Text>

      <Text style={{ color: "#6B7280", marginTop: 5 }}>
        {item.message}
      </Text>

      {!item.read && (
        <View style={{
          marginTop: 10,
          alignSelf: "flex-start",
          backgroundColor: colors.primary,
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 10
        }}>
          <Text style={{ color: "#fff", fontSize: 10 }}>
            NEW
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 20 }}>

      {/* HEADER */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} />
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: "700" }}>
          Notifications
        </Text>

        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

    </View>
  );
}