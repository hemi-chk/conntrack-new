import { StyleSheet, Text } from "react-native";
import { useTheme } from "../constants/theme";

export const Typography = ({ 
  children, 
  variant = "body", 
  color = "text", 
  weight = "regular",
  align = "left",
  style, 
  ...props 
}) => {
  const { theme: activeTheme } = useTheme();
  const styles = StyleSheet.create({
    h1: {
      fontSize: activeTheme.typography.sizes.xxl,
      fontFamily: activeTheme.typography.fontFamily.bold,
    },
    h2: {
      fontSize: activeTheme.typography.sizes.xl,
      fontFamily: activeTheme.typography.fontFamily.bold,
    },
    h3: {
      fontSize: activeTheme.typography.sizes.lg,
      fontFamily: activeTheme.typography.fontFamily.semiBold,
    },
    subtitle: {
      fontSize: activeTheme.typography.sizes.md,
      fontFamily: activeTheme.typography.fontFamily.medium,
    },
    body: {
      fontSize: activeTheme.typography.sizes.md,
      fontFamily: activeTheme.typography.fontFamily.regular,
    },
    caption: {
      fontSize: activeTheme.typography.sizes.sm,
      fontFamily: activeTheme.typography.fontFamily.regular,
    },
    tiny: {
      fontSize: activeTheme.typography.sizes.xs,
      fontFamily: activeTheme.typography.fontFamily.regular,
    },
    regularWeight: { fontFamily: activeTheme.typography.fontFamily.regular },
    mediumWeight: { fontFamily: activeTheme.typography.fontFamily.medium },
    semiBoldWeight: { fontFamily: activeTheme.typography.fontFamily.semiBold },
    boldWeight: { fontFamily: activeTheme.typography.fontFamily.bold },
  });

  return (
    <Text 
      style={[
        styles[variant], 
        styles[`${weight}Weight`],
        { color: activeTheme.colors[color] || color, textAlign: align },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};
