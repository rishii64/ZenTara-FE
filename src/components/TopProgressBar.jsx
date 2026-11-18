import React, { useState, useEffect, useRef } from 'react';

/**
 * TopProgressBar - Global non-blocking network activity indicator
 * Sits at the very top of the viewport (y=0) and pulses with warm ember gradient
 * whenever background API fetch requests are in-flight.
 */
export default function TopProgressBar() {
  const [activeCount, setActiveCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const progressTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const handleStart = () => {
      setActiveCount(prev => prev + 1);
    };

    const handleEnd = () => {
      setActiveCount(prev => Math.max(0, prev - 1));
    };

    window.addEventListener('api-request-start', handleStart);
    window.addEventListener('api-request-end', handleEnd);

    return () => {
      window.removeEventListener('api-request-start', handleStart);
      window.removeEventListener('api-request-end', handleEnd);
    };
  }, []);

  useEffect(() => {
    if (activeCount > 0) {
      clearTimeout(hideTimerRef.current);
      setVisible(true);

      // Smooth simulated progress from 15% to 85%
      setProgress(prev => (prev === 0 ? 15 : prev));
      progressTimerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev;
          // Asymptotically approach 85%
          const step = Math.max(1, (85 - prev) * 0.1);
          return Math.min(85, prev + step);
        });
      }, 100);
    } else if (visible) {
      clearInterval(progressTimerRef.current);
      // Fast finish to 100%
      setProgress(100);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }

    return () => {
      clearInterval(progressTimerRef.current);
    };
  }, [activeCount, visible]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[130] pointer-events-none overflow-hidden bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-ember-600 via-amber-400 to-ember-500 shadow-sm transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: activeCount > 0 ? 1 : 0,
          transitionProperty: 'width, opacity'
        }}
      />
    </div>
  );
}
