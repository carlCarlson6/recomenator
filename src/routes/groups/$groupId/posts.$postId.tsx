import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useParams } from '@tanstack/react-router';

import { getPostFn } from '#/modules/posts/adapters/posts.functions.js';
import { PostCard } from '#/modules/posts/ui/PostCard.js';
import { listRepliesFn } from '#/modules/replies/adapters/replies.functions.js';
import { ReplyForm } from '#/modules/replies/ui/ReplyForm.js';
import { ReplyList } from '#/modules/replies/ui/ReplyList.js';

export const Route = createFileRoute('/groups/$groupId/posts/$postId')({
  component: PostDetailPage,
})

function PostDetailPage() {
  const { groupId, postId } = useParams({ from: '/groups/$groupId/posts/$postId' })

  const { data: post } = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => getPostFn({ data: { postId } }),
  })

  const { data: replies = [] } = useQuery({
    queryKey: ['posts', postId, 'replies'],
    queryFn: () => listRepliesFn({ data: { postId } }),
  })

  if (!post) {
    return <div className="p-12 text-center">Loading...</div>
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Link
        to="/groups/$groupId"
        params={{ groupId }}
        className="text-sm text-primary"
      >
        ← Back to group
      </Link>

      <div className="mt-6">
        <PostCard post={post} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Replies</h2>
        <div className="mt-4">
          <ReplyForm postId={postId} />
        </div>
        <div className="mt-6">
          <ReplyList replies={replies} />
        </div>
      </div>
    </main>
  )
}
