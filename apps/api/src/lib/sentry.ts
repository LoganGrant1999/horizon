import * as Sentry from '@sentry/node';
import { config } from '../config';

export function initSentry() {
  const SENTRY_DSN = process.env.SENTRY_DSN;

  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: config.nodeEnv,
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (config.nodeEnv === 'development' && !process.env.SENTRY_DEV_ENABLED) {
        return null;
      }
      return event;
    },
  });
}

export { Sentry };