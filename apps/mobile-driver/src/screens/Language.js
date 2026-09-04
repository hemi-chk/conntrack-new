import React, { useState } from "react";
import { View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { useTheme } from "../constants/theme";
import { Typography } from "../components/Typography";
import { Button } from "../components/Button";

export default function Language({ navigation }) {
  const { t } = useTranslation();
  const { theme: activeTheme } = useTheme();
  const [selectedLang, setSelectedLang] = useState(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: activeTheme.colors.background,
    },
    content: {
      padding: activeTheme.spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: activeTheme.spacing.xl,
    },
    headerTitle: {
      marginLeft: activeTheme.spacing.sm,
    },
    langOption: {
      padding: activeTheme.spacing.lg,
      marginBottom: activeTheme.spacing.md,
      borderRadius: activeTheme.roundness.md,
    },
    langOptionSelected: {
      backgroundColor: activeTheme.colors.primary,
      borderWidth: 1,
      borderColor: activeTheme.colors.primary,
    },
    langOptionUnselected: {
      backgroundColor: activeTheme.colors.surface,
      borderWidth: 1,
      borderColor: activeTheme.colors.border,
    },
    confirmButton: {
      marginTop: activeTheme.spacing.lg,
    }
  });

  const languages = [
    { code: "en", label: "🇬🇧 English" },
    { code: "si", label: "🇱🇰 Sinhala" },
    { code: "ta", label: "🇮🇳 Tamil" }
  ];

  const confirmChange = () => {
    if (!selectedLang) {
      Alert.alert(t("select_language"), t("please_choose_language"));
      return;
    }

    i18n.changeLanguage(selectedLang);

    Alert.alert(
      t("language_updated"),
      t("language_changed_success")
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <MaterialIcons name="arrow-back" size={24} color={activeTheme.colors.text} />
          </TouchableOpacity>

          <Typography variant="h3" style={styles.headerTitle}>
            {t("select_language")}
          </Typography>
        </View>

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
                style={{ color: isSelected ? activeTheme.colors.surface : activeTheme.colors.text }}
              >
                {lang.label}
              </Typography>
            </TouchableOpacity>
          );
        })}

        <Button 
          title={t("confirm_language")}
          style={styles.confirmButton}
          onPress={confirmChange}
        />

      </View>
    </SafeAreaView>
  );
}