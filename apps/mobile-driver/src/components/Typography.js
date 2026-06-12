import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../constants/theme";

export const Typography = ({ 
  children, 
  variant = "body", 
  color = "text", 
  weight = "regular",
  align = "left",
  style, 
  ...props 
}) => {
  return (
    <Text 
      style={[
        styles[variant], 
        styles[`${weight}Weight`],
        { color: theme.colors[color] || color, textAlign: align },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.fontFamily.bold,
  },
  h2: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fontFamily.bold,
  },
  h3: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
  body: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fontFamily.regular,
  },
  caption: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  tiny: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fontFamily.regular,
  },
  
  // Weights override if needed
  regularWeight: { fontFamily: theme.typography.fontFamily.regular },
  mediumWeight: { fontFamily: theme.typography.fontFamily.medium },
  semiBoldWeight: { fontFamily: theme.typography.fontFamily.semiBold },
  boldWeight: { fontFamily: theme.typography.fontFamily.bold },
});
