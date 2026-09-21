import { syncClerkUser } from './modules/auth/application/SyncClerkUser.js';
import { DrizzleUserRepository } from './modules/auth/infrastructure/DrizzleUserRepository.js';
import { createGroup } from './modules/groups/application/CreateGroup.js';
import { generateInvite } from './modules/groups/application/GenerateInvite.js';
import { getGroup, updateDisplayName } from './modules/groups/application/GetGroup.js';
import { getInvitePreview } from './modules/groups/application/GetInvitePreview.js';
import { getMyMembershipForGroup } from './modules/groups/application/GetMyMembershipForGroup.js';
import { joinGroupWithInvite } from './modules/groups/application/JoinGroup.js';
import { listMyGroups } from './modules/groups/application/ListMyGroups.js';
import { DrizzleGroupRepository } from './modules/groups/infrastructure/DrizzleGroupRepository.js';
import { DrizzleInviteRepository } from './modules/groups/infrastructure/DrizzleInviteRepository.js';
import { DrizzleMembershipRepository } from './modules/groups/infrastructure/DrizzleMembershipRepository.js';
import { createPost, listTimelinePosts } from './modules/posts/application/CreatePost.js';
import { deletePost } from './modules/posts/application/DeletePost.js';
import { listMyInteractions } from './modules/posts/application/ListMyInteractions.js';
import { getPost } from './modules/posts/application/GetPost.js';
import {
  addPostReaction,
  removePostReaction,
} from './modules/posts/application/PostReactionUseCases.js';
import {
  deleteDraft,
  listDrafts,
  saveDraft,
} from './modules/posts/application/DraftUseCases.js';
import { DrizzlePostRepository } from './modules/posts/infrastructure/DrizzlePostRepository.js';
import { DrizzlePostReactionRepository } from './modules/posts/infrastructure/DrizzlePostReactionRepository.js';
import { DrizzleDraftRepository } from './modules/posts/infrastructure/DrizzleDraftRepository.js';
import { OpenGraphLinkPreviewService } from './modules/posts/linkPreview/infrastructure/OpenGraphLinkPreviewService.js';
import { addReply, deleteReply, listReplies } from './modules/posts/replies/application/ReplyUseCases.js';
import { DrizzleReplyRepository } from './modules/posts/replies/infrastructure/DrizzleReplyRepository.js';
import {
  getUnreadGroups,
  markGroupAsRead,
} from './modules/notifications/application/NotificationUseCases.js';
import { DrizzleNotificationRepository } from './modules/notifications/infrastructure/DrizzleNotificationRepository.js';

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
    syncClerkUser: (input: Parameters<typeof syncClerkUser>[0]) => syncClerkUser(input, { userRepo }),

    createGroup: (input: Parameters<typeof createGroup>[0]) =>
      createGroup(input, { groupRepo, membershipRepo }),

    generateInvite: (input: Parameters<typeof generateInvite>[0]) =>
      generateInvite(input, { groupRepo, inviteRepo, membershipRepo }),

    getInvitePreview: (input: Parameters<typeof getInvitePreview>[0]) =>
      getInvitePreview(input, { inviteRepo, groupRepo }),

    getMyMembershipForGroup: (input: Parameters<typeof getMyMembershipForGroup>[0]) =>
      getMyMembershipForGroup(input, { membershipRepo, groupRepo }),

    joinGroupWithInvite: (input: Parameters<typeof joinGroupWithInvite>[0]) =>
      joinGroupWithInvite(input, { groupRepo, inviteRepo, membershipRepo }),

    getGroup: (input: Parameters<typeof getGroup>[0]) =>
      getGroup(input, { groupRepo, membershipRepo }),

    listMyGroups: (input: Parameters<typeof listMyGroups>[0]) =>
      listMyGroups(input, { membershipRepo, groupRepo }),

    updateDisplayName: (input: Parameters<typeof updateDisplayName>[0]) =>
      updateDisplayName(input, { membershipRepo }),

    createPost: (input: Parameters<typeof createPost>[0]) =>
      createPost(input, { postRepo, membershipRepo, userRepo, linkPreviewService, draftRepo }),

    deletePost: (input: Parameters<typeof deletePost>[0]) =>
      deletePost(input, { postRepo }),

    saveDraft: (input: Parameters<typeof saveDraft>[0]) =>
      saveDraft(input, { draftRepo, membershipRepo }),

    listDrafts: (input: Parameters<typeof listDrafts>[0]) =>
      listDrafts(input, { draftRepo, membershipRepo }),

    deleteDraft: (input: Parameters<typeof deleteDraft>[0]) =>
      deleteDraft(input, { draftRepo }),

    listTimelinePosts: (input: Parameters<typeof listTimelinePosts>[0]) =>
      listTimelinePosts(input, { postRepo, membershipRepo, userRepo, postReactionRepo, replyRepo }),

    listMyInteractions: (input: Parameters<typeof listMyInteractions>[0]) =>
      listMyInteractions(input, { postRepo, membershipRepo, userRepo, postReactionRepo, replyRepo }),

    getPost: (input: Parameters<typeof getPost>[0]) =>
      getPost(input, { postRepo, membershipRepo, userRepo, postReactionRepo, replyRepo }),

    addPostReaction: (input: Parameters<typeof addPostReaction>[0]) =>
      addPostReaction(input, { postRepo, membershipRepo, postReactionRepo }),

    removePostReaction: (input: Parameters<typeof removePostReaction>[0]) =>
      removePostReaction(input, { postRepo, membershipRepo, postReactionRepo }),

    addReply: (input: Parameters<typeof addReply>[0]) =>
      addReply(input, { replyRepo, postRepo, membershipRepo, userRepo }),

    listReplies: (input: Parameters<typeof listReplies>[0]) =>
      listReplies(input, { replyRepo, postRepo, membershipRepo, userRepo }),

    deleteReply: (input: Parameters<typeof deleteReply>[0]) =>
      deleteReply(input, { replyRepo }),

    getUnreadGroups: (input: Parameters<typeof getUnreadGroups>[0]) =>
      getUnreadGroups(input, { notificationRepo }),

    markGroupAsRead: (input: Parameters<typeof markGroupAsRead>[0]) =>
      markGroupAsRead(input, { notificationRepo }),
  };
}
