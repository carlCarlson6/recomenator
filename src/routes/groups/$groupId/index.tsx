import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import { getTimelineFn } from '#/modules/queries/timeline/timeline.functions.js'
import { listGroupMembersFn } from '#/modules/queries/members/members.functions.js'
import { PostCard } from '#/components/PostCard.js'
import type { Category } from '#/shared/infrastructure/db/schema.js'

export const Route = createFileRoute('/groups/$groupId/')({
  component: GroupPage,
})

const categories: { value: Category; label: string }[] = [
  { value: 'VIDEO_GAMES', label: 'Video games' },
  { value: 'MOVIES', label: 'Movies' },
  { value: 'SHOWS', label: 'Shows' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'MISC', label: 'Miscellaneous' },
];

function chipClass(selected: boolean) {
  return `rounded-full px-3 py-1 text-sm whitespace-nowrap ${
    selected ? 'bg-primary text-primary-foreground' : 'border border-border'
  }`
}

function GroupPage() {
  const { groupId } = useParams({ from: '/groups/$groupId/' })
  const { userId } = useAuth()
  const [category, setCategory] = useState<Category | undefined>(undefined)
  const [authorId, setAuthorId] = useState<string | undefined>(undefined)

  const { data: members } = useQuery({
    queryKey: ['groups', groupId, 'members'],
    queryFn: () => listGroupMembersFn({ data: { groupId } }),
  })

  const { data } = useQuery({
    queryKey: ['groups', groupId, 'timeline', { category, authorId }],
    queryFn: () => getTimelineFn({ data: { groupId, category, authorId } }),
  })

  if (!data) {
    return <div className="p-12 text-center">Loading...</div>
  }

  const hasFilters = category !== undefined || authorId !== undefined

  return (
    <main className="mx-auto max-w-xl px-4 py-12 pb-24">
      <h1 className="text-2xl font-bold">{data.groupName}</h1>

      <div className="mt-10 space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium">Category</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCategory(undefined)}
              className={chipClass(category === undefined)}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={chipClass(category === c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {members && members.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Posted by</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setAuthorId(undefined)}
                className={chipClass(authorId === undefined)}
              >
                Everyone
              </button>
              {members.map((member) => (
                <button
                  key={member.userId}
                  onClick={() => setAuthorId(member.userId)}
                  className={chipClass(authorId === member.userId)}
                >
                  {member.userId === userId ? 'You' : member.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {data.posts.length === 0 ? (
            <p className="text-muted-foreground">
              {hasFilters ? 'No recommendations match these filters.' : 'No recommendations yet.'}
            </p>
          ) : (
            data.posts.map((post) => <PostCard key={post.id} post={post} currentUserId={userId ?? undefined} />)
          )}
        </div>
      </div>
    </main>
  )
}
