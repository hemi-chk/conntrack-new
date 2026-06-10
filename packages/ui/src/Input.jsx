import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(({
  label,
  error,
  id,
  className = '',
  fullWidth = true,
  ...props
}, ref) => {
  const inputId = id || props.name;
  
  const baseInputStyles = 'border rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors bg-white';
  
  // Dynamic border and ring colors based on error state
  const stateStyles = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
    : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary';
    
  const classes = [
    baseInputStyles,
    stateStyles,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="block mb-0.5 text-xs font-semibold text-gray-600">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={classes}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
