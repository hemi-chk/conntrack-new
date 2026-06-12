export const formatCurrency = (value) => {
  return value ? value.toLocaleString() : '0';
};