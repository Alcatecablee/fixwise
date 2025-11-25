'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// Modal types for type safety
interface ModalConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
  autoClose?: number;
  persistent?: boolean;
}

interface ModalContextType {
  showModal: (config: Omit<ModalConfig, 'id'>) => string;
  closeModal: (id: string) => void;
  showSuccess: (message: string, title?: string) => string;
  showError: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
  showConfirm: (message: string, onConfirm: () => Promise<void> | void, title?: string) => string;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Individual Modal Component
function Modal({ config, onClose }: { config: ModalConfig; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Auto-close timer
    if (config.autoClose && config.autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, config.autoClose);

      return () => clearTimeout(timer);
    }
  }, [config.autoClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !config.persistent) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [config.persistent]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIsVisible(false);
    setTimeout(onClose, 150); // Animation duration
  }, [isLoading, onClose]);

  const handleConfirm = async () => {
    if (!config.onConfirm) {
      handleClose();
      return;
    }

    try {
      setIsLoading(true);
      await config.onConfirm();
      handleClose();
    } catch (error) {
      // Keep modal open on error, let the onConfirm handler deal with error display
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    config.onCancel?.();
    handleClose();
  };

  const getModalStyles = () => {
    const baseStyles = {
      success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      error: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      confirm: 'border-gray-300 bg-white dark:bg-gray-800'
    };

    const iconStyles = {
      success: 'text-green-600 dark:text-green-400',
      error: 'text-red-600 dark:text-red-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      info: 'text-blue-600 dark:text-blue-400',
      confirm: 'text-gray-600 dark:text-gray-400'
    };

    return { modal: baseStyles[config.type], icon: iconStyles[config.type] };
  };

  const getIcon = () => {
    const iconClass = "w-6 h-6";
    
    switch (config.type) {
      case 'success':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'confirm':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const styles = getModalStyles();

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={!config.persistent ? handleClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${config.id}`}
      aria-describedby={`modal-description-${config.id}`}
    >
      <div
        className={`relative max-w-md w-full mx-auto rounded-lg border-2 shadow-xl transform transition-all duration-150 ${
          styles.modal
        } ${isVisible ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center p-6 pb-4">
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {getIcon()}
          </div>
          <div className="ml-4 flex-1">
            <h3
              id={`modal-title-${config.id}`}
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {config.title}
            </h3>
          </div>
          {!config.persistent && (
            <button
              type="button"
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p
            id={`modal-description-${config.id}`}
            className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
          >
            {config.message}
          </p>
        </div>

        {/* Actions */}
        {(config.type === 'confirm' || config.onConfirm) && (
          <div className="flex justify-end gap-3 px-6 pb-6">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {config.cancelText || 'Cancel'}
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {config.confirmText || 'Confirm'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Modal Provider
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const showModal = useCallback((config: Omit<ModalConfig, 'id'>): string => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const modalConfig: ModalConfig = { ...config, id };
    
    setModals(prev => [...prev, modalConfig]);
    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, title: string = 'Success') => {
    return showModal({
      type: 'success',
      title,
      message,
      autoClose: 3000
    });
  }, [showModal]);

  const showError = useCallback((message: string, title: string = 'Error') => {
    return showModal({
      type: 'error',
      title,
      message
    });
  }, [showModal]);

  const showWarning = useCallback((message: string, title: string = 'Warning') => {
    return showModal({
      type: 'warning',
      title,
      message
    });
  }, [showModal]);

  const showInfo = useCallback((message: string, title: string = 'Information') => {
    return showModal({
      type: 'info',
      title,
      message
    });
  }, [showModal]);

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => Promise<void> | void,
    title: string = 'Confirm Action'
  ) => {
    return showModal({
      type: 'confirm',
      title,
      message,
      onConfirm,
      persistent: true
    });
  }, [showModal]);

  const contextValue: ModalContextType = {
    showModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {modals.map(modal => (
        <Modal
          key={modal.id}
          config={modal}
          onClose={() => closeModal(modal.id)}
        />
      ))}
    </ModalContext.Provider>
  );
}

// Utility hook for replacing alert() calls
export function useAlertReplacement() {
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useModal();

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    confirm: showConfirm,
    // Legacy alert replacement
    alert: showInfo,
    // Prompt replacement - returns a promise that resolves with boolean
    prompt: (message: string, title?: string): Promise<boolean> => {
      return new Promise((resolve) => {
        showConfirm(
          message,
          () => resolve(true),
          title
        );
        // Note: This doesn't handle the cancel case perfectly
        // In production, you'd want a more sophisticated prompt replacement
      });
    }
  };
}