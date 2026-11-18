import React from 'react';

/**
 * LoadingSpinner - Versatile, textile-styled loading indicator
 * Usage:
 * <LoadingSpinner size="sm|md|lg" message="Loading garments..." />
 * <LoadingSpinner fullScreen message="Setting up store..." />
 */
export default function LoadingSpinner({
  size = 'md',
  message = 'Loading...',
  fullScreen = false,
  className = ''
}) {
  const sizeMap = {
    sm: {
      spinner: 'w-4 h-4 border-2',
      text: 'text-[11px]'
    },
    md: {
      spinner: 'w-8 h-8 border-3',
      text: 'text-xs'
    },
    lg: {
      spinner: 'w-12 h-12 border-4',
      text: 'text-sm'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
      {/* Dual Ring Textile Spinner */}
      <div className="relative">
        <div
          className={`${currentSize.spinner} rounded-full border-stone-200 dark:border-ink-800`}
        />
        <div
          className={`absolute inset-0 ${currentSize.spinner} rounded-full border-ember-600 border-t-transparent animate-spin`}
        />
      </div>

      {message && (
        <p className={`font-semibold text-stone-600 dark:text-stone-300 font-sans tracking-wide ${currentSize.text}`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-ivory-100/80 dark:bg-ink-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-ink-900 rounded-3xl p-8 shadow-mat-3 border border-ivory-300 dark:border-ink-800 max-w-xs w-full text-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
