import { PinoLogger } from 'nestjs-pino';

const LOG_LEVELS = ['info', 'debug', 'warn', 'error'] as const;
export type AppLogLevel = (typeof LOG_LEVELS)[number];

export function loggerMethodFor(level: string, logger: PinoLogger) {
  return (message: string, ...args: unknown[]) => {
    if (level === 'warn') return logger.warn(message, ...args);
    if (level === 'debug' || level === 'verbose')
      return logger.debug(message, ...args);
    if (level === 'fatal' || level === 'error')
      return logger.error(message, ...args);
    return logger.info(message, ...args);
  };
}

export function isAppLogLevel(value: string): value is AppLogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value);
}

export function toAppLogLevel(level: string | undefined): AppLogLevel {
  if (level === 'verbose') return 'debug';
  if (level === 'fatal') return 'error';
  if (level === 'log') return 'info';
  if (!level || !isAppLogLevel(level)) return 'info';
  return level;
}
