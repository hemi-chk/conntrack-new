import { StyleSheet, View } from "react-native";
import { useTheme } from "../constants/theme";
import { Typography } from "./Typography";

export const Badge = ({
  label,
  variant = "primary",
  showDot = true,
  style,
  textStyle,
  ...props
}) => {
  const { theme: activeTheme } = useTheme();
  const colors = activeTheme.colors;

  let badgeColor = colors.primary;
  if (variant === "success") badgeColor = colors.success;
  if (variant === "warning") badgeColor = colors.warning;
  if (variant === "error") badgeColor = colors.error;
  if (variant === "secondary") badgeColor = colors.secondary;
  if (variant === "accent") badgeColor = colors.accent;

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${badgeColor}18`, // 15% opacity tint of theme color
      paddingHorizontal: activeTheme.spacing.sm + 2,
      paddingVertical: activeTheme.spacing.xs + 1,
      borderRadius: activeTheme.roundness.full || 9999,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: `${badgeColor}35`,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: badgeColor,
      marginRight: activeTheme.spacing.xs + 2,
    },
    text: {
      color: badgeColor,
      fontSize: activeTheme.typography.sizes.xs,
      fontFamily: activeTheme.typography.fontFamily.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={[styles.container, style]} {...props}>
      {showDot && <View style={styles.dot} />}
      <Typography variant="tiny" weight="semiBold" style={[styles.text, textStyle]}>
        {label}
      </Typography>
    </View>
  );
};
