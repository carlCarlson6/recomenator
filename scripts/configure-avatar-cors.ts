import 'dotenv/config';

import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
} from '@aws-sdk/client-s3';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const endpoint = requireEnv('AWS_ENDPOINT_URL_S3');
const bucket = requireEnv('S3_AVATAR_BUCKET');

const origins = (process.env.AVATAR_CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (origins.length === 0) {
  console.error('AVATAR_CORS_ORIGINS must contain at least one origin');
  process.exit(1);
}

const client = new S3Client({
  region: requireEnv('AWS_REGION'),
  endpoint,
  credentials: {
    accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
  },
  forcePathStyle: true,
});

// Replaces the bucket's CORS rules with the browser upload/read rule the app
// needs. Origins come from AVATAR_CORS_ORIGINS (comma separated).
await client.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['Content-Type'],
          AllowedMethods: ['GET', 'PUT'],
          AllowedOrigins: origins,
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

console.log(`CORS configured for bucket "${bucket}"`);
console.log(`Allowed origins: ${origins.join(', ')}`);

try {
  const current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log(JSON.stringify(current.CORSRules, null, 2));
} catch {
  console.log('(Could not read the CORS rules back, but the update succeeded.)');
}
