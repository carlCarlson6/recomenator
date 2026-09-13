import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import {
  getGroupFn,
  updateDisplayNameFn,
} from '#/modules/groups/adapters/groups.functions.js'

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

  const [displayName, setDisplayName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateDisplayName.mutate({ data: { groupId, displayName } })
  }

  if (!group) {
    return <div className="p-12 text-center">Loading...</div>
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold">{group.name} settings</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
    </main>
  )
}
