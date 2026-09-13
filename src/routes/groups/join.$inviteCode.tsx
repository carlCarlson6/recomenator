import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { getCurrentUserFn } from '#/modules/auth/adapters/auth.functions.js'
import {
  getInvitePreviewFn,
  getMyMembershipForGroupFn,
  joinGroupFn,
} from '#/modules/groups/adapters/groups.functions.js'

export const Route = createFileRoute('/groups/join/$inviteCode')({
  beforeLoad: async ({ params, location }) => {
    const user = await getCurrentUserFn()
    if (!user) {
      throw redirect({
        to: '/sign-in/$',
        search: { redirect_url: location.href },
      })
    }

    const preview = await getInvitePreviewFn({ data: { code: params.inviteCode } })
    const membership = await getMyMembershipForGroupFn({
      data: { groupId: preview.groupId },
    })

    return { preview, membership }
  },
  component: JoinGroupPage,
})

function JoinGroupPage() {
  const { preview, membership } = Route.useRouteContext()
  const { inviteCode } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState('')

  const join = useMutation({
    mutationFn: joinGroupFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      navigate({ to: '/groups/$groupId', params: { groupId: data.groupId } })
    },
  })

  if (membership) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="mt-6 text-2xl font-bold">You're already a member</h1>
        <p className="mt-2 text-muted-foreground">
          You're already part of <span className="font-medium text-foreground">{preview.groupName}</span>.
        </p>

        <Link
          to="/groups/$groupId"
          params={{ groupId: preview.groupId }}
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Go to group
        </Link>
      </main>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    join.mutate({ data: { code: inviteCode, displayName } })
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="mt-6 text-2xl font-bold">Join {preview.groupName}</h1>
      <p className="mt-2 text-muted-foreground">Invitation code: {inviteCode}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium">
            Your display name in this group
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            required
            maxLength={50}
          />
        </div>

        {join.error && (
          <p className="text-sm text-red-600">
            {join.error instanceof Error ? join.error.message : 'Failed to join group'}
          </p>
        )}

        <button
          type="submit"
          disabled={join.isPending}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {join.isPending ? 'Joining...' : 'Join group'}
        </button>
      </form>
    </main>
  )
}
