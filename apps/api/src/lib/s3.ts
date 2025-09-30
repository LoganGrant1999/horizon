import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../config';

export const s3Client = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  credentials: {
    accessKeyId: config.s3AccessKey,
    secretAccessKey: config.s3SecretKey,
  },
  forcePathStyle: true, // Required for MinIO
});