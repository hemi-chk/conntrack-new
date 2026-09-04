import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../constants/theme";
import { Typography } from "./Typography";

export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const { theme: activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const styles = StyleSheet.create({
    button: {
      borderRadius: activeTheme.roundness.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      overflow: "hidden",
    },
    smSize: {
      paddingVertical: activeTheme.spacing.xs + 2,
      paddingHorizontal: activeTheme.spacing.md,
      minHeight: 36,
    },
    mdSize: {
      paddingVertical: activeTheme.spacing.sm + 4,
      paddingHorizontal: activeTheme.spacing.lg,
      minHeight: 48,
    },
    lgSize: {
      paddingVertical: activeTheme.spacing.md,
      paddingHorizontal: activeTheme.spacing.xl,
      minHeight: 56,
    },
    iconMarginLeft: {
      marginRight: activeTheme.spacing.sm,
    },
    iconMarginRight: {
      marginLeft: activeTheme.spacing.sm,
    },
  });

  let bgColor = colors.primary;
  let textColor = colors.surface;
  let borderColor = "transparent";
  let borderWidth = 0;

  if (variant === "secondary") {
    bgColor = colors.secondary;
    textColor = colors.surface;
  } else if (variant === "outline") {
    bgColor = "transparent";
    textColor = colors.primary;
    borderColor = colors.primary;
    borderWidth = 1.5;
  } else if (variant === "ghost") {
    bgColor = "transparent";
    textColor = colors.primary;
  } else if (variant === "danger") {
    bgColor = colors.error;
    textColor = "#FFFFFF";
  } else if (variant === "success") {
    bgColor = colors.success;
    textColor = "#FFFFFF";
  }

  if (disabled) {
    bgColor = colors.border;
    textColor = colors.textMuted;
    borderColor = "transparent";
  }

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return (
        <MaterialIcons
          name={icon}
          size={size === "sm" ? 18 : size === "lg" ? 24 : 20}
          color={textColor}
          style={iconPosition === "left" ? styles.iconMarginLeft : styles.iconMarginRight}
        />
      );
    }
    return icon;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`${size}Size`],
        { backgroundColor: bgColor, borderColor, borderWidth },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {iconPosition === "left" && renderIcon()}
          <Typography
            variant={size === "sm" ? "caption" : "subtitle"}
            weight="semiBold"
            style={[{ color: textColor }, textStyle]}
          >
            {title}
          </Typography>
          {iconPosition === "right" && renderIcon()}
        </>
      )}
    </TouchableOpacity>
  );
};
