import React from 'react';

const variantStyles = {
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-700',
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
  
  const classes = [
    baseStyles,
    variantStyles[variant] || variantStyles.default,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
};
