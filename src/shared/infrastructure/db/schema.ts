import { check, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { createId } from '#/shared/kernel/idGenerator.js';
import { timestamps } from './timestamps.js';

export type Role = 'owner' | 'member';
export type Category = 'VIDEO_GAMES' | 'MOVIES' | 'SHOWS' | 'MUSIC' | 'BOOKS' | 'MISC';
export type ReactionType = 'interested' | 'liked' | 'not_liked' | 'viewed';
export type NotificationType = 'reaction' | 'reply';

export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull(),
  username: text('username'),
  avatarUrl: text('avatar_url'),
  ...timestamps,
});

export const groups = pgTable(
  'groups',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('grp'))
      .notNull(),
    name: text('name').notNull(),
    createdById: text('created_by_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    ...timestamps,
  },
  (t) => [index('groups_created_by_id_idx').on(t.createdById)],
);

export const invites = pgTable(
  'invites',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('inv'))
      .notNull(),
    code: text('code').notNull().unique(),
    groupId: text('group_id')
      .references(() => groups.id, { onDelete: 'cascade' })
      .notNull(),
    // Legacy column kept for backwards compatibility. Invites never expire and
    // this value is never enforced; it is still written on create.
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    usageCount: integer('usage_count').notNull().default(0),
    maxUses: integer('max_uses'),
    createdById: text('created_by_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    ...timestamps,
  },
  (t) => [index('invites_code_idx').on(t.code), index('invites_group_id_idx').on(t.groupId)],
);

export const memberships = pgTable(
  'memberships',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('mem'))
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    groupId: text('group_id')
      .references(() => groups.id, { onDelete: 'cascade' })
      .notNull(),
    displayName: text('display_name').notNull(),
    // Custom avatars are per-membership, like display names. Null means "fall
    // back to local initials" (rendered by the Avatar component).
    avatarUrl: text('avatar_url'),
    role: text('role').$type<Role>().notNull().default('member'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('memberships_user_id_group_id_unique').on(t.userId, t.groupId),
    index('memberships_user_id_idx').on(t.userId),
    index('memberships_group_id_idx').on(t.groupId),
  ],
);

export const posts = pgTable(
  'posts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('pst'))
      .notNull(),
    groupId: text('group_id')
      .references(() => groups.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: text('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    category: text('category').$type<Category>().notNull(),
    title: text('title').notNull(),
    description: text('description'),
    externalUrl: text('external_url'),
    previewImageUrl: text('preview_image_url'),
    previewEmbedHtml: text('preview_embed_html'),
    rating: integer('rating'),
    ...timestamps,
  },
  (t) => [
    index('posts_group_id_created_at_idx').on(t.groupId, t.createdAt),
    index('posts_group_id_category_created_at_idx').on(t.groupId, t.category, t.createdAt),
    check('posts_rating_check', sql`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 10`),
  ],
);

export const replies = pgTable(
  'replies',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('rpl'))
      .notNull(),
    postId: text('post_id')
      .references(() => posts.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: text('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    content: text('content').notNull(),
    parentId: text('parent_id').references((): any => replies.id, { onDelete: 'no action' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (t) => [
    index('replies_post_id_created_at_idx').on(t.postId, t.createdAt),
    index('replies_parent_id_idx').on(t.parentId),
  ],
);

export const drafts = pgTable(
  'drafts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('drf'))
      .notNull(),
    groupId: text('group_id')
      .references(() => groups.id, { onDelete: 'cascade' })
      .notNull(),
    authorId: text('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    category: text('category').$type<Category>().notNull(),
    title: text('title'),
    description: text('description'),
    externalUrl: text('external_url'),
    rating: integer('rating'),
    ...timestamps,
  },
  (t) => [
    index('drafts_group_id_author_id_updated_at_idx').on(t.groupId, t.authorId, t.updatedAt),
    check('drafts_rating_check', sql`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 10`),
  ],
);

export const postReactions = pgTable(
  'post_reactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('rct'))
      .notNull(),
    postId: text('post_id')
      .references(() => posts.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').$type<ReactionType>().notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('post_reactions_post_id_user_id_type_unique').on(t.postId, t.userId, t.type),
    index('post_reactions_post_id_type_idx').on(t.postId, t.type),
    index('post_reactions_user_id_type_created_at_idx').on(t.userId, t.type, t.createdAt),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('ntf'))
      .notNull(),
    recipientId: text('recipient_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    groupId: text('group_id')
      .references(() => groups.id, { onDelete: 'cascade' })
      .notNull(),
    postId: text('post_id').references(() => posts.id, { onDelete: 'set null' }),
    actorId: text('actor_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').$type<NotificationType>().notNull(),
    reactionType: text('reaction_type').$type<ReactionType>(),
    replyId: text('reply_id').references(() => replies.id, { onDelete: 'set null' }),
    seenAt: timestamp('seen_at', { withTimezone: true, mode: 'date' }),
    ...timestamps,
  },
  (t) => [
    index('notifications_recipient_id_group_id_seen_at_idx').on(t.recipientId, t.groupId, t.seenAt),
    index('notifications_recipient_id_group_id_created_at_idx').on(
      t.recipientId,
      t.groupId,
      t.createdAt,
    ),
  ],
);
