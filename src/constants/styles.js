import { View, Text, TouchableOpacity } from "react-native";
import styles from "../constants/styles";
import colors from "../constants/colors";

export default function LoginScreen({ navigation }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.primary,
      justifyContent: "center",
      padding: 20,
    }}>
      <Text style={{
        color: "#fff",
        fontSize: 26,
        marginBottom: 20
      }}>
        Improve your productivity
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 30,
        }}
        onPress={() => navigation.navigate("Dashboard")}
      >
        <Text style={{ textAlign: "center", color: colors.primary }}>
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
}