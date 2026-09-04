import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../constants/theme";

export const Card = ({
  children,
  style,
  elevation = "md",
  bordered = true,
  onPress,
  activeOpacity = 0.85,
  ...props
}) => {
  const { theme: activeTheme } = useTheme();
  const shadowStyle = activeTheme.shadows[elevation] || activeTheme.shadows.md;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: activeTheme.colors.surface,
      borderRadius: activeTheme.roundness.lg,
      padding: activeTheme.spacing.md,
      borderWidth: bordered ? 1 : 0,
      borderColor: activeTheme.colors.border,
    },
  });

  const cardContent = (
    <View style={[styles.card, shadowStyle, style]} {...props}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={activeOpacity}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};
