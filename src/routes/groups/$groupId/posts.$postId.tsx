import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Users } from 'lucide-react';

import { getPostDetailFn } from '#/modules/queries/postDetail/postDetail.functions.js';
import { PostCard } from '#/components/PostCard.js';
import { ReplyForm } from '#/components/ReplyForm.js';
import { ReplyList } from '#/components/ReplyList.js';

export const Route = createFileRoute('/groups/$groupId/posts/$postId')({
  component: PostDetailPage,
})

function PostDetailPage() {
  const { groupId, postId } = useParams({ from: '/groups/$groupId/posts/$postId' })
  const { userId } = useAuth()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => getPostDetailFn({ data: { postId } }),
  })

  if (!data) {
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
          post={data.post}
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
            replies={data.replies}
            currentUserId={userId ?? undefined}
            postId={postId}
          />
        </div>
      </div>
    </main>
  )
}
