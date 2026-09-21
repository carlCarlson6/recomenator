import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { addReplyFn } from '../adapters/replies.functions.js';

export function ReplyForm({
  postId,
  parentId,
  onCancel,
}: {
  postId: string;
  parentId?: string;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const addReply = useMutation({
    mutationFn: addReplyFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId, 'replies'] });
      setContent('');
      onCancel?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReply.mutate({ data: { postId, content, parentId } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? 'Write a reply...' : 'Write a reply...'}
        className="w-full rounded-md border border-border bg-background px-3 py-2"
        rows={3}
        required
        maxLength={1000}
      />

      {addReply.error && (
        <p className="text-sm text-red-600">
          {addReply.error instanceof Error ? addReply.error.message : 'Failed to add reply'}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={addReply.isPending}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {addReply.isPending ? 'Replying...' : 'Reply'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
