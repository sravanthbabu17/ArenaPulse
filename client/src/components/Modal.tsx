/**
 * @file Modal.tsx
 * @description Accessible slide-in modal sheet component for displaying AI-generated reports.
 *
 * Accessibility Compliance (WCAG 2.1):
 * - SC 2.1.2: Focus is trapped within the modal while open (no Tab escape).
 * - SC 2.1.1: Escape key closes the modal.
 * - SC 1.3.1: role="dialog", aria-modal="true", aria-labelledby wired to visible title.
 * - Focus is returned to the trigger element when the modal closes.
 */

import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** CSS selector string matching all natively focusable HTML elements. */
const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog with focus trapping and keyboard close support.
 * Clicking the backdrop or pressing Escape closes the dialog.
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Record the element that triggered the modal so we can restore focus on close
      triggerRef.current = document.activeElement;

      // Move focus into the modal on the next frame
      const timeout = setTimeout(() => {
        const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
        firstFocusable?.focus();
      }, 50);

      return () => clearTimeout(timeout);
    } else {
      // Restore focus to the triggering element when the modal closes
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    }
  }, [isOpen]);

  /** Traps Tab and Shift+Tab navigation inside the modal sheet. */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = Array.from(
      sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? []
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className={`modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        ref={sheetRef}
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
