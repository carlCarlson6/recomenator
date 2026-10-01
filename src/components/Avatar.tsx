import { useState } from 'react';

const SIZE_CLASSES = {
  xs: 'h-4 w-4 text-[8px]',
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-16 w-16 text-lg',
} as const;

export type AvatarSize = keyof typeof SIZE_CLASSES;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 'sm',
  className = '',
}: {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && failedSrc !== src;

  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted font-medium uppercase text-muted-foreground ${SIZE_CLASSES[size]} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
