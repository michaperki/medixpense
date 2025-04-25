
import { configureLogger } from './core';
import pino from 'pino';

const isServer = typeof window === 'undefined';

export const pinoLogger = isServer
  ? pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' }, pino.destination(1))
  : pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    });

export function loggingMiddleware(req, res, next) {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  configureLogger({ enabledContexts: new Set(['API']) });
  req.logger = pinoLogger.child({ reqId });
  next();
}

