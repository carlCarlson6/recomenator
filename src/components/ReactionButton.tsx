import { useQuery } from '@tanstack/react-query';
import { Loader2, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { Tooltip } from '#/shared/ui/Tooltip.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';
import { listPostReactorsFn } from '#/modules/queries/reactors/reactors.functions.js';
import { ReactorsModal } from './ReactorsModal.js';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ['posts', postId, 'reactors', type],
    queryFn: () => listPostReactorsFn({ data: { postId, type } }),
    enabled: isHovered && count > 0,
    staleTime: 30_000,
  });

  const tooltipContent = (() => {
    if (count === 0) return null;
    if (isPending) {
      return (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </span>
      );
    }
    if (!data || data.length === 0) return null;

    return (
      <span className="flex flex-col gap-0.5">
        {data.map((reactor) => (
          <span key={reactor.userId}>{reactor.displayName}</span>
        ))}
      </span>
    );
  })();

  const baseButtonClasses = `px-2.5 py-1 text-xs transition-colors inline-flex items-center gap-1 ${
    isActive
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground'
  }`;

  return (
    <>
      <Tooltip content={tooltipContent} enabled={count > 0}>
        <span
          className="inline-flex rounded-full border border-border overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${baseButtonClasses} rounded-l-full border-r`}
            aria-pressed={isActive}
            aria-label={label}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={count === 0}
            className={`${baseButtonClasses} rounded-r-full min-w-[2rem] justify-center`}
            aria-label={`${count} people ${label.toLowerCase()} this`}
          >
            <span className="font-medium">{count}</span>
          </button>
        </span>
      </Tooltip>

      <ReactorsModal
        postId={postId}
        type={type}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
