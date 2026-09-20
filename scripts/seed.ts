import 'dotenv/config';

import { db } from '../src/shared/infrastructure/db/client.js';
import {
  groups,
  invites,
  memberships,
  posts,
  replies,
  users,
} from '../src/shared/infrastructure/db/schema.js';

async function seed() {
  const userId = 'usr_seed_owner';
  const memberId = 'usr_seed_member';

  await db.insert(users).values([
    { id: userId, email: 'owner@example.com' },
    { id: memberId, email: 'member@example.com' },
  ]).onConflictDoNothing();

  const [group] = await db
    .insert(groups)
    .values({
      id: 'grp_seed_group',
      name: 'The Recommendation Club',
      createdById: userId,
    })
    .returning();

  await db.insert(memberships).values([
    { id: 'mem_seed_owner', userId, groupId: group.id, displayName: 'Alex', role: 'owner' },
    { id: 'mem_seed_member', userId: memberId, groupId: group.id, displayName: 'Sam', role: 'member' },
  ]).onConflictDoNothing();

  await db.insert(invites).values({
    id: 'inv_seed_invite',
    code: 'seedseedseedseedseedseedseedseed',
    groupId: group.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdById: userId,
  }).onConflictDoNothing();

  const [post] = await db
    .insert(posts)
    .values({
      id: 'pst_seed_post',
      groupId: group.id,
      authorId: userId,
      category: 'MOVIES',
      title: 'Inception',
      description: 'A mind-bending thriller.',
      externalUrl: 'https://www.imdb.com/title/tt1375666/',
    })
    .returning();

  await db.insert(replies).values([
    {
      id: 'rpl_seed_reply',
      postId: post.id,
      authorId: memberId,
      content: 'One of my favorites!',
    },
    {
      id: 'rpl_seed_nested_reply',
      postId: post.id,
      authorId: userId,
      content: 'The hallway fight scene alone is worth the rewatch.',
      parentId: 'rpl_seed_reply',
    },
  ]).onConflictDoNothing();

  console.log('Database seeded.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
