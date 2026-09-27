import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';

export type PostCardRM = {
  id: string;
  groupId: string;
  authorId: string;
  category: Category;
  title: string;
  description: string | null;
  externalUrl: string | null;
  previewImageUrl: string | null;
  previewEmbedHtml: string | null;
  rating: number | null;
  authorDisplayName: string;
  reactions: Array<{ type: ReactionType; count: number }>;
  myReactions: ReactionType[];
  replyCount: number;
  createdAt: Date;
};

export function buildPostCardRM(
  post: {
    id: string;
    groupId: string;
    authorId: string;
    category: Category;
    title: string;
    description: string | null;
    externalUrl: string | null;
    previewImageUrl: string | null;
    previewEmbedHtml: string | null;
    rating: number | null;
    createdAt: Date;
  },
  authorDisplayName: string,
  reactions: Array<{ type: ReactionType; count: number }>,
  myReactions: ReactionType[],
  replyCount: number,
): PostCardRM {
  return {
    ...post,
    authorDisplayName,
    reactions,
    myReactions,
    replyCount,
  };
}
