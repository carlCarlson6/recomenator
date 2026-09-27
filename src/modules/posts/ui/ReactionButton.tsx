import { useQuery } from '@tanstack/react-query';
import { Loader2, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { Tooltip } from '#/shared/ui/Tooltip.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';
import { listPostReactorsFn } from '../adapters/posts.functions.js';

export function ReactionButton({
  postId,
  type,
  label,
  icon: Icon,
  count,
  isActive,
  disabled,
  onClick,
}: {
  postId: string;
  type: ReactionType;
  label: string;
  icon: LucideIcon;
  count: number;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', postId, 'reactors', type],
    queryFn: () => listPostReactorsFn({ data: { postId, type } }),
    enabled: isHovered && count > 0,
    staleTime: 30_000,
  });

  const tooltipContent = (() => {
    if (count === 0) return null;
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (!data || data.reactors.length === 0) return null;

    return (
      <span className="flex flex-col gap-0.5">
        {data.reactors.map((reactor) => (
          <span key={reactor.userId}>{reactor.displayName}</span>
        ))}
      </span>
    );
  })();

  return (
    <Tooltip content={tooltipContent} enabled={count > 0}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
          isActive
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground'
        }`}
        aria-pressed={isActive}
        aria-label={`${label} (${count})`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
        <span className="font-medium">{count}</span>
      </button>
    </Tooltip>
  );
}
