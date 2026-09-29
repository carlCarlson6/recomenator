-- Local-only test data for the group notification center.
-- Requires `npm run db:seed` to have created the seed users/group/posts first,
-- and at least one local sign-in so a real Clerk user exists in `users`.
--
-- Run with:
--   docker exec -i recomenator-db psql -U recomenator -d recomenator < scripts/seed-notifications.sql
--
-- The recipient is auto-detected as the first non-seed user (your local login).
-- Re-running resets the test notifications (and their test replies), so it doubles
-- as a "mark everything unseen again" helper.

BEGIN;

SELECT u.id AS viewer_id
FROM users u
WHERE u.id NOT LIKE 'usr_seed_%'
ORDER BY u.created_at
LIMIT 1
\gset

\if :{?viewer_id}
\else
\set viewer_id 'usr_seed_owner'
\endif

INSERT INTO memberships (id, user_id, group_id, display_name, role, created_at, updated_at)
SELECT 'mem_test_notif_' || :'viewer_id', :'viewer_id', 'grp_seed_group', 'You', 'member', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM memberships
  WHERE user_id = :'viewer_id' AND group_id = 'grp_seed_group'
);

DELETE FROM notifications WHERE id LIKE 'ntf_test_%';
DELETE FROM replies WHERE id LIKE 'rpl_test_%';

INSERT INTO replies (id, post_id, author_id, content, parent_id, deleted_at, created_at, updated_at)
VALUES
  ('rpl_test_charlie', 'pst_seed_post', 'usr_seed_member_email', 'Agreed, the score is amazing.', 'rpl_seed_reply', NULL, now() - interval '26 minutes', now() - interval '26 minutes'),
  ('rpl_test_charlie_2', 'pst_seed_post_2', 'usr_seed_member_email', 'Da Funk is the best track.', NULL, NULL, now() - interval '8 minutes', now() - interval '8 minutes'),
  ('rpl_test_deleted', 'pst_seed_post', 'usr_seed_member_dana', 'This reply was deleted but still notified.', NULL, now() - interval '2 minutes', now() - interval '3 minutes', now() - interval '2 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, recipient_id, group_id, post_id, actor_id, type, reaction_type, reply_id, seen_at, created_at, updated_at)
VALUES
-- Unseen: reactions of every type on "Inception"
  ('ntf_test_01', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_username', 'reaction', 'liked', NULL, NULL, now() - interval '30 minutes', now() - interval '30 minutes'),
  ('ntf_test_02', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_email', 'reaction', 'interested', NULL, NULL, now() - interval '25 minutes', now() - interval '25 minutes'),
  ('ntf_test_03', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_dana', 'reaction', 'viewed', NULL, NULL, now() - interval '20 minutes', now() - interval '20 minutes'),
  ('ntf_test_04', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_email', 'reaction', 'not_liked', NULL, NULL, now() - interval '15 minutes', now() - interval '15 minutes'),
  ('ntf_test_09', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_username', 'reaction', 'interested', NULL, NULL, now() - interval '60 minutes', now() - interval '60 minutes'),
-- Unseen: replies, including nested and soft-deleted ones
  ('ntf_test_05', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_username', 'reply', NULL, 'rpl_seed_reply', NULL, now() - interval '24 minutes', now() - interval '24 minutes'),
  ('ntf_test_06', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_email', 'reply', NULL, 'rpl_test_charlie', NULL, now() - interval '26 minutes', now() - interval '26 minutes'),
  ('ntf_test_07', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_dana', 'reply', NULL, 'rpl_test_deleted', NULL, now() - interval '3 minutes', now() - interval '3 minutes'),
-- Unseen: orphaned recommendation (post deleted) and orphaned reply (no reply link)
  ('ntf_test_10', :'viewer_id', 'grp_seed_group', NULL, 'usr_seed_member_dana', 'reply', NULL, NULL, NULL, now() - interval '5 minutes', now() - interval '5 minutes'),
-- Seen: older events that should not count towards the badge
  ('ntf_test_11', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_username', 'reaction', 'liked', NULL, now() - interval '90 minutes', now() - interval '2 hours', now() - interval '90 minutes'),
  ('ntf_test_12', :'viewer_id', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_email', 'reply', NULL, 'rpl_seed_nested_reply', now() - interval '90 minutes', now() - interval '3 hours', now() - interval '90 minutes'),
-- Second recommendation, so the list mixes posts and timestamps
  ('ntf_test_13', :'viewer_id', 'grp_seed_group', 'pst_seed_post_2', 'usr_seed_member_dana', 'reaction', 'liked', NULL, NULL, now() - interval '12 minutes', now() - interval '12 minutes'),
  ('ntf_test_14', :'viewer_id', 'grp_seed_group', 'pst_seed_post_2', 'usr_seed_member_email', 'reply', NULL, 'rpl_test_charlie_2', NULL, now() - interval '8 minutes', now() - interval '8 minutes'),
  ('ntf_test_15', :'viewer_id', 'grp_seed_group', 'pst_seed_post_2', 'usr_seed_member_anon', 'reaction', 'viewed', NULL, NULL, now() - interval '40 minutes', now() - interval '40 minutes'),
-- Noise scoped to someone else: must never appear for the viewer
  ('ntf_test_16', 'usr_seed_owner', 'grp_seed_group', 'pst_seed_post', 'usr_seed_member_username', 'reaction', 'liked', NULL, NULL, now() - interval '35 minutes', now() - interval '35 minutes')
ON CONFLICT (id) DO NOTHING;

COMMIT;

SELECT :'viewer_id' AS recipient,
       count(*) FILTER (WHERE seen_at IS NULL) AS unseen,
       count(*) AS total
FROM notifications
WHERE id LIKE 'ntf_test_%' AND recipient_id = :'viewer_id';
