import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Select = forwardRef(({
  label,
  error,
  id,
  className = '',
  fullWidth = true,
  options = [],
  children,
  ...props
}, ref) => {
  const selectId = id || props.name;
  
  const baseSelectStyles = 'border rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors bg-white appearance-none cursor-pointer';
  
  // Dynamic border and ring colors based on error state
  const stateStyles = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
    : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary';
    
  const classes = [
    baseSelectStyles,
    stateStyles,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={selectId} className="block mb-0.5 text-xs font-semibold text-gray-600">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={classes}
          {...props}
        >
          {children ? children : (
            options.map((opt, idx) => (
              <option key={idx} value={opt.value !== undefined ? opt.value : opt}>
                {opt.label !== undefined ? opt.label : opt}
              </option>
            ))
          )}
        </select>
        
        {/* Custom Dropdown Arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          {error ? (
            <AlertCircle className="h-4 w-4 text-red-500 mr-4" />
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
