import { useState, type ReactNode } from 'react';

/**
 * Simple hover tooltip.
 *
 * Wraps its children in a relative container and renders the tooltip above
 * the trigger on mouse enter. Hides on mouse leave.
 *
 * NOTE: Accessibility is intentionally minimal per project direction for
 * this feature. Enhance with aria attributes if that changes.
 */
export function Tooltip({
  children,
  content,
  enabled = true,
}: {
  children: ReactNode;
  content: ReactNode;
  enabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  if (!enabled || !content) {
    return <>{children}</>;
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-md">
          {content}
        </span>
      )}
    </span>
  );
}
