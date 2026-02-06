/**
 * Application logger that suppresses output in production.
 *
 * Usage:
 *   import { logger } from 'src/utils/logger'
 *   logger.info('Hello', someData)   // only prints in DEV
 *   logger.error('Oops', err)        // always prints (errors are important)
 *   logger.warn('Hmm')               // only in DEV
 */

const isDev = import.meta.env.DEV

/* eslint-disable no-console */
export const logger = {
  /** Informational messages — suppressed in production */
  info: (...args: unknown[]): void => {
    if (isDev) console.log(...args)
  },

  /** Debug messages — suppressed in production */
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...args)
  },

  /** Warnings — suppressed in production */
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args)
  },

  /**
   * Errors — ALWAYS printed, even in production.
   * Errors indicate real failures that should be tracked.
   * In a future iteration, these could be sent to a monitoring service.
   */
  error: (...args: unknown[]): void => {
    console.error(...args)
  },

  /** Alias for info — suppressed in production */
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args)
  }
}
/* eslint-enable no-console */
