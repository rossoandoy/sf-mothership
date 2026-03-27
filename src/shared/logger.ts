// 共通ロガー — セッションID等の機密情報は絶対にログしない

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const PREFIX = '[SF-Mothership]';

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug(...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(PREFIX, ...args);
    }
  },
  info(...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(PREFIX, ...args);
    }
  },
  warn(...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(PREFIX, ...args);
    }
  },
  error(...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(PREFIX, ...args);
    }
  },
};
