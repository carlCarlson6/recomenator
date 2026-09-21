import type { ReplyNodeDto } from '../application/ReplyUseCases.js';

import { ReplyItem } from './ReplyItem.js';

export function ReplyList({
  replies,
  currentUserId,
  postId,
}: {
  replies: ReplyNodeDto[];
  currentUserId?: string;
  postId: string;
}) {
  if (replies.length === 0) {
    return <p className="text-sm text-muted-foreground">No replies yet.</p>;
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <ReplyItem
          key={reply.id}
          reply={reply}
          currentUserId={currentUserId}
          postId={postId}
        />
      ))}
    </div>
  );
}
