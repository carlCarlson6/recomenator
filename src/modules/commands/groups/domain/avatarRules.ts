export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const AVATAR_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type AvatarContentType = (typeof AVATAR_CONTENT_TYPES)[number];

const AVATAR_EXTENSIONS: Record<AvatarContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export function isAvatarContentType(value: string | null | undefined): value is AvatarContentType {
  return value != null && (AVATAR_CONTENT_TYPES as readonly string[]).includes(value);
}

export function avatarExtension(contentType: AvatarContentType): string {
  return AVATAR_EXTENSIONS[contentType];
}
