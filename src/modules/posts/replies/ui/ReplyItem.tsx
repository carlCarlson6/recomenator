import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { deleteReplyFn } from '../adapters/replies.functions.js';
import type { ReplyNodeDto } from '../application/ReplyUseCases.js';

import { ReplyForm } from './ReplyForm.js';

const MAX_VISUAL_DEPTH = 6;

export function ReplyItem({
  reply,
  currentUserId,
  postId,
}: {
  reply: ReplyNodeDto;
  currentUserId?: string;
  postId: string;
}) {
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const deleteReply = useMutation({
    mutationFn: deleteReplyFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId, 'replies'] });
    },
  });

  const isDeleted = !!reply.deletedAt;
  const canDelete = !isDeleted && currentUserId === reply.authorId;
  const showChildren = !isCollapsed && reply.children.length > 0;
  const canIndentChildren = reply.depth < MAX_VISUAL_DEPTH;

  return (
    <div>
      <div className="rounded-md border border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-primary">
            {isDeleted ? '[deleted]' : reply.authorDisplayName}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{reply.createdAt.toLocaleString()}</span>
            {reply.children.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCollapsed((c) => !c)}
                className="hover:text-foreground"
              >
                {isCollapsed ? 'Expand' : 'Collapse'}
              </button>
            )}
          </div>
        </div>

        <p className="mt-1 text-sm">
          {isDeleted ? '[deleted]' : reply.content}
        </p>

        {!isCollapsed && (
          <div className="mt-2 flex items-center gap-3 text-xs">
            {!isDeleted && (
              <button
                type="button"
                onClick={() => setIsReplying((r) => !r)}
                className="text-primary hover:underline"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => deleteReply.mutate({ data: { replyId: reply.id } })}
                disabled={deleteReply.isPending}
                className="text-destructive hover:underline disabled:opacity-50"
              >
                {deleteReply.isPending ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        )}

        {isReplying && !isDeleted && (
          <div className="mt-3">
            <ReplyForm
              postId={postId}
              parentId={reply.id}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}
      </div>

      {showChildren && (
        <div
          className={
            canIndentChildren
              ? 'ml-2 mt-3 space-y-3 border-l-2 border-border pl-3'
              : 'mt-3 space-y-3'
          }
        >
          {!canIndentChildren && (
            <p className="text-xs text-muted-foreground">Thread continues below</p>
          )}
          {reply.children.map((child) => (
            <ReplyItem
              key={child.id}
              reply={child}
              currentUserId={currentUserId}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
