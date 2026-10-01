import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '#/env/server.js';

import type { AvatarObject, AvatarStorage } from '../domain/ports/AvatarStorage.js';

let client: S3Client | null = null;

function getClient(): S3Client {
  client ??= new S3Client({
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
    // Neon Object Storage rejects presigned PUTs that embed a checksum computed
    // from an empty body, which is the AWS SDK default since v3.729.
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });
  return client;
}

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const name = (error as { name?: string }).name;
  const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
  return name === 'NotFound' || name === 'NoSuchKey' || status === 404;
}

export class S3AvatarStorage implements AvatarStorage {
  constructor(private readonly bucket: string = env.S3_AVATAR_BUCKET) {}

  async createUploadUrl(input: {
    key: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string> {
    return getSignedUrl(
      getClient(),
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        ContentType: input.contentType,
      }),
      { expiresIn: input.expiresInSeconds },
    );
  }

  async head(key: string): Promise<AvatarObject | null> {
    try {
      const result = await getClient().send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        contentType: result.ContentType ?? null,
        contentLength: result.ContentLength ?? 0,
      };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await getClient().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    return `${this.bucketBaseUrl()}/${key}`;
  }

  keyFromPublicUrl(url: string): string | null {
    const prefix = `${this.bucketBaseUrl()}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  private bucketBaseUrl(): string {
    return `${env.AWS_ENDPOINT_URL_S3.replace(/\/+$/, '')}/${this.bucket}`;
  }
}
