import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { getHomeDataFn } from '#/modules/queries/home/home.functions.js'
import {
  prioritizeLastVisited,
  readLastVisitedGroupId,
} from '#/shared/browser/lastVisitedGroup.js'

export const Route = createFileRoute('/')({
  component: Home,
  loader: async ({ context }) => {
    if (!context.user) {
      return { groups: [] }
    }

    return { groups: await getHomeDataFn() }
  },
})

function Home() {
  const { groups } = Route.useLoaderData()
  const [lastVisitedGroupId, setLastVisitedGroupId] = useState<string | null>(null)

  useEffect(() => {
    setLastVisitedGroupId(readLastVisitedGroupId())
  }, [])

  const orderedGroups = prioritizeLastVisited(groups, lastVisitedGroupId)

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">Recomenator</h1>
      <p className="mt-2 text-muted-foreground">
        Share recommendations with friends.
      </p>

      <div className="mt-8">
        <Show
          when="signed-out"
          fallback={<UserButton />}
        >
          <SignInButton mode="modal">
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
              Sign in
            </button>
          </SignInButton>
        </Show>
      </div>

      <Show when="signed-in">
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My groups</h2>
            <Link
              to="/groups/new"
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            >
              Create group
            </Link>
          </div>

          {groups.length === 0 ? (
            <p className="mt-4 text-muted-foreground">No groups yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {orderedGroups.map((group) => (
                <li key={group.id}>
                  <Link
                    to="/groups/$groupId"
                    params={{ groupId: group.id }}
                    className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted"
                  >
                    <div>
                      <div className="font-medium">
                        {group.name}
                        {group.id === lastVisitedGroupId && (
                          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                            Jump back in
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        You are {group.displayName}
                      </div>
                    </div>
                    {group.unreadCount > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {group.unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Show>
    </main>
  )
}
