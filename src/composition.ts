import { syncClerkUser } from './modules/auth/application/SyncClerkUser.js';
import { DrizzleUserRepository } from './modules/auth/infrastructure/DrizzleUserRepository.js';
import { createGroup } from './modules/groups/application/CreateGroup.js';
import { generateInvite } from './modules/groups/application/GenerateInvite.js';
import { getGroup, updateDisplayName } from './modules/groups/application/GetGroup.js';
import { joinGroupWithInvite } from './modules/groups/application/JoinGroup.js';
import { listMyGroups } from './modules/groups/application/ListMyGroups.js';
import { DrizzleGroupRepository } from './modules/groups/infrastructure/DrizzleGroupRepository.js';
import { DrizzleInviteRepository } from './modules/groups/infrastructure/DrizzleInviteRepository.js';
import { DrizzleMembershipRepository } from './modules/groups/infrastructure/DrizzleMembershipRepository.js';
import { createPost, listTimelinePosts } from './modules/posts/application/CreatePost.js';
import { getPost } from './modules/posts/application/GetPost.js';
import { DrizzlePostRepository } from './modules/posts/infrastructure/DrizzlePostRepository.js';
import { OpenGraphLinkPreviewService } from './modules/linkPreview/infrastructure/OpenGraphLinkPreviewService.js';
import { addReply, listReplies } from './modules/replies/application/ReplyUseCases.js';
import { DrizzleReplyRepository } from './modules/replies/infrastructure/DrizzleReplyRepository.js';
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

    joinGroupWithInvite: (input: Parameters<typeof joinGroupWithInvite>[0]) =>
      joinGroupWithInvite(input, { groupRepo, inviteRepo, membershipRepo }),

    getGroup: (input: Parameters<typeof getGroup>[0]) =>
      getGroup(input, { groupRepo, membershipRepo }),

    listMyGroups: (input: Parameters<typeof listMyGroups>[0]) =>
      listMyGroups(input, { membershipRepo, groupRepo }),

    updateDisplayName: (input: Parameters<typeof updateDisplayName>[0]) =>
      updateDisplayName(input, { membershipRepo }),

    createPost: (input: Parameters<typeof createPost>[0]) =>
      createPost(input, { postRepo, membershipRepo, linkPreviewService }),

    listTimelinePosts: (input: Parameters<typeof listTimelinePosts>[0]) =>
      listTimelinePosts(input, { postRepo, membershipRepo }),

    getPost: (input: Parameters<typeof getPost>[0]) =>
      getPost(input, { postRepo, membershipRepo }),

    addReply: (input: Parameters<typeof addReply>[0]) =>
      addReply(input, { replyRepo, postRepo, membershipRepo }),

    listReplies: (input: Parameters<typeof listReplies>[0]) =>
      listReplies(input, { replyRepo, postRepo, membershipRepo }),

    getUnreadGroups: (input: Parameters<typeof getUnreadGroups>[0]) =>
      getUnreadGroups(input, { notificationRepo }),

    markGroupAsRead: (input: Parameters<typeof markGroupAsRead>[0]) =>
      markGroupAsRead(input, { notificationRepo }),
  };
}
