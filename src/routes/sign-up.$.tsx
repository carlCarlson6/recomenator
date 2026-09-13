import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  redirect_url: z.string().optional(),
})

export const Route = createFileRoute('/sign-up/$')({
  validateSearch: searchSchema,
  component: SignUpPage,
})

function SignUpPage() {
  const { redirect_url } = Route.useSearch()

  const signInUrl = redirect_url
    ? `/sign-in?redirect_url=${encodeURIComponent(redirect_url)}`
    : '/sign-in'

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <SignUp
        signInUrl={signInUrl}
        fallbackRedirectUrl={redirect_url ?? '/'}
      />
    </main>
  )
}
