import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Trash2, X } from 'lucide-react';

import {
  createPostFn,
  deleteDraftFn,
  editPostFn,
  saveDraftFn,
} from '#/modules/commands/posts/adapters/posts.functions.js';
import { listDraftsFn } from '#/modules/queries/drafts/drafts.functions.js';
import type { DraftListRM } from '#/modules/queries/drafts/draftsQuery.js';
import type { PostCardRM } from '#/modules/queries/shared/postCardQuery.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

const categories: { value: Category; label: string }[] = [
  { value: 'VIDEO_GAMES', label: 'Video games' },
  { value: 'MOVIES', label: 'Movies' },
  { value: 'SHOWS', label: 'Shows' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'MISC', label: 'Miscellaneous' },
];

const categoryLabels: Record<Category, string> = {
  VIDEO_GAMES: 'Video games',
  MOVIES: 'Movies',
  SHOWS: 'Shows',
  MUSIC: 'Music',
  BOOKS: 'Books',
  MISC: 'Miscellaneous',
};

export type EditablePost = Pick<
  PostCardRM,
  'id' | 'category' | 'title' | 'description' | 'externalUrl' | 'rating'
>;

export function PostForm({
  groupId,
  post,
  onSuccess,
  onCancel,
}: {
  groupId: string;
  post?: EditablePost;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = post !== undefined;
  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState(post?.title ?? '');
  const [description, setDescription] = useState(post?.description ?? '');
  const [externalUrl, setExternalUrl] = useState(post?.externalUrl ?? '');
  const [category, setCategory] = useState<Category>(post?.category ?? 'MISC');
  const [rating, setRating] = useState<number | ''>(post?.rating ?? '');

  const draftsQuery = useQuery({
    queryKey: ['groups', groupId, 'drafts'],
    queryFn: () => listDraftsFn({ data: { groupId } }),
    enabled: !isEdit,
  });

  const createPost = useMutation({
    mutationFn: createPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'timeline'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'drafts'] });
      clearForm();
      onSuccess?.();
    },
  });

  const editPost = useMutation({
    mutationFn: editPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'timeline'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'interactions'] });
      if (post) {
        queryClient.invalidateQueries({ queryKey: ['posts', post.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['home'] });
      onSuccess?.();
    },
  });

  const saveDraft = useMutation({
    mutationFn: saveDraftFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'drafts'] });
      setDraftId(data.id);
    },
  });

  const deleteDraft = useMutation({
    mutationFn: deleteDraftFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'drafts'] });
      if (variables.data.draftId === draftId) {
        clearForm();
      }
    },
  });

  const clearForm = () => {
    setDraftId(null);
    setTitle('');
    setDescription('');
    setExternalUrl('');
    setCategory('MISC');
    setRating('');
  };

  const loadDraft = (draft: DraftListRM) => {
    setDraftId(draft.id);
    setCategory(draft.category);
    setTitle(draft.title ?? '');
    setDescription(draft.description ?? '');
    setExternalUrl(draft.externalUrl ?? '');
    setRating(draft.rating ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fields = {
      category,
      title,
      description: description || undefined,
      externalUrl: externalUrl || undefined,
      rating: rating === '' ? undefined : rating,
    };

    if (post) {
      editPost.mutate({ data: { postId: post.id, ...fields } });
      return;
    }

    createPost.mutate({
      data: {
        groupId,
        ...fields,
        draftId: draftId ?? undefined,
      },
    });
  };

  const handleSaveDraft = () => {
    saveDraft.mutate({
      data: {
        draftId: draftId ?? undefined,
        groupId,
        category,
        title: title || undefined,
        description: description || undefined,
        externalUrl: externalUrl || undefined,
        rating: rating === '' ? undefined : rating,
      },
    });
  };

  const handleDeleteDraft = (id: string) => {
    deleteDraft.mutate({ data: { draftId: id } });
  };

  const isPending = createPost.isPending || editPost.isPending || saveDraft.isPending;
  const error = createPost.error ?? editPost.error ?? saveDraft.error ?? deleteDraft.error;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border p-4">
        {!isEdit && draftId && (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Editing a draft</span>
            <button
              type="button"
              onClick={clearForm}
              className="inline-flex items-center gap-1 text-primary"
            >
              <X className="h-4 w-4" />
              New draft
            </button>
          </div>
        )}

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
          <label htmlFor="rating" className="block text-sm font-medium">
            Rating (optional)
          </label>
          <input
            id="rating"
            type="number"
            min={1}
            max={10}
            step={1}
            value={rating}
            onChange={(e) => {
              const value = e.target.value === '' ? '' : Number(e.target.value);
              setRating(value === '' ? '' : Math.min(10, Math.max(1, value)));
            }}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            placeholder="1–10"
          />
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

        {error && (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to process request'}
          </p>
        )}

        <div className="flex items-center gap-3">
          {!isEdit && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isPending}
              className="rounded-md border border-border px-4 py-2 text-foreground disabled:opacity-50"
            >
              {saveDraft.isPending ? 'Saving...' : 'Save as draft'}
            </button>
          )}

          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {isEdit
              ? editPost.isPending
                ? 'Saving...'
                : 'Save changes'
              : createPost.isPending
                ? 'Posting...'
                : 'Post recommendation'}
          </button>

          {isEdit && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border px-4 py-2 text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {!isEdit && (
        <section>
          <h2 className="text-lg font-semibold">Your drafts</h2>

          {draftsQuery.isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading drafts...</p>
          ) : draftsQuery.error ? (
            <p className="mt-2 text-sm text-red-600">Failed to load drafts</p>
          ) : draftsQuery.data && draftsQuery.data.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {draftsQuery.data.map((draft) => (
                <li
                  key={draft.id}
                  className={`flex items-center justify-between rounded-md border p-3 ${
                    draft.id === draftId ? 'border-primary bg-muted' : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => loadDraft(draft)}
                    className="flex flex-1 flex-col items-start gap-1 text-left"
                  >
                    <span className="font-medium">
                      {draft.title ?? 'Untitled draft'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {categoryLabels[draft.category]} ·{' '}
                      {new Date(draft.updatedAt).toLocaleString()}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteDraft(draft.id)}
                    disabled={deleteDraft.isPending}
                    className="ml-2 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    aria-label="Delete draft"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No drafts yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
