import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import i18n from "../i18n";

export default function Language() {
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
    <View style={{ flex: 1, padding: 20, backgroundColor: "#F5F7FB" }}>

      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 20 }}>
        Select Language
      </Text>

      {/* LANGUAGE OPTIONS */}
      {languages.map((lang) => {
        const isSelected = selectedLang === lang.code;

        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => setSelectedLang(lang.code)}
            style={{
              padding: 15,
              backgroundColor: isSelected ? "#2563EB" : "#fff",
              marginBottom: 10,
              borderRadius: 10,
              borderWidth: isSelected ? 0 : 1,
              borderColor: "#E5E7EB"
            }}
          >
            <Text style={{
              color: isSelected ? "#fff" : "#111",
              fontWeight: "600"
            }}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* CONFIRM BUTTON */}
      <TouchableOpacity
        onPress={confirmChange}
        style={{
          marginTop: 20,
          backgroundColor: "#16A34A",
          padding: 15,
          borderRadius: 12
        }}
      >
        <Text style={{
          color: "#fff",
          textAlign: "center",
          fontWeight: "700"
        }}>
          Confirm Language
        </Text>
      </TouchableOpacity>

    </View>
  );
}