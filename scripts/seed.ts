import 'dotenv/config';

import { db } from '../src/shared/infrastructure/db/client.js';
import {
  groups,
  invites,
  memberships,
  postReactions,
  posts,
  replies,
  users,
} from '../src/shared/infrastructure/db/schema.js';

async function seed() {
  const ownerId = 'usr_seed_owner';
  const memberWithUsernameId = 'usr_seed_member_username';
  const memberWithEmailOnlyId = 'usr_seed_member_email';
  const memberAnonymousId = 'usr_seed_member_anon';
  const memberDanaId = 'usr_seed_member_dana';

  await db.insert(users).values([
    { id: ownerId, email: 'owner@example.com', username: 'alex_owner' },
    { id: memberWithUsernameId, email: 'bob@example.com', username: 'bob_liked' },
    { id: memberWithEmailOnlyId, email: 'charlie@example.com', username: null },
    { id: memberAnonymousId, email: '', username: null },
    { id: memberDanaId, email: 'dana@example.com', username: 'dana_viewed' },
  ]).onConflictDoNothing();

  const [group] = await db
    .insert(groups)
    .values({
      id: 'grp_seed_group',
      name: 'The Recommendation Club',
      createdById: ownerId,
    })
    .returning();

  await db.insert(memberships).values([
    { id: 'mem_seed_owner', userId: ownerId, groupId: group.id, displayName: 'Alex', role: 'owner' },
    { id: 'mem_seed_member_username', userId: memberWithUsernameId, groupId: group.id, displayName: 'Bob', role: 'member' },
    { id: 'mem_seed_member_email', userId: memberWithEmailOnlyId, groupId: group.id, displayName: 'Charlie', role: 'member' },
    { id: 'mem_seed_member_anon', userId: memberAnonymousId, groupId: group.id, displayName: 'AnonUser', role: 'member' },
    { id: 'mem_seed_member_dana', userId: memberDanaId, groupId: group.id, displayName: 'Dana', role: 'member' },
  ]).onConflictDoNothing();

  await db.insert(invites).values({
    id: 'inv_seed_invite',
    code: 'seedseedseedseedseedseedseedseed',
    groupId: group.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdById: ownerId,
  }).onConflictDoNothing();

  const [post1] = await db
    .insert(posts)
    .values({
      id: 'pst_seed_post',
      groupId: group.id,
      authorId: ownerId,
      category: 'MOVIES',
      title: 'Inception',
      description: 'A mind-bending thriller.',
      externalUrl: 'https://www.imdb.com/title/tt1375666/',
    })
    .returning();

  const [post2] = await db
    .insert(posts)
    .values({
      id: 'pst_seed_post_2',
      groupId: group.id,
      authorId: memberWithUsernameId,
      category: 'MUSIC',
      title: 'Discovery by Daft Punk',
      description: 'Perfect work music.',
      externalUrl: 'https://open.spotify.com/album/2noRn2Aes5oNVqXwzAX1MQ',
    })
    .returning();

  await db.insert(replies).values([
    {
      id: 'rpl_seed_reply',
      postId: post1.id,
      authorId: memberWithUsernameId,
      content: 'One of my favorites!',
    },
    {
      id: 'rpl_seed_nested_reply',
      postId: post1.id,
      authorId: ownerId,
      content: 'The hallway fight scene alone is worth the rewatch.',
      parentId: 'rpl_seed_reply',
    },
  ]).onConflictDoNothing();

  // Reactions for post 1 — covers all types and multiple reactors for the tooltip QA.
  await db.insert(postReactions).values([
    { id: 'rct_seed_liked_owner', postId: post1.id, userId: ownerId, type: 'liked' },
    { id: 'rct_seed_liked_bob', postId: post1.id, userId: memberWithUsernameId, type: 'liked' },
    { id: 'rct_seed_liked_charlie', postId: post1.id, userId: memberWithEmailOnlyId, type: 'liked' },
    { id: 'rct_seed_liked_anon', postId: post1.id, userId: memberAnonymousId, type: 'liked' },
    { id: 'rct_seed_interested_dana', postId: post1.id, userId: memberDanaId, type: 'interested' },
    { id: 'rct_seed_viewed_owner', postId: post1.id, userId: ownerId, type: 'viewed' },
    { id: 'rct_seed_viewed_dana', postId: post1.id, userId: memberDanaId, type: 'viewed' },
    { id: 'rct_seed_not_liked_charlie', postId: post1.id, userId: memberWithEmailOnlyId, type: 'not_liked' },
  ]).onConflictDoNothing();

  // Reactions for post 2 — smaller set to verify zero-count tooltips.
  await db.insert(postReactions).values([
    { id: 'rct_seed_2_liked_bob', postId: post2.id, userId: memberWithUsernameId, type: 'liked' },
  ]).onConflictDoNothing();

  console.log('Database seeded.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
