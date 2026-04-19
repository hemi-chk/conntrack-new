import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Typography } from "./Typography";
import { theme } from "../constants/theme";

export const Button = ({ 
  title, 
  onPress, 
  variant = "primary", 
  size = "md",
  disabled = false, 
  loading = false,
  style,
  textStyle
}) => {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";

  let bgColor = theme.colors.primary;
  if (isSecondary) bgColor = theme.colors.secondary;
  if (isOutline) bgColor = "transparent";
  if (disabled) bgColor = theme.colors.border;

  let textColor = theme.colors.surface;
  if (isOutline) textColor = theme.colors.primary;
  if (disabled) textColor = theme.colors.textMuted;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`${size}Size`],
        { backgroundColor: bgColor },
        isOutline && styles.outlineStyle,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Typography 
          variant="subtitle" 
          weight="semiBold" 
          style={[{ color: textColor }, textStyle]}
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.roundness.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  mdSize: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  smSize: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  lgSize: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  outlineStyle: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  }
});
