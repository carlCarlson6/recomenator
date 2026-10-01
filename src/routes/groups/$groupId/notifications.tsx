import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { ArrowLeft, Bell } from 'lucide-react'
import { useEffect } from 'react'

import { getGroupNotificationsFn } from '#/modules/queries/notifications/notifications.functions.js'
import type { NotificationRM } from '#/modules/queries/notifications/notificationsQuery.js'
import type { ReactionType } from '#/shared/infrastructure/db/schema.js'
import { Avatar } from '#/components/Avatar.js'

export const Route = createFileRoute('/groups/$groupId/notifications')({
  component: NotificationsPage,
})

const reactionLabels: Record<ReactionType, string> = {
  interested: 'is interested in',
  liked: 'liked',
  not_liked: 'did not like',
  viewed: 'viewed',
}

function notificationText(notification: NotificationRM): string {
  if (notification.type === 'reply') {
    return 'replied to'
  }
  const reactionType = notification.reactionType
  return reactionType ? reactionLabels[reactionType] : 'reacted to'
}

function NotificationsPage() {
  const { groupId } = useParams({ from: '/groups/$groupId/notifications' })
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['groups', groupId, 'notifications'],
    queryFn: () => getGroupNotificationsFn({ data: { groupId } }),
  })

  useEffect(() => {
    if (!data) return
    queryClient.invalidateQueries({
      queryKey: ['groups', groupId, 'notifications', 'unreadCount'],
    })
    queryClient.invalidateQueries({ queryKey: ['home'] })
  }, [data, groupId, queryClient])

  if (!data) {
    return <div className="p-12 text-center">Loading...</div>
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 pb-24">
      <Link
        to="/groups/$groupId"
        params={{ groupId }}
        className="inline-flex items-center gap-1 text-sm text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to group
      </Link>

      <h1 className="mt-6 text-2xl font-bold">Notifications</h1>
      <p className="mt-1 text-muted-foreground">{data.groupName}</p>

      <div className="mt-6 space-y-3">
        {data.notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Bell className="h-8 w-8" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          data.notifications.map((notification) => {
            const body = (
              <div
                className={`rounded-md border border-border p-3 ${
                  notification.seenAt === null ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <Avatar
                    src={notification.actorAvatarUrl}
                    name={notification.actorDisplayName}
                    size="sm"
                  />
                  <p className="text-sm">
                    <span className="font-medium">{notification.actorDisplayName}</span>{' '}
                    {notificationText(notification)}{' '}
                    {notification.postTitle ? (
                      <span className="font-medium">{notification.postTitle}</span>
                    ) : (
                      <span className="text-muted-foreground">a removed recommendation</span>
                    )}
                  </p>
                </div>
                {notification.type === 'reply' && notification.replyContent && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {notification.replyContent}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {notification.createdAt.toLocaleString()}
                </p>
              </div>
            )

            if (!notification.postId) {
              return <div key={notification.id}>{body}</div>
            }

            return (
              <Link
                key={notification.id}
                to="/groups/$groupId/posts/$postId"
                params={{ groupId, postId: notification.postId }}
                className="block"
              >
                {body}
              </Link>
            )
          })
        )}
      </div>
    </main>
  )
}
