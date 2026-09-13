import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-in/$')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <SignIn signUpUrl="/sign-up" />
    </main>
  )
}
