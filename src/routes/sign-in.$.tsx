import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  redirect_url: z.string().optional(),
})

export const Route = createFileRoute('/sign-in/$')({
  validateSearch: searchSchema,
  component: SignInPage,
})

function SignInPage() {
  const { redirect_url } = Route.useSearch()

  const signUpUrl = redirect_url
    ? `/sign-up?redirect_url=${encodeURIComponent(redirect_url)}`
    : '/sign-up'

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <SignIn
        signUpUrl={signUpUrl}
        fallbackRedirectUrl={redirect_url ?? '/'}
      />
    </main>
  )
}
