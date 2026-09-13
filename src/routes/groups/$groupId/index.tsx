import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import {
  generateInviteFn,
  getGroupFn,
} from '#/modules/groups/adapters/groups.functions.js';
import { markGroupAsReadFn } from '#/modules/notifications/adapters/notifications.functions.js';
import { listTimelinePostsFn } from '#/modules/posts/adapters/posts.functions.js';
import { CreatePostForm } from '#/modules/posts/ui/CreatePostForm.js';
import { PostCard } from '#/modules/posts/ui/PostCard.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

export const Route = createFileRoute('/groups/$groupId/')({
  component: GroupPage,
})

const categories: { value: Category; label: string }[] = [
  { value: 'VIDEO_GAMES', label: 'Video games' },
  { value: 'MOVIES', label: 'Movies' },
  { value: 'SHOWS', label: 'Shows' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'MISC', label: 'Miscellaneous' },
];

function GroupPage() {
  const { groupId } = useParams({ from: '/groups/$groupId/' })
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

  const generateInvite = useMutation({
    mutationFn: generateInviteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'invite'] })
    },
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

  const [copied, setCopied] = useState(false)

  if (!group) {
    return <div className="p-12 text-center">Loading...</div>
  }

  const inviteCode = generateInvite.data?.code
  const inviteLink = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/groups/join/${inviteCode}`
    : null

  const copyLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <Link
          to="/groups/$groupId/settings"
          params={{ groupId }}
          className="text-sm text-primary"
        >
          Settings
        </Link>
      </div>

      <div className="mt-6">
        <button
          onClick={() => generateInvite.mutate({ data: { groupId } })}
          disabled={generateInvite.isPending}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          Generate invite link
        </button>

        {generateInvite.error && (
          <p className="mt-2 text-sm text-red-600">
            {generateInvite.error instanceof Error
              ? generateInvite.error.message
              : 'Failed to generate invite'}
          </p>
        )}

        {inviteLink && (
          <div className="mt-4 flex items-center gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm"
            />
            <button
              onClick={copyLink}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-10">
        <CreatePostForm groupId={groupId} />
      </div>

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
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </main>
  )
}
