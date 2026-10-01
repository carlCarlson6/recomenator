export type AvatarObject = {
  contentType: string | null;
  contentLength: number;
};

export interface AvatarStorage {
  createUploadUrl(input: {
    key: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string>;
  head(key: string): Promise<AvatarObject | null>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
  keyFromPublicUrl(url: string): string | null;
}
