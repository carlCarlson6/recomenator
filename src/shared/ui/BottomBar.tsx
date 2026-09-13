import type { ReactNode } from 'react';

export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-safe pt-2 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-2">{children}</div>
    </nav>
  );
}

export function BottomBarItem({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs font-medium ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {children}
    </div>
  );
}
