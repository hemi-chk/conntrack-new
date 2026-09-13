// Space-separated thousands (e.g. "1 234 500"), stripping any non-digit
// characters first - used for live bid-amount input masking as well as
// display.
export const formatCurrency = (val) => {
  if (!val) return '';
  const num = val.toString().replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
