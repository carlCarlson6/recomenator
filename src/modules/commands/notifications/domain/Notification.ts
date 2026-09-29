import { createId } from '#/shared/kernel/idGenerator.js';
import type { NotificationType, ReactionType } from '#/shared/infrastructure/db/schema.js';

export class Notification {
  private constructor(
    readonly id: string,
    readonly recipientId: string,
    readonly groupId: string,
    readonly postId: string | null,
    readonly actorId: string,
    readonly type: NotificationType,
    readonly reactionType: ReactionType | null,
    readonly replyId: string | null,
    readonly seenAt: Date | null,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    recipientId: string;
    groupId: string;
    postId: string;
    actorId: string;
    type: NotificationType;
    reactionType?: ReactionType | null;
    replyId?: string | null;
  }): Notification {
    return new Notification(
      createId('ntf'),
      input.recipientId,
      input.groupId,
      input.postId,
      input.actorId,
      input.type,
      input.reactionType ?? null,
      input.replyId ?? null,
      null,
      new Date(),
    );
  }

  markSeen(seenAt: Date): Notification {
    return new Notification(
      this.id,
      this.recipientId,
      this.groupId,
      this.postId,
      this.actorId,
      this.type,
      this.reactionType,
      this.replyId,
      seenAt,
      this.createdAt,
    );
  }
}
