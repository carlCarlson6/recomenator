import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Users } from 'lucide-react'

import { getPostDetailFn } from '#/modules/queries/postDetail/postDetail.functions.js'
import { PostForm } from '#/components/PostForm.js'

export const Route = createFileRoute('/groups/$groupId/posts/$postId_/edit')({
  component: EditPostPage,
})

function EditPostPage() {
  const { groupId, postId } = useParams({ from: '/groups/$groupId/posts/$postId_/edit' })
  const { userId } = useAuth()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => getPostDetailFn({ data: { postId } }),
  })

  if (!data) {
    return <div className="p-12 text-center">Loading...</div>
  }

  const isAuthor = userId === data.post.authorId
  const backToPost = () => navigate({ to: '/groups/$groupId/posts/$postId', params: { groupId, postId } })

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="flex items-center justify-between">
        <Link
          to="/groups/$groupId/posts/$postId"
          params={{ groupId, postId }}
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to recommendation
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <Users className="h-4 w-4" />
          My groups
        </Link>
      </div>

      <h1 className="mt-6 text-2xl font-bold">Edit recommendation</h1>

      <div className="mt-6">
        {isAuthor ? (
          <PostForm
            groupId={groupId}
            post={data.post}
            onSuccess={backToPost}
            onCancel={backToPost}
          />
        ) : (
          <p className="text-muted-foreground">
            Only the author can edit this recommendation.
          </p>
        )}
      </div>
    </main>
  )
}
