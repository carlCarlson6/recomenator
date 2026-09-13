import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { createPostFn } from '../adapters/posts.functions.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

const categories: { value: Category; label: string }[] = [
  { value: 'VIDEO_GAMES', label: 'Video games' },
  { value: 'MOVIES', label: 'Movies' },
  { value: 'SHOWS', label: 'Shows' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'MISC', label: 'Miscellaneous' },
];

export function CreatePostForm({
  groupId,
  onSuccess,
}: {
  groupId: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [category, setCategory] = useState<Category>('MISC');

  const createPost = useMutation({
    mutationFn: createPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'timeline'] });
      setTitle('');
      setDescription('');
      setExternalUrl('');
      setCategory('MISC');
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate({
      data: {
        groupId,
        title,
        description: description || undefined,
        externalUrl: externalUrl || undefined,
        category,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border p-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          required
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          rows={3}
          maxLength={2000}
        />
      </div>

      <div>
        <label htmlFor="externalUrl" className="block text-sm font-medium">
          Link (optional)
        </label>
        <input
          id="externalUrl"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      {createPost.error && (
        <p className="text-sm text-red-600">
          {createPost.error instanceof Error
            ? createPost.error.message
            : 'Failed to create post'}
        </p>
      )}

      <button
        type="submit"
        disabled={createPost.isPending}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {createPost.isPending ? 'Posting...' : 'Post recommendation'}
      </button>
    </form>
  );
}
