import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import colors from "../constants/colors";

export default function Tracking({ navigation }) {

  // 🚚 later backend will decide this (import/export)
  const orderType = "import";

  const importSteps = [
    "Order Started",
    "Arrived at Port",
    "Custom Clearance",
    "BOI Checkpoint",
    "Delivered"
  ];

  const exportSteps = [
    "Order Started",
    "Warehouse Pickup",
    "Port Loading",
    "Shipping",
    "Delivered"
  ];

  const steps = orderType === "import" ? importSteps : exportSteps;

  const [currentStep, setCurrentStep] = useState(0);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>

      {/* HEADER */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: "#fff",
        elevation: 3
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} />
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: "700" }}>
          IMP-12345
        </Text>

        <MaterialIcons name="local-shipping" size={24} color={colors.primary} />
      </View>

      <ScrollView>

        {/* STATUS CARD */}
        <View style={{
          backgroundColor: colors.primary,
          margin: 20,
          padding: 20,
          borderRadius: 18
        }}>
          <Text style={{ color: "#fff", opacity: 0.8 }}>
            Current Status
          </Text>

          <Text style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "700",
            marginTop: 5
          }}>
            {steps[currentStep]}
          </Text>

          <Text style={{
            color: "#E5E7EB",
            marginTop: 5,
            fontSize: 12
          }}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>

        {/* PROGRESS BAR */}
        <View style={{
          height: 8,
          backgroundColor: "#E5E7EB",
          marginHorizontal: 20,
          borderRadius: 10
        }}>
          <View style={{
            width: `${progress}%`,
            height: 8,
            backgroundColor: "#16A34A",
            borderRadius: 10
          }} />
        </View>

        {/* TIMELINE */}
        <View style={{ padding: 20 }}>

          {steps.map((step, index) => {

            const completed = index < currentStep;
            const active = index === currentStep;

            return (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  marginBottom: 18
                }}
              >

                {/* DOT + LINE */}
                <View style={{ alignItems: "center", width: 30 }}>
                  <View style={{
                    width: 14,
                    height: 14,
                    borderRadius: 10,
                    backgroundColor: completed
                      ? "#16A34A"
                      : active
                      ? colors.primary
                      : "#D1D5DB"
                  }} />

                  {index !== steps.length - 1 && (
                    <View style={{
                      width: 2,
                      height: 40,
                      backgroundColor: "#E5E7EB"
                    }} />
                  )}
                </View>

                {/* CARD */}
                <View style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  padding: 15,
                  borderRadius: 14,
                  elevation: 2,
                }}>

                  <Text style={{
                    fontWeight: "700",
                    color: completed
                      ? "#16A34A"
                      : active
                      ? colors.primary
                      : "#111"
                  }}>
                    {step}
                  </Text>

                  <Text style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: "#6B7280"
                  }}>
                    {completed
                      ? "Completed"
                      : active
                      ? "In progress"
                      : "Pending"}
                  </Text>

                  {active && (
                    <View style={{
                      marginTop: 8,
                      backgroundColor: "#FEF3C7",
                      padding: 6,
                      borderRadius: 8
                    }}>
                      <Text style={{ fontSize: 11 }}>
                        🚚 Live tracking active
                      </Text>
                    </View>
                  )}

                </View>
              </View>
            );
          })}

        </View>

        {/* ACTION BUTTON */}
        <View style={{ padding: 20 }}>

          <TouchableOpacity
            onPress={nextStep}
            style={{
              backgroundColor: colors.primary,
              padding: 15,
              borderRadius: 12,
            }}
          >
            <Text style={{
              color: "#fff",
              textAlign: "center",
              fontWeight: "700"
            }}>
              Update Next Stage
            </Text>
          </TouchableOpacity>

          <Text style={{
            textAlign: "center",
            marginTop: 10,
            color: "#6B7280",
            fontSize: 12
          }}>
            Demo mode — will sync with GPS & backend later
          </Text>

        </View>

      </ScrollView>
    </View>
  );
}