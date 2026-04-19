import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";

export default function EditProfile({ navigation }) {

  const [name, setName] = useState("Driver Name");
  const [username, setUsername] = useState("driver01");
  const [phone, setPhone] = useState("0771234567");
  const [email, setEmail] = useState("driver@email.com");

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FB", padding: 20 }}>

      {/* HEADER */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        marginBottom: 25
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} />
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: "700",
          marginLeft: 10
        }}>
          My Profile
        </Text>
      </View>

      {/* PERSONAL INFO */}
      <Text>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text>Username</Text>
      <TextInput value={username} onChangeText={setUsername} style={styles.input} />

      <Text>Phone Number</Text>
      <TextInput value={phone} onChangeText={setPhone} style={styles.input} />

      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} />

      {/* SAVE */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          Alert.alert("Success", "Profile updated successfully");
          navigation.goBack();
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
          Save Changes
        </Text>
      </TouchableOpacity>

      {/* CHANGE PASSWORD */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("ChangePassword")}
      >
        <MaterialIcons name="lock" size={20} color={colors.primary} />
        <Text style={{ marginLeft: 10, color: colors.primary }}>
          Change Password
        </Text>
      </TouchableOpacity>

      {/* SIGN OUT */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() =>
          Alert.alert("Sign Out", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", onPress: () => navigation.navigate("Login") },
          ])
        }
      >
        <MaterialIcons name="logout" size={20} color="red" />
        <Text style={{ marginLeft: 10, color: "red", fontWeight: "600" }}>
          Sign Out
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = {
  input: {
    backgroundColor: "#E5E7EB",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    marginTop: 5,
  },

  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    padding: 12,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    padding: 12,
  }
};