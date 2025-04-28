import { configureLogger } from './core';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const isServer = typeof window === 'undefined';
const isTestE2E = process.env.NODE_ENV === 'test-e2e';

export const pinoLogger = isServer
  ? (() => {
      const streams = isTestE2E
        ? [
            { stream: fs.createWriteStream(path.join('cypress', 'logs', 'backend.log'), { flags: 'a' }) },
            { stream: process.stdout },
          ]
        : [{ stream: process.stdout }];

      return pino(
        {
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        },
        pino.multistream(streams)
      );
    })()
  : pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });

export function loggingMiddleware(req, res, next) {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  configureLogger({ enabledContexts: new Set(['API']) });
  req.logger = pinoLogger.child({ reqId });
  next();
}
