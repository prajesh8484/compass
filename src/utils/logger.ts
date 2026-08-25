/**
 * Logger Utility
 * Provides centralized logging with environment-based level filtering.
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

const CURRENT_LEVEL = import.meta.env?.DEV ? LogLevel.DEBUG : LogLevel.INFO;

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LEVEL <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LEVEL <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LEVEL <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (CURRENT_LEVEL <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
};
