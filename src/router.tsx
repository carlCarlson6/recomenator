import { createRouter as createTanStackRouter, Link } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function DefaultNotFound() {
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

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: DefaultNotFound,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
