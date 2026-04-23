import React, { useState } from "react";
import { View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import i18n from "../i18n";
import { theme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Button } from "../components/Button";

export default function Language({ navigation }) {
  const [selectedLang, setSelectedLang] = useState(null);

  const languages = [
    { code: "en", label: "🇬🇧 English" },
    { code: "si", label: "🇱🇰 Sinhala" },
    { code: "ta", label: "🇮🇳 Tamil" }
  ];

  const confirmChange = () => {
    if (!selectedLang) {
      Alert.alert("Select Language", "Please choose a language first");
      return;
    }

    i18n.changeLanguage(selectedLang);

    Alert.alert(
      "Language Updated",
      "Your language has been changed successfully"
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Typography variant="h3" style={styles.headerTitle}>
            Select Language
          </Typography>
        </View>

        {/* LANGUAGE OPTIONS */}
        {languages.map((lang) => {
          const isSelected = selectedLang === lang.code;

          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setSelectedLang(lang.code)}
              style={[
                styles.langOption,
                isSelected ? styles.langOptionSelected : styles.langOptionUnselected
              ]}
            >
              <Typography 
                variant="body" 
                weight="semiBold"
                style={{ color: isSelected ? theme.colors.surface : theme.colors.text }}
              >
                {lang.label}
              </Typography>
            </TouchableOpacity>
          );
        })}

        {/* CONFIRM BUTTON */}
        <Button 
          title="Confirm Language"
          style={styles.confirmButton}
          onPress={confirmChange}
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    marginLeft: theme.spacing.sm,
  },
  langOption: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.md,
  },
  langOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  langOptionUnselected: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmButton: {
    marginTop: theme.spacing.lg,
  }
});