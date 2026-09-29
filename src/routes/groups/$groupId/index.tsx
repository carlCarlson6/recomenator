import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import { getTimelineFn } from '#/modules/queries/timeline/timeline.functions.js'
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

function GroupPage() {
  const { groupId } = useParams({ from: '/groups/$groupId/' })
  const { userId } = useAuth()
  const [category, setCategory] = useState<Category | undefined>(undefined)

  const { data } = useQuery({
    queryKey: ['groups', groupId, 'timeline', { category }],
    queryFn: () => getTimelineFn({ data: { groupId, category } }),
  })

  if (!data) {
    return <div className="p-12 text-center">Loading...</div>
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 pb-24">
      <h1 className="text-2xl font-bold">{data.groupName}</h1>

      <div className="mt-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCategory(undefined)}
            className={`rounded-full px-3 py-1 text-sm ${
              category === undefined
                ? 'bg-primary text-primary-foreground'
                : 'border border-border'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-3 py-1 text-sm whitespace-nowrap ${
                category === c.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {data.posts.length === 0 ? (
            <p className="text-muted-foreground">No recommendations yet.</p>
          ) : (
            data.posts.map((post) => <PostCard key={post.id} post={post} currentUserId={userId ?? undefined} />)
          )}
        </div>
      </div>
    </main>
  )
}
