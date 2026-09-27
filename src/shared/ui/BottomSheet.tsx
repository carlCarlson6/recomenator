import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      const firstFocusable = overlayRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    } else {
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-xl rounded-t-lg border-x border-t border-border bg-card p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <h2 id="bottom-sheet-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-3 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
