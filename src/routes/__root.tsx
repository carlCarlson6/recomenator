import { ClerkProvider } from '@clerk/tanstack-react-start'
import { QueryClientProvider } from '@tanstack/react-query'
import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'

import '#/env/client.js'
import { getCurrentUserFn } from '#/modules/auth/adapters/auth.functions.js'
import { queryClient } from '#/shared/infrastructure/queryClient.js'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Recomenator',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    return { user }
  },
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg text-gray-600">Page not found.</p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Go home
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ClerkProvider>

        <Scripts />
      </body>
    </html>
  )
}
