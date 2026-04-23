import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Button } from "../components/Button";

export default function EditProfile({ navigation }) {

  const [name, setName] = useState("Driver Name");
  const [username, setUsername] = useState("driver01");
  const [phone, setPhone] = useState("0771234567");
  const [email, setEmail] = useState("driver@email.com");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <Typography variant="h3" style={styles.headerTitle}>
              My Profile
            </Typography>
          </View>

          {/* PERSONAL INFO */}
          <Typography variant="body" weight="medium" style={styles.label}>Name</Typography>
          <TextInput 
            value={name} 
            onChangeText={setName} 
            style={styles.input} 
            placeholderTextColor={theme.colors.textMuted}
          />

          <Typography variant="body" weight="medium" style={styles.label}>Username</Typography>
          <TextInput 
            value={username} 
            onChangeText={setUsername} 
            style={styles.input} 
            placeholderTextColor={theme.colors.textMuted}
          />

          <Typography variant="body" weight="medium" style={styles.label}>Phone Number</Typography>
          <TextInput 
            value={phone} 
            onChangeText={setPhone} 
            style={styles.input} 
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.textMuted}
          />

          <Typography variant="body" weight="medium" style={styles.label}>Email</Typography>
          <TextInput 
            value={email} 
            onChangeText={setEmail} 
            style={styles.input} 
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.textMuted}
          />

          {/* SAVE */}
          <Button 
            title="Save Changes"
            style={styles.saveButton}
            onPress={() => {
              Alert.alert("Success", "Profile updated successfully");
              navigation.goBack();
            }}
          />

          {/* CHANGE PASSWORD */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <MaterialIcons name="lock" size={20} color={theme.colors.primary} />
            <Typography variant="body" color="primary" style={styles.secondaryButtonText}>
              Change Password
            </Typography>
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
            <MaterialIcons name="logout" size={20} color={theme.colors.error} />
            <Typography variant="body" weight="semiBold" color="error" style={styles.secondaryButtonText}>
              Sign Out
            </Typography>
          </TouchableOpacity>

          <View style={{ height: theme.spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  secondaryButtonText: {
    marginLeft: theme.spacing.sm,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  }
});