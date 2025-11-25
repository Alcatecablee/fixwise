'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getModalStyles = () => {
    const baseStyles = "fixed inset-0 z-50 flex items-center justify-center p-4";
    return baseStyles;
  };

  const getButtonStyles = () => {
    const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    switch (type) {
      case 'danger':
        return {
          confirm: `${baseStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`,
          cancel: `${baseStyles} bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500`
        };
      case 'warning':
        return {
          confirm: `${baseStyles} bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500`,
          cancel: `${baseStyles} bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500`
        };
      case 'info':
      default:
        return {
          confirm: `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`,
          cancel: `${baseStyles} bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500`
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className={getModalStyles()}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className={getButtonStyles().cancel}
              onClick={handleCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={getButtonStyles().confirm}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for easy confirmation dialogs
interface UseConfirmationReturn {
  showConfirmation: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => Promise<boolean>;
  ConfirmationModal: React.ReactElement | null;
}

export const useConfirmation = (): UseConfirmationReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    resolve: (value: boolean) => void;
  } | null>(null);

  const showConfirmation = useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        ...options,
        resolve,
      });
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (config) {
      config.resolve(true);
    }
    setIsOpen(false);
    setConfig(null);
  }, [config]);

  const handleCancel = useCallback(() => {
    if (config) {
      config.resolve(false);
    }
    setIsOpen(false);
    setConfig(null);
  }, [config]);

  return {
    showConfirmation,
    ConfirmationModal: config ? (
      <ConfirmationModal
        isOpen={isOpen}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        type={config.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ) : null,
  };
}; 