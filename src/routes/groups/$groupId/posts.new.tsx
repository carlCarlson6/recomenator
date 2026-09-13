import { useNavigate, createFileRoute, useParams } from '@tanstack/react-router';
import { ArrowLeft, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { CreatePostForm } from '#/modules/posts/ui/CreatePostForm.js';

export const Route = createFileRoute('/groups/$groupId/posts/new')({
  component: NewPostPage,
});

function NewPostPage() {
  const { groupId } = useParams({ from: '/groups/$groupId/posts/new' });
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="flex items-center justify-between">
        <Link
          to="/groups/$groupId"
          params={{ groupId }}
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to group
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <Users className="h-4 w-4" />
          My groups
        </Link>
      </div>

      <h1 className="mt-6 text-2xl font-bold">Add recommendation</h1>

      <div className="mt-6">
        <CreatePostForm
          groupId={groupId}
          onSuccess={() => navigate({ to: '/groups/$groupId', params: { groupId } })}
        />
      </div>
    </main>
  );
}
