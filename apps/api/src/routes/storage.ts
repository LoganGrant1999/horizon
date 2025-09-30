import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../lib/s3';
import { config } from '../config';
import { db } from '../db';

const presignedUrlSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
});

async function authenticate(request: any, reply: any) {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return reply.code(401).send({ error: 'Session expired' });
  }

  return session.user;
}

export const storageRoutes: FastifyPluginAsync = async (fastify) => {
  // Get presigned URL for uploading
  fastify.post('/presigned-url', async (request, reply) => {
    const user = await authenticate(request, reply);
    if (!user) return;

    const body = presignedUrlSchema.parse(request.body);

    // Generate unique key
    const timestamp = Date.now();
    const ext = body.filename.split('.').pop();
    const key = `uploads/${user.id}/${timestamp}.${ext}`;

    // Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      uploadUrl,
      key,
    };
  });
};