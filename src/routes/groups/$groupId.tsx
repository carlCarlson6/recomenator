import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, useLocation, useParams } from '@tanstack/react-router'
import { Bell, HandHeart, Home, Plus, Settings } from 'lucide-react'
import { useEffect } from 'react'

import { getUnreadNotificationCountFn } from '#/modules/queries/notifications/notifications.functions.js'
import { rememberLastVisitedGroup } from '#/shared/browser/lastVisitedGroup.js'
import { BottomBar, BottomBarItem } from '#/shared/ui/BottomBar.js'

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupLayout,
})

function GroupLayout() {
  const { groupId } = useParams({ from: '/groups/$groupId' })
  const location = useLocation()

  useEffect(() => {
    rememberLastVisitedGroup(groupId)
  }, [groupId])

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['groups', groupId, 'notifications', 'unreadCount'],
    queryFn: () => getUnreadNotificationCountFn({ data: { groupId } }),
  })

  const hideBar = location.pathname.includes('/posts/')

  return (
    <>
      <Outlet />

      {!hideBar && (
        <BottomBar>
          <Link
            to="/"
            className="flex-1"
          >
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
            <BottomBarItem active={location.pathname === `/groups/${groupId}/interactions`}>
              <HandHeart className="h-5 w-5" />
              <span>Interactions</span>
            </BottomBarItem>
          </Link>

          <Link
            to="/groups/$groupId/posts/new"
            params={{ groupId }}
            className="flex-1"
          >
            <BottomBarItem active={location.pathname === `/groups/${groupId}/posts/new`}>
              <Plus className="h-5 w-5" />
              <span>Recommend</span>
            </BottomBarItem>
          </Link>

          <Link
            to="/groups/$groupId/notifications"
            params={{ groupId }}
            className="flex-1"
          >
            <BottomBarItem active={location.pathname === `/groups/${groupId}/notifications`}>
              <span className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </span>
              <span>Notifications</span>
            </BottomBarItem>
          </Link>

          <Link
            to="/groups/$groupId/settings"
            params={{ groupId }}
            className="flex-1"
          >
            <BottomBarItem active={location.pathname === `/groups/${groupId}/settings`}>
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </BottomBarItem>
          </Link>
        </BottomBar>
      )}
    </>
  )
}
