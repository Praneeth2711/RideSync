import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-black disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-brand-black text-white hover:bg-brand-hover shadow-sm active:scale-[0.99]',
    secondary:
      'bg-surface text-text-primary border border-border-subtle hover:bg-neutral-100 active:scale-[0.99]',
    outline:
      'bg-transparent text-text-primary border border-brand-black hover:bg-brand-black hover:text-white',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:scale-[0.99]',
    ghost:
      'bg-transparent text-text-primary hover:bg-neutral-100',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
