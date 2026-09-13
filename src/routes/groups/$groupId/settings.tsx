import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { ArrowLeft, Users } from 'lucide-react'
import { useState } from 'react'

import {
  generateInviteFn,
  getGroupFn,
  updateDisplayNameFn,
} from '#/modules/groups/adapters/groups.functions.js'
import { ThemeSelect } from '#/shared/ui/ThemeSelect.js'

export const Route = createFileRoute('/groups/$groupId/settings')({
  component: GroupSettingsPage,
})

function GroupSettingsPage() {
  const { groupId } = useParams({ from: '/groups/$groupId/settings' })
  const queryClient = useQueryClient()

  const { data: group } = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => getGroupFn({ data: { groupId } }),
  })

  const updateDisplayName = useMutation({
    mutationFn: updateDisplayNameFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] })
    },
  })

  const generateInvite = useMutation({
    mutationFn: generateInviteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'invite'] })
    },
  })

  const [displayName, setDisplayName] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateDisplayName.mutate({ data: { groupId, displayName } })
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

  if (!group) {
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

      <h1 className="mt-6 text-2xl font-bold">{group.name} settings</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Your display name</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium">
              Update your display name
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

          {updateDisplayName.error && (
            <p className="text-sm text-red-600">
              {updateDisplayName.error instanceof Error
                ? updateDisplayName.error.message
                : 'Failed to update display name'}
            </p>
          )}

          {updateDisplayName.isSuccess && (
            <p className="text-sm text-green-600">Display name updated.</p>
          )}

          <button
            type="submit"
            disabled={updateDisplayName.isPending}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {updateDisplayName.isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Invite link</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this link with friends so they can join the group.
        </p>

        <button
          onClick={() => generateInvite.mutate({ data: { groupId } })}
          disabled={generateInvite.isPending}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
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
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="mt-4">
          <ThemeSelect />
        </div>
      </section>
    </main>
  )
}
