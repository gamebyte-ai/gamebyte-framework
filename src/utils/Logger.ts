/**
 * Centralized tagged logging system for GameByte Framework.
 *
 * Provides leveled, tag-filtered logging controllable via `createGame({ debug: true })`.
 * All output is suppressed by default (enabled: false) so production builds stay silent.
 *
 * @module utils/Logger
 * @example
 * ```typescript
 * import { Logger } from 'gamebyte-framework';
 *
 * // Enable via createGame config
 * const game = await createGame({ debug: true, logLevel: 'debug' });
 *
 * // Direct usage
 * Logger.info('Renderer', 'Pixi.js v8 initialized');
 *
 * // Module-scoped logger (avoids repeating the tag)
 * const log = Logger.tag('Physics');
 * log.info('Matter.js world created');
 * log.warn('Body outside bounds');
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export interface LoggerConfig {
  /** Master switch — when false, all logging is suppressed. */
  enabled: boolean;
  /** Minimum level to output. Messages below this level are discarded. */
  level: LogLevel;
  /** Per-tag overrides. Set a tag to `false` to silence it even when enabled. */
  tags?: Record<string, boolean>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

let config: LoggerConfig = { enabled: false, level: 'info' };

function shouldLog(level: LogLevel, tag?: string): boolean {
  if (!config.enabled) return false;
  if (LOG_LEVELS[level] < LOG_LEVELS[config.level]) return false;
  if (tag && config.tags && config.tags[tag] === false) return false;
  return true;
}

export const Logger = {
  /**
   * Update logger configuration. Merges with existing config.
   */
  configure(options: Partial<LoggerConfig>): void {
    Object.assign(config, options);
  },

  /**
   * Check whether a message at the given level/tag would be logged.
   */
  isEnabled(level: LogLevel, tag?: string): boolean {
    return shouldLog(level, tag);
  },

  /**
   * Reset to default (disabled) state. Useful for tests.
   */
  reset(): void {
    config = { enabled: false, level: 'info' };
  },

  debug(tag: string, ...args: unknown[]): void {
    if (shouldLog('debug', tag)) console.debug(`[${tag}]`, ...args);
  },

  info(tag: string, ...args: unknown[]): void {
    if (shouldLog('info', tag)) console.log(`[${tag}]`, ...args);
  },

  warn(tag: string, ...args: unknown[]): void {
    if (shouldLog('warn', tag)) console.warn(`[${tag}]`, ...args);
  },

  error(tag: string, ...args: unknown[]): void {
    if (shouldLog('error', tag)) console.error(`[${tag}]`, ...args);
  },

  /**
   * Create a module-scoped logger that auto-prefixes the tag.
   *
   * @example
   * ```typescript
   * const log = Logger.tag('Audio');
   * log.info('Music started');  // → [Audio] Music started
   * ```
   */
  tag(tagName: string) {
    return {
      debug: (...args: unknown[]) => Logger.debug(tagName, ...args),
      info: (...args: unknown[]) => Logger.info(tagName, ...args),
      warn: (...args: unknown[]) => Logger.warn(tagName, ...args),
      error: (...args: unknown[]) => Logger.error(tagName, ...args),
    };
  },
};
