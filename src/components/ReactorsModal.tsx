import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { BottomSheet } from '#/shared/ui/BottomSheet.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';
import { listPostReactorsFn } from '#/modules/queries/reactors/reactors.functions.js';
import { Avatar } from './Avatar.js';

const TYPE_TITLES: Record<ReactionType, string> = {
  interested: 'Interested',
  liked: 'Liked',
  not_liked: 'Not liked',
  viewed: 'Viewed',
};

export function ReactorsModal({
  postId,
  type,
  isOpen,
  onClose,
}: {
  postId: string;
  type: ReactionType;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data, isPending } = useQuery({
    queryKey: ['posts', postId, 'reactors', type],
    queryFn: () => listPostReactorsFn({ data: { postId, type } }),
    enabled: isOpen,
    staleTime: 30_000,
  });

  const title = `${TYPE_TITLES[type]} by`;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      {isPending ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : !data || data.length === 0 ? (
        <p>No one has reacted yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((reactor) => (
            <li key={reactor.userId} className="flex items-center gap-2 font-medium text-foreground">
              <Avatar src={reactor.avatarUrl} name={reactor.displayName} size="sm" />
              {reactor.displayName}
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
