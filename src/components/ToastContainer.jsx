import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Loader2, 
  X 
} from 'lucide-react';

function ToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration);
  const timerRef = useRef(null);

  useEffect(() => {
    // If duration is 0 or less, toast is persistent until manually dismissed
    if (!toast.duration || toast.duration <= 0) return;

    const tickInterval = 25; // 25ms tick for smooth progress bar
    const totalDuration = toast.duration;

    timerRef.current = setInterval(() => {
      if (!isPaused) {
        remainingTimeRef.current -= tickInterval;
        const pct = Math.max(0, (remainingTimeRef.current / totalDuration) * 100);
        setProgress(pct);

        if (remainingTimeRef.current <= 0) {
          clearInterval(timerRef.current);
          onDismiss(toast.id);
        }
      }
    }, tickInterval);

    return () => clearInterval(timerRef.current);
  }, [toast.id, toast.duration, isPaused, onDismiss]);

  const typeConfig = {
    success: {
      border: 'border-emerald-300 dark:border-emerald-800/80',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      barBg: 'bg-emerald-500',
      titleColor: 'text-emerald-950 dark:text-emerald-300',
      Icon: CheckCircle2,
      defaultTitle: 'Success'
    },
    error: {
      border: 'border-rose-300 dark:border-rose-800/80',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
      barBg: 'bg-rose-500',
      titleColor: 'text-rose-950 dark:text-rose-300',
      Icon: AlertCircle,
      defaultTitle: 'Error'
    },
    warning: {
      border: 'border-amber-300 dark:border-amber-800/80',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      barBg: 'bg-amber-500',
      titleColor: 'text-amber-950 dark:text-amber-300',
      Icon: AlertTriangle,
      defaultTitle: 'Attention'
    },
    info: {
      border: 'border-ember-300 dark:border-ember-800/80',
      iconBg: 'bg-ember-50 dark:bg-ember-950/60 text-ember-600 dark:text-ember-400 border border-ember-200 dark:border-ember-800',
      barBg: 'bg-ember-500',
      titleColor: 'text-ember-950 dark:text-ember-300',
      Icon: Info,
      defaultTitle: 'Information'
    },
    loading: {
      border: 'border-stone-300 dark:border-stone-700',
      iconBg: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700',
      barBg: 'bg-ember-600 animate-pulse',
      titleColor: 'text-stone-900 dark:text-stone-200',
      Icon: Loader2,
      defaultTitle: 'Processing'
    }
  };

  const config = typeConfig[toast.type] || typeConfig.info;
  const IconComponent = config.Icon;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden bg-white/95 dark:bg-ink-900/95 backdrop-blur-md rounded-2xl shadow-mat-3 border ${config.border} p-3.5 sm:p-4 text-xs transition-all duration-200 animate-in slide-in-from-top-3 fade-in duration-200 hover:shadow-mat-4 w-full`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        {/* Type Icon Badge */}
        <div className={`w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs`}>
          <IconComponent className={`w-4 h-4 ${toast.type === 'loading' ? 'animate-spin' : ''}`} />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-2">
          {toast.title && (
            <div className={`font-bold text-xs tracking-tight leading-snug ${config.titleColor}`}>
              {toast.title}
            </div>
          )}
          <div className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed mt-0.5 break-words font-sans">
            {toast.message}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-ink-800 transition flex-shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Countdown Progress Bar (for timed toasts) */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100 dark:bg-ink-950 overflow-hidden">
          <div
            className={`h-full ${config.barBg} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined' || toasts.length === 0) {
    return null;
  }

  const containerJSX = (
    <div 
      className="fixed top-4 right-4 z-[120] pointer-events-none flex flex-col space-y-2.5 max-w-sm  sm:w-96 select-none"
      aria-live="polite"
    >
      {toasts.map(item => (
        <ToastItem key={item.id} toast={item} onDismiss={removeToast} />
      ))}
    </div>
  );

  return createPortal(containerJSX, document.body);
}
