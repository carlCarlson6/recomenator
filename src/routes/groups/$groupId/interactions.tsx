import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { getInteractionsFn } from '#/modules/queries/interactions/interactions.functions.js'
import { PostCard } from '#/components/PostCard.js'
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js'

export const Route = createFileRoute('/groups/$groupId/interactions')({
  component: InteractionsPage,
})

const categories: { value: Category; label: string }[] = [
  { value: 'VIDEO_GAMES', label: 'Video games' },
  { value: 'MOVIES', label: 'Movies' },
  { value: 'SHOWS', label: 'Shows' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'MISC', label: 'Miscellaneous' },
];

const reactionTypes: { value: ReactionType; label: string }[] = [
  { value: 'interested', label: 'Interested' },
  { value: 'liked', label: 'Liked' },
  { value: 'not_liked', label: 'Not liked' },
  { value: 'viewed', label: 'Viewed' },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function InteractionsPage() {
  const { groupId } = useParams({ from: '/groups/$groupId/interactions' })
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedTypes, setSelectedTypes] = useState<ReactionType[]>([])

  const { data } = useQuery({
    queryKey: [
      'groups',
      groupId,
      'interactions',
      { categories: selectedCategories, types: selectedTypes },
    ],
    queryFn: () =>
      getInteractionsFn({
        data: {
          groupId,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          types: selectedTypes.length > 0 ? selectedTypes : undefined,
        },
      }),
  })

  if (!data) {
    return <div className="p-12 text-center">Loading...</div>
  }

  return (
    <>
      <main className="mx-auto max-w-xl px-4 py-12 pb-24">
        <Link
          to="/groups/$groupId"
          params={{ groupId }}
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to group
        </Link>

        <h1 className="mt-6 text-2xl font-bold">{data.groupName}</h1>
        <p className="mt-1 text-muted-foreground">My interactions</p>

        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const selected = selectedCategories.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      setSelectedCategories((prev) => toggleValue(prev, c.value))
                    }
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:border-primary hover:text-foreground'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Reaction types</p>
            <div className="flex flex-wrap gap-2">
              {reactionTypes.map((t) => {
                const selected = selectedTypes.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedTypes((prev) => toggleValue(prev, t.value))}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:border-primary hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {data.posts.length === 0 ? (
            <p className="text-muted-foreground">You haven&apos;t interacted with anything yet.</p>
          ) : (
            data.posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </main>
    </>
  )
}
