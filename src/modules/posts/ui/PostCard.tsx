import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Bookmark, Eye, ThumbsDown, ThumbsUp, type LucideIcon } from 'lucide-react';

import type { PostDto } from '../application/CreatePost.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';
import { addPostReactionFn, removePostReactionFn } from '../adapters/posts.functions.js';

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

export function PostCard({ post }: { post: PostDto }) {
  const queryClient = useQueryClient();
  const categoryLabel = post.category.replace('_', ' ');

  const addReaction = useMutation({
    mutationFn: addPostReactionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', post.groupId, 'timeline'] });
      queryClient.invalidateQueries({ queryKey: ['posts', post.id] });
    },
  });

  const removeReaction = useMutation({
    mutationFn: removePostReactionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', post.groupId, 'timeline'] });
      queryClient.invalidateQueries({ queryKey: ['posts', post.id] });
    },
  });

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

      <p className="mt-1 text-xs text-muted-foreground">by {post.authorDisplayName}</p>

      {post.description && (
        <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
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
        {REACTION_CONFIG.map(({ type, label, icon: Icon }) => {
          const isActive = post.myReactions.includes(type);
          const count = post.reactions.find((r) => r.type === type)?.count ?? 0;

          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleReaction(type)}
              disabled={addReaction.isPending || removeReaction.isPending}
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
          );
        })}
      </div>

      <Link
        to="/groups/$groupId/posts/$postId"
        params={{ groupId: post.groupId, postId: post.id }}
        className="mt-3 inline-block text-sm text-primary"
      >
        View replies
      </Link>
    </article>
  );
}
