import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { HandHeart, Home, Plus, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getGroupFn } from '#/modules/groups/adapters/groups.functions.js';
import { markGroupAsReadFn } from '#/modules/notifications/adapters/notifications.functions.js';
import { listTimelinePostsFn } from '#/modules/posts/adapters/posts.functions.js';
import { PostCard } from '#/modules/posts/ui/PostCard.js';
import { BottomBar, BottomBarItem } from '#/shared/ui/BottomBar.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

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
  const queryClient = useQueryClient()
  const [category, setCategory] = useState<Category | undefined>(undefined)

  const { data: group } = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => getGroupFn({ data: { groupId } }),
  })

  const { data: posts = [] } = useQuery({
    queryKey: ['groups', groupId, 'timeline', { category }],
    queryFn: () => listTimelinePostsFn({ data: { groupId, category } }),
  })

  const markRead = useMutation({
    mutationFn: markGroupAsReadFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread'] })
    },
  })

  useEffect(() => {
    markRead.mutate({ data: { groupId } })
  }, [groupId])

  if (!group) {
    return <div className="p-12 text-center">Loading...</div>
  }

  return (
    <>
      <main className="mx-auto max-w-xl px-4 py-12 pb-24">
        <h1 className="text-2xl font-bold">{group.name}</h1>

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
            {posts.length === 0 ? (
              <p className="text-muted-foreground">No recommendations yet.</p>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} currentUserId={userId ?? undefined} />)
            )}
          </div>
        </div>
      </main>

      <BottomBar>
        <Link to="/" className="flex-1">
          <BottomBarItem>
            <Home className="h-5 w-5" />
            <span>Home</span>
          </BottomBarItem>
        </Link>

        <Link
          to="/groups/$groupId/interactions"
          params={{ groupId }}
          className="flex-1"
        >
          <BottomBarItem>
            <HandHeart className="h-5 w-5" />
            <span>Interactions</span>
          </BottomBarItem>
        </Link>

        <Link
          to="/groups/$groupId/posts/new"
          params={{ groupId }}
          className="flex-1"
        >
          <BottomBarItem>
            <Plus className="h-5 w-5" />
            <span>Recommend</span>
          </BottomBarItem>
        </Link>

        <Link
          to="/groups/$groupId/settings"
          params={{ groupId }}
          className="flex-1"
        >
          <BottomBarItem>
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </BottomBarItem>
        </Link>
      </BottomBar>
    </>
  )
}
