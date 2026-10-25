import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      id,
      name,
      type = 'text',
      className = '',
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-primary uppercase tracking-wider"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-md text-text-primary placeholder:text-neutral-400 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-brand-black ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-border-subtle focus:border-brand-black'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
        {helperText && !error && (
          <span className="text-xs text-text-secondary">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
