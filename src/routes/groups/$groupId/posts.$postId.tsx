import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Users } from 'lucide-react';

import { getPostFn } from '#/modules/posts/adapters/posts.functions.js';
import { PostCard } from '#/modules/posts/ui/PostCard.js';
import { listRepliesFn } from '#/modules/posts/replies/adapters/replies.functions.js';
import { ReplyForm } from '#/modules/posts/replies/ui/ReplyForm.js';
import { ReplyList } from '#/modules/posts/replies/ui/ReplyList.js';

export const Route = createFileRoute('/groups/$groupId/posts/$postId')({
  component: PostDetailPage,
})

function PostDetailPage() {
  const { groupId, postId } = useParams({ from: '/groups/$groupId/posts/$postId' })
  const { userId } = useAuth()
  const navigate = useNavigate()

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
      <div className="flex items-center justify-between">
        <Link
          to="/groups/$groupId"
          params={{ groupId }}
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to group
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <Users className="h-4 w-4" />
          My groups
        </Link>
      </div>

      <div className="mt-6">
        <PostCard
          post={post}
          currentUserId={userId ?? undefined}
          onDelete={() => navigate({ to: '/groups/$groupId', params: { groupId } })}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Replies</h2>
        <div className="mt-4">
          <ReplyForm postId={postId} />
        </div>
        <div className="mt-6">
          <ReplyList
            replies={replies}
            currentUserId={userId ?? undefined}
            postId={postId}
          />
        </div>
      </div>
    </main>
  )
}
