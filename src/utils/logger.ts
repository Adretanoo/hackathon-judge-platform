/**
 * @file src/utils/logger.ts
 * @description Configures and exports the shared Pino logger instance.
 *              In development mode pretty-printing is enabled for readability.
 */

import pino, { type Logger } from 'pino';
import { env } from '../config';

/**
 * Creates a configured Pino logger instance.
 *
 * @returns {Logger} Pino logger.
 */
function createLogger(): Logger {
  const isDev = env.NODE_ENV === 'development';

  return pino({
    level: env.LOG_LEVEL,
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
    base: {
      env: env.NODE_ENV,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'body.password',
        'body.refreshToken',
      ],
      censor: '[REDACTED]',
    },
  });
}

/** Shared application logger */
export const logger: Logger = createLogger();
