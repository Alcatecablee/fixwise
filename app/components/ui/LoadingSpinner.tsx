'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  label?: string;
  overlay?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label,
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    white: 'text-white',
    gray: 'text-gray-500'
  };

  const spinnerElement = (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={label || "Loading"}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <span className={`text-sm font-medium ${colorClasses[color]}`}>
          {label}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25"
        role="status"
        aria-live="polite"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          {spinnerElement}
        </div>
      </div>
    );
  }

  return spinnerElement;
};

// Button Loading State Component
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary'
}) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-disabled={disabled || isLoading}
    >
      {isLoading && <LoadingSpinner size="sm" color="white" />}
      {children}
    </button>
  );
};

// Page Loading State Component
export const PageLoader: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size="xl" label={message} />
    </div>
  </div>
);

// Section Loading State Component
export const SectionLoader: React.FC<{ 
  message?: string;
  height?: string;
}> = ({ 
  message = "Loading...",
  height = "h-32"
}) => (
  <div className={`${height} flex items-center justify-center`}>
    <LoadingSpinner size="lg" label={message} />
  </div>
);

// Inline Loading State Component
export const InlineLoader: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="flex items-center justify-center py-4">
    <LoadingSpinner size="md" label={message} />
  </div>
);

export default LoadingSpinner;