import { StyleSheet, View } from "react-native";
import { theme } from "../constants/theme";

export const Card = ({ children, style, elevation = "md", ...props }) => {
  return (
    <View style={[styles.card, theme.shadows[elevation], style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.md,
  },
});
