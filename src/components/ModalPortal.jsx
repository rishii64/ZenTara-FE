import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders modal content directly into document.body to prevent
 * clipping, unwanted top margins, and stacking context issues with navbars.
 */
export default function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(children, document.body);
}
