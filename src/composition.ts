import { syncClerkUser } from './modules/commands/auth/application/SyncClerkUser.js';
import { DrizzleUserRepository } from './modules/commands/auth/infrastructure/DrizzleUserRepository.js';
import { createGroup } from './modules/commands/groups/application/CreateGroup.js';
import { generateInvite } from './modules/commands/groups/application/GenerateInvite.js';
import { joinGroupWithInvite } from './modules/commands/groups/application/JoinGroup.js';
import { updateDisplayName } from './modules/commands/groups/application/UpdateDisplayName.js';
import { DrizzleGroupRepository } from './modules/commands/groups/infrastructure/DrizzleGroupRepository.js';
import { DrizzleInviteRepository } from './modules/commands/groups/infrastructure/DrizzleInviteRepository.js';
import { DrizzleMembershipRepository } from './modules/commands/groups/infrastructure/DrizzleMembershipRepository.js';
import { createPost } from './modules/commands/posts/application/CreatePost.js';
import { deletePost } from './modules/commands/posts/application/DeletePost.js';
import { editPost } from './modules/commands/posts/application/EditPost.js';
import {
  addPostReaction,
  removePostReaction,
} from './modules/commands/posts/application/PostReactionUseCases.js';
import { deleteDraft, saveDraft } from './modules/commands/posts/application/DraftUseCases.js';
import { DrizzlePostRepository } from './modules/commands/posts/infrastructure/DrizzlePostRepository.js';
import { DrizzlePostReactionRepository } from './modules/commands/posts/infrastructure/DrizzlePostReactionRepository.js';
import { DrizzleDraftRepository } from './modules/commands/posts/infrastructure/DrizzleDraftRepository.js';
import { OpenGraphLinkPreviewService } from './modules/commands/posts/linkPreview/infrastructure/OpenGraphLinkPreviewService.js';
import {
  addReply,
  deleteReply,
} from './modules/commands/posts/replies/application/ReplyUseCases.js';
import { DrizzleReplyRepository } from './modules/commands/posts/replies/infrastructure/DrizzleReplyRepository.js';
import { markNotificationsSeen } from './modules/commands/notifications/application/NotificationUseCases.js';
import { DrizzleNotificationRepository } from './modules/commands/notifications/infrastructure/DrizzleNotificationRepository.js';

const userRepo = new DrizzleUserRepository();
const groupRepo = new DrizzleGroupRepository();
const inviteRepo = new DrizzleInviteRepository();
const membershipRepo = new DrizzleMembershipRepository();
const postRepo = new DrizzlePostRepository();
const draftRepo = new DrizzleDraftRepository();
const postReactionRepo = new DrizzlePostReactionRepository();
const replyRepo = new DrizzleReplyRepository();
const notificationRepo = new DrizzleNotificationRepository();
const linkPreviewService = new OpenGraphLinkPreviewService();

export function createUseCases() {
  return {
    syncClerkUser: (input: Parameters<typeof syncClerkUser>[0]) =>
      syncClerkUser(input, { userRepo }),

    createGroup: (input: Parameters<typeof createGroup>[0]) =>
      createGroup(input, { groupRepo, membershipRepo }),

    generateInvite: (input: Parameters<typeof generateInvite>[0]) =>
      generateInvite(input, { groupRepo, inviteRepo, membershipRepo }),

    joinGroupWithInvite: (input: Parameters<typeof joinGroupWithInvite>[0]) =>
      joinGroupWithInvite(input, { groupRepo, inviteRepo, membershipRepo }),

    updateDisplayName: (input: Parameters<typeof updateDisplayName>[0]) =>
      updateDisplayName(input, { membershipRepo }),

    createPost: (input: Parameters<typeof createPost>[0]) =>
      createPost(input, { postRepo, membershipRepo, linkPreviewService, draftRepo }),

    deletePost: (input: Parameters<typeof deletePost>[0]) =>
      deletePost(input, { postRepo }),

    editPost: (input: Parameters<typeof editPost>[0]) =>
      editPost(input, { postRepo, linkPreviewService }),

    saveDraft: (input: Parameters<typeof saveDraft>[0]) =>
      saveDraft(input, { draftRepo, membershipRepo }),

    deleteDraft: (input: Parameters<typeof deleteDraft>[0]) =>
      deleteDraft(input, { draftRepo }),

    addPostReaction: (input: Parameters<typeof addPostReaction>[0]) =>
      addPostReaction(input, { postRepo, membershipRepo, postReactionRepo, notificationRepo }),

    removePostReaction: (input: Parameters<typeof removePostReaction>[0]) =>
      removePostReaction(input, { postRepo, membershipRepo, postReactionRepo }),

    addReply: (input: Parameters<typeof addReply>[0]) =>
      addReply(input, { replyRepo, postRepo, membershipRepo, notificationRepo }),

    deleteReply: (input: Parameters<typeof deleteReply>[0]) =>
      deleteReply(input, { replyRepo }),

    markNotificationsSeen: (input: Parameters<typeof markNotificationsSeen>[0]) =>
      markNotificationsSeen(input, { notificationRepo }),
  };
}
