import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { createGroupFn } from '#/modules/groups/adapters/groups.functions.js'

export const Route = createFileRoute('/groups/new')({ component: NewGroupPage })

function NewGroupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')

  const createGroup = useMutation({
    mutationFn: createGroupFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      navigate({ to: '/groups/$groupId', params: { groupId: data.id } })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createGroup.mutate({ data: { name, ownerDisplayName: displayName } })
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

      <h1 className="mt-6 text-2xl font-bold">Create a group</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Group name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            required
            maxLength={100}
          />
        </div>

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

        {createGroup.error && (
          <p className="text-sm text-red-600">
            {createGroup.error instanceof Error ? createGroup.error.message : 'Failed to create group'}
          </p>
        )}

        <button
          type="submit"
          disabled={createGroup.isPending}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {createGroup.isPending ? 'Creating...' : 'Create group'}
        </button>
      </form>
    </main>
  )
}
