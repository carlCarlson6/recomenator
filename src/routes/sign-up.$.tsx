import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-up/$')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <SignUp signInUrl="/sign-in" />
    </main>
  )
}
