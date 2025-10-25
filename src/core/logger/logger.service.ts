type LogLevel = 'debug' | 'info' | 'log' | 'warn' | 'error' | 'none';

interface LoggerConfig {
  enabled?: boolean;
  level?: LogLevel;
  prefix?: string;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 1,
  info: 2,
  log: 2,
  warn: 3,
  error: 4,
  none: 5,
};

const LOG_KEY_SETTING = 'MFE_LOG_ENABLED';
const LOG_LEVEL_KEY_SETTING = 'MFE_LOG_LEVEL';

export class Logger {
  private enabled: boolean;
  private level: LogLevel;
  private prefix?: string;
  
  constructor(config?: Partial<LoggerConfig>) {
    const persistedEnabled = localStorage.getItem(LOG_KEY_SETTING);
    const persistedLevel = localStorage.getItem(LOG_LEVEL_KEY_SETTING);
    
    this.enabled =
      persistedEnabled !== null
        ? persistedEnabled === 'true'
        : config?.enabled ?? import.meta.env.VITE_APP_LOGGER_ENABLED === 'true';
    
    this.level =
      (persistedLevel as LogLevel) ??
      (config?.level ?? import.meta.env.VITE_APP_LOG_LEVEL ?? 'info');
    
    this.prefix = config?.prefix ?? '';
  }
  
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
  }
  
  private formatPrefix(level: LogLevel): string {
    const emoji: Record<LogLevel, string> = {
      debug: '🐛',
      info: 'ℹ️',
      log: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      none: '',
    };
    
    const modulePrefix = this.prefix ? `[${this.prefix}]` : '';
    return `${emoji[level]} ${modulePrefix} [${level.toUpperCase()}]`;
  }
  
  debug(...args: any[]) {
    if (this.shouldLog('debug')) console.debug(this.formatPrefix('debug'), ...args);
  }
  
  info(...args: any[]) {
    if (this.shouldLog('info')) console.info(this.formatPrefix('info'), ...args);
  }
  
  log(...args: any[]) {
    if (this.shouldLog('log')) console.log(this.formatPrefix('log'), ...args);
  }
  
  warn(...args: any[]) {
    if (this.shouldLog('warn')) console.warn(this.formatPrefix('warn'), ...args);
  }
  
  error(...args: any[]) {
    if (this.shouldLog('error')) console.error(this.formatPrefix('error'), ...args);
  }
  
  group(title: string, fn: () => void) {
    if (!this.enabled) return;
    console.group(title);
    fn();
    console.groupEnd();
  }
  
  // 🔧 dynamic config
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem(LOG_KEY_SETTING, String(enabled));
    console.info(`🔧 Logger is now ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
  
  toggle() {
    this.setEnabled(!this.enabled);
  }
  
  setLevel(level: LogLevel) {
    this.level = level;
    localStorage.setItem(LOG_LEVEL_KEY_SETTING, level);
    console.info(`🔧 Logger level set to '${level}'`);
  }
  
  getConfig() {
    return { enabled: this.enabled, level: this.level, prefix: this.prefix };
  }
  
  // 🔥 New static helper: per-module singleton
  private static instances: Map<string, Logger> = new Map();
  
  static getInstance(prefix = 'APP'): Logger {
    if (!this.instances.has(prefix)) {
      this.instances.set(prefix, new Logger({ prefix }));
    }
    return this.instances.get(prefix)!;
  }
}

// Default global logger
export const logger = Logger.getInstance('GLOBAL');
