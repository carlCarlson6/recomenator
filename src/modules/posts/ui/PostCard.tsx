import { Link } from '@tanstack/react-router';

import type { PostDto } from '../application/CreatePost.js';

export function PostCard({ post }: { post: PostDto }) {
  const categoryLabel = post.category.replace('_', ' ');

  return (
    <article className="rounded-md border border-border p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {categoryLabel}
      </div>

      <h3 className="mt-1 text-lg font-semibold">{post.title}</h3>

      {post.description && (
        <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
      )}

      {post.previewEmbedHtml ? (
        <div
          className="mt-3"
          dangerouslySetInnerHTML={{ __html: post.previewEmbedHtml }}
        />
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
