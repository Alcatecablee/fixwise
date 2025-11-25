'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocus: (elementId: string) => void;
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => void;
  releaseFocus: () => void;
  isKeyboardUser: boolean;
  isReducedMotion: boolean;
  isHighContrast: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const focusTrapRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check for high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detect keyboard users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Announce messages to screen readers
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'ds-sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove the announcement after it's been read
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  };

  // Set focus to a specific element
  const setFocus = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  };

  // Trap focus within a container
  const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;
    focusTrapRef.current = containerRef.current;

    // Find all focusable elements within the container
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element
    firstElement.focus();

    // Handle tab key to cycle through elements
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);

    // Store the event listener for cleanup
    (containerRef.current as any)._focusTrapHandler = handleKeyDown;
  };

  // Release focus trap
  const releaseFocus = () => {
    if (focusTrapRef.current) {
      const handler = (focusTrapRef.current as any)._focusTrapHandler;
      if (handler) {
        focusTrapRef.current.removeEventListener('keydown', handler);
        delete (focusTrapRef.current as any)._focusTrapHandler;
      }
      focusTrapRef.current = null;
    }

    // Restore focus to the previously focused element
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  };

  const value: AccessibilityContextType = {
    announceToScreenReader,
    setFocus,
    trapFocus,
    releaseFocus,
    isKeyboardUser,
    isReducedMotion,
    isHighContrast,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook for managing focus in modals
export const useModalFocus = (isOpen: boolean) => {
  const { trapFocus, releaseFocus } = useAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      trapFocus(modalRef);
    } else {
      releaseFocus();
    }

    return () => {
      if (isOpen) {
        releaseFocus();
      }
    };
  }, [isOpen, trapFocus, releaseFocus]);

  return modalRef;
};

// Hook for managing focus in dropdowns
export const useDropdownFocus = (isOpen: boolean) => {
  const { trapFocus, releaseFocus } = useAccessibility();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      trapFocus(dropdownRef);
    } else {
      releaseFocus();
    }

    return () => {
      if (isOpen) {
        releaseFocus();
      }
    };
  }, [isOpen, trapFocus, releaseFocus]);

  return dropdownRef;
};

// Hook for skip links
export const useSkipLink = (targetId: string, label: string) => {
  const { announceToScreenReader } = useAccessibility();

  const handleSkip = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      announceToScreenReader(`Skipped to ${label}`);
    }
  };

  return handleSkip;
};

// Hook for managing ARIA live regions
export const useLiveRegion = (priority: 'polite' | 'assertive' = 'polite') => {
  const { announceToScreenReader } = useAccessibility();

  const announce = (message: string) => {
    announceToScreenReader(message, priority);
  };

  return announce;
};

// Hook for managing focus indicators
export const useFocusIndicator = () => {
  const { isKeyboardUser } = useAccessibility();

  return {
    showFocusIndicator: isKeyboardUser,
    focusIndicatorClass: isKeyboardUser ? 'ds-focus:ring ds-focus:ring-2' : '',
  };
}; 