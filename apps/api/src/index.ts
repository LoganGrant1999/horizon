import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { initSentry, Sentry } from './lib/sentry';
import { config } from './config';
import { authRoutes } from './routes/auth';

// Initialize Sentry before anything else
initSentry();
// import { entryRoutes } from './routes/entries'; // No Entry table exists
import { healthRoutes } from './routes/health';
import { onboardingRoutes } from './routes/onboarding';
import { storageRoutes } from './routes/storage';
import { regionsRoutes } from './routes/regions';
import { symptomsRoutes } from './routes/symptoms';
import { conditionsRoutes } from './routes/conditions';
import { journalRoutes } from './routes/journal';
import { aiRoutes } from './routes/ai';
import { medicationsRoutes } from './routes/medications';
import { reportsRoutes } from './routes/reports';

const fastify = Fastify({
  logger: {
    transport:
      config.nodeEnv === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function start() {
  try {
    // Register security plugins
    await fastify.register(cors, {
      origin: config.nodeEnv === 'production'
        ? [/^https:\/\/.*\.yourdomain\.com$/, config.webUrl]
        : [/localhost/, /127\.0\.0\.1/],
      credentials: true,
    });

    await fastify.register(cookie);
    await fastify.register(multipart);

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    // await fastify.register(entryRoutes, { prefix: '/api/entries' }); // No Entry table exists
    await fastify.register(onboardingRoutes, { prefix: '/api/onboarding' });
    await fastify.register(storageRoutes, { prefix: '/api/storage' });
    await fastify.register(regionsRoutes, { prefix: '/api/regions' });
    await fastify.register(symptomsRoutes, { prefix: '/api/symptoms' });
    await fastify.register(conditionsRoutes, { prefix: '/api/conditions' });
    await fastify.register(journalRoutes, { prefix: '/api/journal' });
    await fastify.register(aiRoutes, { prefix: '/api/ai' });
    await fastify.register(medicationsRoutes, { prefix: '/api/medications' });
    await fastify.register(reportsRoutes, { prefix: '/api/reports' });

    // Error handler with Sentry
    fastify.setErrorHandler((error, request, reply) => {
      // Log to Sentry
      Sentry.captureException(error, {
        extra: {
          url: request.url,
          method: request.method,
          headers: request.headers,
        },
      });

      // Log to console
      fastify.log.error(error);

      // Send response
      reply.status(error.statusCode || 500).send({
        error: error.name || 'Internal Server Error',
        message: config.nodeEnv === 'production' ? 'An error occurred' : error.message,
      });
    });

    // Start server
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on http://0.0.0.0:${config.port}`);
  } catch (err) {
    Sentry.captureException(err);
    fastify.log.error(err);
    process.exit(1);
  }
}

start();