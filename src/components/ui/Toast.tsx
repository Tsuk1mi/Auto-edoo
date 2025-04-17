import type React from 'react';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';

// Toast variants
const toastVariants = cva(
  'relative flex items-center justify-between rounded-lg px-4 py-3 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100',
        success: 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        warning: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        error: 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      },
      position: {
        topRight: 'top-4 right-4',
        topLeft: 'top-4 left-4',
        bottomRight: 'bottom-4 right-4',
        bottomLeft: 'bottom-4 left-4',
        topCenter: 'top-4 left-1/2 -translate-x-1/2',
        bottomCenter: 'bottom-4 left-1/2 -translate-x-1/2',
      },
    },
    defaultVariants: {
      variant: 'default',
      position: 'topRight',
    },
  }
);

// Toast interface
export interface Toast {
  id: string;
  title?: string;
  message: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

// Context type
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  position: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft' | 'topCenter' | 'bottomCenter';
  setPosition: (position: ToastContextType['position']) => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Default icons
const DefaultIcons = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 102 0v-6a1 1 0 10-2 0v6z" clipRule="evenodd" />
    </svg>
  ),
  default: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 102 0v-6a1 1 0 10-2 0v6z" clipRule="evenodd" />
    </svg>
  ),
};

// Toast provider component
export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastContextType['position'];
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'topRight',
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastPosition, setToastPosition] = useState<ToastContextType['position']>(position);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prevToasts) => [...prevToasts, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    position: toastPosition,
    setPosition: setToastPosition,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Toast container component
const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { toasts, position } = context;

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`fixed z-50 flex flex-col gap-2 max-w-sm w-full ${position}`}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
};

// Individual toast component
interface ToastItemProps {
  toast: Toast;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { removeToast, position } = context;
  const { id, title, message, variant = 'default', duration = 5000, onClose, action, icon } = toast;

  useEffect(() => {
    if (duration === Number.POSITIVE_INFINITY) return;

    const timer = setTimeout(() => {
      removeToast(id);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, removeToast, onClose]);

  const handleClose = () => {
    removeToast(id);
    if (onClose) onClose();
  };

  // Determine icon to display
  const toastIcon = icon || DefaultIcons[variant];

  // Animation class based on position
  const getAnimationClass = () => {
    if (position.includes('Right')) return 'animate-slide-in-right';
    if (position.includes('Left')) return 'animate-slide-in-left';
    return 'animate-slide-in-down';
  };

  return (
    <div
      className={`${toastVariants({ variant, position })} ${getAnimationClass()}`}
      role="alert"
    >
      <div className="flex items-start flex-1">
        {toastIcon && (
          <div className="flex-shrink-0 mr-3">
            {toastIcon}
          </div>
        )}
        <div className="flex-1">
          {title && <div className="font-medium mb-0.5">{title}</div>}
          <div className={`${title ? 'text-sm opacity-90' : ''}`}>{message}</div>
        </div>
      </div>

      <div className="flex items-center ml-4 flex-shrink-0 space-x-2">
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
        <button
          onClick={handleClose}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Hook to use toast functionality
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return {
    toast: context.addToast,
    dismiss: context.removeToast,
    success: (message: string, options?: Omit<Toast, 'id' | 'message' | 'variant'>) => {
      context.addToast({ ...options, message, variant: 'success' });
    },
    error: (message: string, options?: Omit<Toast, 'id' | 'message' | 'variant'>) => {
      context.addToast({ ...options, message, variant: 'error' });
    },
    warning: (message: string, options?: Omit<Toast, 'id' | 'message' | 'variant'>) => {
      context.addToast({ ...options, message, variant: 'warning' });
    },
    info: (message: string, options?: Omit<Toast, 'id' | 'message' | 'variant'>) => {
      context.addToast({ ...options, message, variant: 'info' });
    },
    setPosition: context.setPosition,
  };
};
