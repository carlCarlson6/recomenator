import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import {
  groups,
  memberships,
  notifications,
  posts,
  replies,
  users,
} from '#/shared/infrastructure/db/schema.js';
import type { NotificationType, ReactionType } from '#/shared/infrastructure/db/schema.js';
import { resolveDisplayNames } from '../shared/userIdentity.js';

export type NotificationRM = {
  id: string;
  actorId: string;
  actorDisplayName: string;
  type: NotificationType;
  reactionType: ReactionType | null;
  postId: string | null;
  postTitle: string | null;
  replyId: string | null;
  replyContent: string | null;
  createdAt: Date;
  seenAt: Date | null;
};

export type NotificationsRM = {
  groupId: string;
  groupName: string;
  notifications: NotificationRM[];
};

export async function getNotifications(
  groupId: string,
  userId: string,
): Promise<NotificationsRM> {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)))
    .limit(1);
  if (!membership) throw new Error('Not a member of this group');

  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group) throw new Error('Group not found');

  const rows = await db
    .select({
      id: notifications.id,
      actorId: notifications.actorId,
      type: notifications.type,
      reactionType: notifications.reactionType,
      postId: notifications.postId,
      postTitle: posts.title,
      replyId: notifications.replyId,
      replyContent: replies.content,
      createdAt: notifications.createdAt,
      seenAt: notifications.seenAt,
      actorDisplayName: memberships.displayName,
      actorEmail: users.email,
    })
    .from(notifications)
    .leftJoin(posts, eq(posts.id, notifications.postId))
    .leftJoin(replies, eq(replies.id, notifications.replyId))
    .leftJoin(
      memberships,
      and(
        eq(memberships.userId, notifications.actorId),
        eq(memberships.groupId, notifications.groupId),
      ),
    )
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(
      and(eq(notifications.recipientId, userId), eq(notifications.groupId, groupId)),
    )
    .orderBy(desc(notifications.createdAt));

  const displayNameMap = await resolveDisplayNames(
    rows.map((row) => ({
      userId: row.actorId,
      displayName: row.actorDisplayName,
      email: row.actorEmail,
    })),
  );

  return {
    groupId,
    groupName: group.name,
    notifications: rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      actorDisplayName: displayNameMap.get(row.actorId) ?? 'Anonymous',
      type: row.type,
      reactionType: row.reactionType,
      postId: row.postId,
      postTitle: row.postTitle,
      replyId: row.replyId,
      replyContent: row.replyContent,
      createdAt: row.createdAt,
      seenAt: row.seenAt,
    })),
  };
}

export async function getUnreadNotificationCount(
  groupId: string,
  userId: string,
): Promise<number> {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)))
    .limit(1);
  if (!membership) throw new Error('Not a member of this group');

  const [row] = await db
    .select({ count: count(notifications.id) })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.groupId, groupId),
        isNull(notifications.seenAt),
      ),
    );

  return Number(row?.count ?? 0);
}
