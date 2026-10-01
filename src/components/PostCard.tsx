import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Bookmark, Eye, MessageCircle, Pencil, ThumbsDown, ThumbsUp, Trash2, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { Modal } from '#/shared/ui/Modal.js';
import type { PostCardRM } from '#/modules/queries/shared/postCardQuery.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';
import {
  addPostReactionFn,
  deletePostFn,
  removePostReactionFn,
} from '#/modules/commands/posts/adapters/posts.functions.js';
import { ReactionButton } from './ReactionButton.js';
import { Avatar } from './Avatar.js';

const REACTION_CONFIG: Array<{
  type: ReactionType;
  label: string;
  icon: LucideIcon;
}> = [
  { type: 'interested', label: 'Interested', icon: Bookmark },
  { type: 'liked', label: 'Liked', icon: ThumbsUp },
  { type: 'not_liked', label: 'Not liked', icon: ThumbsDown },
  { type: 'viewed', label: 'Viewed', icon: Eye },
];

export function PostCard({
  post,
  currentUserId,
  onDelete,
}: {
  post: PostCardRM;
  currentUserId?: string;
  onDelete?: () => void;
}) {
  const queryClient = useQueryClient();
  const categoryLabel = post.category.replace('_', ' ');
  const isAuthor = currentUserId === post.authorId;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const invalidatePostReads = (type?: ReactionType) => {
    queryClient.invalidateQueries({ queryKey: ['groups', post.groupId, 'timeline'] });
    queryClient.invalidateQueries({ queryKey: ['groups', post.groupId, 'interactions'] });
    queryClient.invalidateQueries({ queryKey: ['posts', post.id] });
    if (type) {
      queryClient.invalidateQueries({ queryKey: ['posts', post.id, 'reactors', type] });
    }
    queryClient.invalidateQueries({ queryKey: ['home'] });
  };

  const addReaction = useMutation({
    mutationFn: addPostReactionFn,
    onSuccess: (_data, variables) => invalidatePostReads(variables.data.type),
  });

  const removeReaction = useMutation({
    mutationFn: removePostReactionFn,
    onSuccess: (_data, variables) => invalidatePostReads(variables.data.type),
  });

  const deletePost = useMutation({
    mutationFn: deletePostFn,
    onSuccess: () => {
      invalidatePostReads();
      onDelete?.();
    },
  });

  const handleConfirmDelete = () => {
    setIsModalOpen(false);
    deletePost.mutate({ data: { postId: post.id } });
  };

  const toggleReaction = (type: ReactionType) => {
    if (post.myReactions.includes(type)) {
      removeReaction.mutate({ data: { postId: post.id, type } });
    } else {
      addReaction.mutate({ data: { postId: post.id, type } });
    }
  };

  return (
    <article className="rounded-md border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {categoryLabel}
        </div>
        {post.rating !== null && (
          <div className="shrink-0 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            {post.rating}/10
          </div>
        )}
      </div>

      <h3 className="mt-1 text-lg font-semibold">{post.title}</h3>

      <div className="mt-1 flex items-center gap-2">
        <Avatar src={post.authorAvatarUrl} name={post.authorDisplayName} size="sm" />
        <p className="text-xs text-muted-foreground">by {post.authorDisplayName}</p>
      </div>

      {post.description && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {post.description}
        </p>
      )}

      {post.previewEmbedHtml ? (
        <div className="mt-3" dangerouslySetInnerHTML={{ __html: post.previewEmbedHtml }} />
      ) : post.previewImageUrl ? (
        <img
          src={post.previewImageUrl}
          alt=""
          className="mt-3 max-h-64 rounded-md object-cover"
        />
      ) : null}

      {post.externalUrl && (
        <a
          href={post.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block break-all text-sm text-primary"
        >
          {post.externalUrl}
        </a>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {REACTION_CONFIG.map(({ type, label, icon }) => {
          const isActive = post.myReactions.includes(type);
          const count = post.reactions.find((r) => r.type === type)?.count ?? 0;

          return (
            <ReactionButton
              key={type}
              postId={post.id}
              type={type}
              label={label}
              icon={icon}
              count={count}
              isActive={isActive}
              disabled={addReaction.isPending || removeReaction.isPending}
              onClick={() => toggleReaction(type)}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          to="/groups/$groupId/posts/$postId"
          params={{ groupId: post.groupId, postId: post.id }}
          className="inline-flex items-center gap-1.5 text-sm text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          <span>View replies</span>
          {post.replyCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
              {post.replyCount}
            </span>
          )}
        </Link>

        {isAuthor && (
          <div className="flex items-center gap-1">
            <Link
              to="/groups/$groupId/posts/$postId/edit"
              params={{ groupId: post.groupId, postId: post.id }}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Edit recommendation"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={deletePost.isPending}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-50"
              aria-label="Delete recommendation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delete recommendation"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deletePost.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </>
        }
      >
        Are you sure you want to delete this recommendation? This action cannot be undone.
      </Modal>
    </article>
  );
}
