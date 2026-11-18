import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

// Global event bus for calling toast outside React tree (e.g. from api.js)
const listeners = new Set();
function notifyListeners(toastObj) {
  listeners.forEach(fn => fn(toastObj));
}

let toastIdCounter = 0;

/**
 * Universal toast dispatcher that can be used inside or outside React components:
 * import { toast } from '../context/ToastContext';
 * toast.success('Operation completed successfully');
 */
export const toast = {
  show: (options) => {
    const id = options.id || `toast-${++toastIdCounter}-${Date.now()}`;
    const payload = {
      id,
      type: options.type || 'info',
      title: options.title || null,
      message: options.message || '',
      duration: options.duration !== undefined ? options.duration : 4000
    };
    notifyListeners({ action: 'add', toast: payload });
    return id;
  },
  success: (message, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return toast.show({ type: 'success', message, title: opts.title || 'Success', ...opts });
  },
  error: (message, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return toast.show({ type: 'error', message, title: opts.title || 'Error', duration: 6000, ...opts });
  },
  warning: (message, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return toast.show({ type: 'warning', message, title: opts.title || 'Attention', duration: 5000, ...opts });
  },
  info: (message, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return toast.show({ type: 'info', message, title: opts.title || 'Notice', ...opts });
  },
  loading: (message, titleOrOpts = {}) => {
    const opts = typeof titleOrOpts === 'string' ? { title: titleOrOpts } : titleOrOpts;
    return toast.show({ type: 'loading', message, title: opts.title || 'Please wait...', duration: 0, ...opts });
  },
  dismiss: (id) => {
    notifyListeners({ action: 'remove', id });
  },
  clear: () => {
    notifyListeners({ action: 'clear' });
  }
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts(prev => {
      // If toast with same id already exists, update it
      const existingIdx = prev.findIndex(item => item.id === t.id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...t };
        return copy;
      }
      // Maximum 5 visible toasts at a time
      const trimmed = prev.length >= 5 ? prev.slice(prev.length - 4) : prev;
      return [...trimmed, t];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.action === 'add') {
        addToast(event.toast);
      } else if (event.action === 'remove') {
        removeToast(event.id);
      } else if (event.action === 'clear') {
        clearToasts();
      }
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [addToast, removeToast, clearToasts]);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { toast, toasts: [] };
  }
  return ctx;
}
