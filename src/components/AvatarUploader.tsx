import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import {
  confirmAvatarUploadFn,
  createAvatarUploadUrlFn,
  removeAvatarFn,
} from '#/modules/commands/groups/adapters/avatar.functions.js';
import {
  AVATAR_MAX_DIMENSION,
  processAvatarImage,
  validateAvatarFile,
} from '#/shared/browser/processAvatarImage.js';
import { Modal } from '#/shared/ui/Modal.js';

import { Avatar } from './Avatar.js';

export function AvatarUploader({
  groupId,
  displayName,
  avatarUrl,
}: {
  groupId: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['home'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const validationError = validateAvatarFile(file);
      if (validationError) throw new Error(validationError);

      const processed = await processAvatarImage(file);
      const ticket = await createAvatarUploadUrlFn({
        data: { groupId, contentType: processed.contentType },
      });

      const response = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        body: processed.blob,
        headers: { 'Content-Type': processed.contentType },
      });
      if (!response.ok) throw new Error('Upload failed. Please try again.');

      return confirmAvatarUploadFn({ data: { groupId, objectKey: ticket.objectKey } });
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: () => removeAvatarFn({ data: { groupId } }),
    onSuccess: () => {
      setIsRemoveOpen(false);
      invalidate();
    },
  });

  const isBusy = upload.isPending || remove.isPending;
  const error = upload.error ?? remove.error;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    upload.mutate(file);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4">
        <Avatar src={avatarUrl} name={displayName} size="lg" />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {avatarUrl ? 'Change photo' : 'Upload photo'}
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={() => setIsRemoveOpen(true)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-destructive hover:bg-muted disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP or AVIF, up to 5 MB. Photos are resized to{' '}
            {AVATAR_MAX_DIMENSION}px before uploading.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Something went wrong'}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />

      <Modal
        isOpen={isRemoveOpen}
        onClose={() => setIsRemoveOpen(false)}
        title="Remove photo"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsRemoveOpen(false)}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Remove
            </button>
          </>
        }
      >
        Remove your custom photo from this group? Your name will fall back to your account image or
        initials.
      </Modal>
    </div>
  );
}
