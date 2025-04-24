// src/lib/logger.ts - Unified implementation with enhancements

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Log contexts for different parts of the application
export enum LogContext {
  AUTH = 'AUTH',
  API = 'API',
  ROUTER = 'ROUTER',
  RENDER = 'RENDER',
  DATA = 'DATA',
}

// Configuration interface
interface LoggerConfig {
  level: LogLevel;
  enabledContexts: Set<LogContext | string>;
  redactedFields: Set<string>;
  isProduction: boolean;
  groupLogs: boolean;
  maxObjectDepth: number;
  maxArrayLength: number;
  deduplicate: boolean;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enabledContexts: new Set(Object.values(LogContext)),
  redactedFields: new Set(['password', 'token', 'secret', 'key', 'jwt', 'auth', 'authorization']),
  isProduction: process.env.NODE_ENV === 'production',
  groupLogs: process.env.NODE_ENV !== 'production',
  maxObjectDepth: process.env.NODE_ENV === 'production' ? 2 : 5,
  maxArrayLength: process.env.NODE_ENV === 'production' ? 10 : 50,
  deduplicate: process.env.NODE_ENV !== 'production',
};

// Maintain current config
let config: LoggerConfig = { ...defaultConfig };

// For runtime access (in dev tools)
if (typeof window !== 'undefined') {
  (window as any).__loggerConfig = config;
}

// Configure the logger
export function configureLogger(options: Partial<LoggerConfig> = {}): void {
  config = {
    ...config,
    ...options,
  };
  
  // Update window reference
  if (typeof window !== 'undefined') {
    (window as any).__loggerConfig = config;
  }
}

/**
 * Initialize the logger and apply enhancements
 */
export function initializeLogger() {
  // Only initialize once
  if (typeof window !== 'undefined' && !(window as any).__loggerInitialized) {
    // Track initialization
    (window as any).__loggerInitialized = true;
    
    // Apply console filters and enhancements
    if (!config.isProduction) {
      applyLogFilters();
      setupLoggerControls();
      
      // Log the initialization message
      console.info(
        '%c🔍 MedXpense Logger Initialized',
        'color: #0EA5E9; font-weight: bold; background: #EFF6FF; padding: 3px 6px; border-radius: 3px;'
      );
      console.info(
        '%cType logger.help() in console for commands',
        'color: #6B7280; font-style: italic;'
      );
    }
  }
}

// Function to redact sensitive fields from objects
function redactSensitiveData(data: any, depth = 0): any {
  if (!data) return data;
  if (depth > config.maxObjectDepth) return '[Max Depth Exceeded]';
  
  if (typeof data === 'object' && data !== null) {
    const result = Array.isArray(data) 
      ? data.slice(0, config.maxArrayLength).map(item => redactSensitiveData(item, depth + 1)) 
      : { ...data };
    
    if (Array.isArray(data) && data.length > config.maxArrayLength) {
      (result as any).push(`[${data.length - config.maxArrayLength} more items...]`);
      return result;
    } else if (Array.isArray(result)) {
      return result;
    }
    
    for (const key in result) {
      if (config.redactedFields.has(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = redactSensitiveData(result[key], depth + 1);
      }
    }
    
    return result;
  }
  
  return data;
}

// Deduplication tracking
const recentMessages = new Map<string, { count: number, lastTime: number, timer?: any }>();
const DEDUPLICATION_WINDOW_MS = 2000; // 2 seconds window
const CLEANUP_INTERVAL_MS = 30000; // 30 seconds cleanup

// Cleanup for deduplication tracking
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of recentMessages.entries()) {
      if (now - data.lastTime > DEDUPLICATION_WINDOW_MS) {
        if (data.timer) clearTimeout(data.timer);
        recentMessages.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

// Main logger factory function
function createLogger(context: LogContext | string) {
  const isContextEnabled = () => config.enabledContexts.has(context);
  
  // Format messages with context
  const formatMessage = (message: string): string => {
    return `[${context}] ${message}`;
  };
  
  // Format and clean data for logging
  const formatData = (data: any): any => {
    if (data === undefined) return '';
    
    // Redact sensitive information
    const sanitizedData = redactSensitiveData(data);
    
    // In production, limit the size/depth of objects
    if (config.isProduction) {
      if (typeof sanitizedData === 'object' && sanitizedData !== null) {
        try {
          const jsonStr = JSON.stringify(sanitizedData);
          return jsonStr.length > 200 
            ? `${jsonStr.slice(0, 200)}... (truncated)` 
            : sanitizedData;
        } catch (e) {
          return '[Complex Object]';
        }
      }
    }
    
    return sanitizedData;
  };
  
  // Check for duplicate messages to reduce noise
  const isDuplicate = (message: string, data: any): boolean => {
    if (!config.deduplicate) return false;
    
    try {
      const key = `${message}|${JSON.stringify(data || '')}`;
      const now = Date.now();
      const existingData = recentMessages.get(key);
      
      if (existingData && now - existingData.lastTime < DEDUPLICATION_WINDOW_MS) {
        // Update count and timestamp
        existingData.count++;
        existingData.lastTime = now;
        
        // Clear existing timer
        if (existingData.timer) {
          clearTimeout(existingData.timer);
        }
        
        // Set a new timer to report count if no more duplicates come in
        existingData.timer = setTimeout(() => {
          if (existingData.count > 1) {
            console.info(`${formatMessage(message)} (repeated ${existingData.count} times)`);
          }
          recentMessages.delete(key);
        }, DEDUPLICATION_WINDOW_MS);
        
        recentMessages.set(key, existingData);
        return true;
      }
      
      // New or expired message
      const timer = setTimeout(() => {
        recentMessages.delete(key);
      }, DEDUPLICATION_WINDOW_MS);
      
      recentMessages.set(key, { count: 1, lastTime: now, timer });
      return false;
    } catch {
      // If we fail to process, don't deduplicate
      return false;
    }
  };
  
  // Return the logger instance
  return {
    debug: (message: string, data?: any): void => {
      if (config.level <= LogLevel.DEBUG && isContextEnabled()) {
        if (isDuplicate(message, data)) return;
        console.debug(formatMessage(message), formatData(data));
      }
    },
    
    info: (message: string, data?: any): void => {
      if (config.level <= LogLevel.INFO && isContextEnabled()) {
        if (isDuplicate(message, data)) return;
        console.info(formatMessage(message), formatData(data));
      }
    },
    
    warn: (message: string, data?: any): void => {
      if (config.level <= LogLevel.WARN && isContextEnabled()) {
        // Don't deduplicate warnings - they're important
        console.warn(formatMessage(message), formatData(data));
      }
    },
    
    error: (message: string, error?: any): void => {
      if (config.level <= LogLevel.ERROR && isContextEnabled()) {
        // Never deduplicate errors
        console.error(formatMessage(message), error || '');
      }
    },
    
    // Grouped logs for related operations
    group: (
      title: string, 
      logFn: () => void, 
      options: { collapsed?: boolean } = { collapsed: true }
    ): void => {
      if (!isContextEnabled()) return;
      
      if (config.groupLogs) {
        const groupFn = options.collapsed ? console.groupCollapsed : console.group;
        groupFn(formatMessage(title));
        try {
          logFn();
        } finally {
          console.groupEnd();
        }
      } else {
        // If groups are disabled, just log the title and run the function
        console.info(formatMessage(`▼ ${title}`));
        logFn();
        console.info(formatMessage(`▲ End ${title}`));
      }
    },
    
    // Log beginning and end of an async operation with timing
    async time<T>(
      label: string,
      fn: () => Promise<T>,
      logLevel: LogLevel = LogLevel.DEBUG
    ): Promise<T> {
      const shouldLog = config.level <= logLevel && isContextEnabled();
      
      if (!shouldLog) return fn();
      
      const startTime = performance.now();
      try {
        console.info(formatMessage(`⏱️ Starting: ${label}`));
        const result = await fn();
        const duration = Math.round(performance.now() - startTime);
        console.info(formatMessage(`✅ Completed: ${label} (${duration}ms)`));
        return result;
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        console.error(formatMessage(`❌ Failed: ${label} (${duration}ms)`), err);
        throw err;
      }
    }
  };
}

// Export a function to get loggers for different contexts
export function getLogger(context: LogContext | string) {
  return createLogger(context);
}

// Export configured loggers for common contexts
export const authLogger = createLogger(LogContext.AUTH);
export const apiLogger = createLogger(LogContext.API);
export const routerLogger = createLogger(LogContext.ROUTER);
export const renderLogger = createLogger(LogContext.RENDER);
export const dataLogger = createLogger(LogContext.DATA);

/**
 * Applies filters to prevent certain noisy logs
 */
function applyLogFilters() {
  // Skip if not in browser or if already applied
  if (typeof window === 'undefined' || (window as any).__logFiltersApplied) {
    return;
  }
  
  (window as any).__logFiltersApplied = true;
  
  // Save original console methods
  const originalConsole = {
    debug: console.debug,
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };
  
  // List of patterns to ignore
  const ignorePatterns = [
    'Removing unpermitted intrinsics',
    '[Fast Refresh] done',
    '[Fast Refresh] rebuilding',
    'turbopack-hmr'
  ];
  
  // Recent logs for duplicate detection
  const recentFilteredLogs = new Set<string>();
  const maxRecentLogs = 200;
  
  // Clear recent filtered logs periodically
  setInterval(() => recentFilteredLogs.clear(), 5000);
  
  // Helper to check if a log should be filtered
  function shouldFilter(args: any[]): boolean {
    if (args.length === 0) return false;
    
    // Check against ignore patterns
    const firstArg = String(args[0]);
    for (const pattern of ignorePatterns) {
      if (firstArg.includes(pattern)) {
        return true;
      }
    }
    
    // Check for duplicates of noisy logs
    if (
      firstArg.includes('[API]') && 
      (firstArg.includes('Request prepared') || 
       firstArg.includes('Processing API') ||
       firstArg.includes('Using direct'))
    ) {
      // Create a simplified key for this log
      const logKey = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg).substring(0, 100);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join('|').substring(0, 200);
      
      if (recentFilteredLogs.has(logKey)) {
        return true;
      }
      
      // Add to recent logs
      recentFilteredLogs.add(logKey);
      if (recentFilteredLogs.size > maxRecentLogs) {
        // Remove oldest entry (first item in the set)
        recentFilteredLogs.delete(recentFilteredLogs.values().next().value);
      }
    }
    
    return false;
  }
  
  // Override console methods to filter out noisy logs
  console.debug = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.debug.apply(console, args);
    }
  };
  
  console.log = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.log.apply(console, args);
    }
  };
  
  console.info = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.info.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.warn.apply(console, args);
    }
  };
  
  // Don't filter error logs
  // console.error = function(...args) {
  //   originalConsole.error.apply(console, args);
  // };
}

/**
 * Setup logger controls for development
 */
function setupLoggerControls() {
  // Skip if not in browser, already setup, or in production
  if (
    typeof window === 'undefined' || 
    (window as any).__loggerControlsSetup || 
    config.isProduction
  ) {
    return;
  }
  
  (window as any).__loggerControlsSetup = true;
  
  // Create mapping from string level names to enum values
  const logLevelMap = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
    none: LogLevel.NONE
  };
  
  // Create the logger global object for console commands
  (window as any).logger = {
    // Set log level by name
    setLevel: (level: 'debug' | 'info' | 'warn' | 'error' | 'none') => {
      if (logLevelMap[level] !== undefined) {
        configureLogger({ level: logLevelMap[level] });
        console.info(`%cLog level set to: ${level.toUpperCase()}`, 'color: #0EA5E9; font-weight: bold;');
      } else {
        console.error(`Invalid log level: ${level}. Use debug, info, warn, error, or none.`);
      }
    },
    
    // Enable specific context
    enableContext: (context: string) => {
      const currentConfig = (window as any).__loggerConfig || { enabledContexts: new Set() };
      currentConfig.enabledContexts.add(context);
      configureLogger({ enabledContexts: currentConfig.enabledContexts });
      console.info(`%cEnabled logging for context: ${context}`, 'color: #10B981; font-weight: bold;');
    },
    
    // Disable specific context
    disableContext: (context: string) => {
      const currentConfig = (window as any).__loggerConfig || { enabledContexts: new Set() };
      currentConfig.enabledContexts.delete(context);
      configureLogger({ enabledContexts: currentConfig.enabledContexts });
      console.info(`%cDisabled logging for context: ${context}`, 'color: #10B981; font-weight: bold;');
    },
    
    // Show only specific contexts
    showOnly: (...contexts: string[]) => {
      configureLogger({ enabledContexts: new Set(contexts) });
      console.info(`%cShowing only these contexts: ${contexts.join(', ')}`, 'color: #10B981; font-weight: bold;');
    },
    
    // Reset to default configuration
    reset: () => {
      configureLogger({
        level: LogLevel.DEBUG,
        enabledContexts: new Set(Object.values(LogContext)),
        deduplicate: true,
        groupLogs: true
      });
      console.info('%cLogger reset to default configuration', 'color: #10B981; font-weight: bold;');
    },
    
    // Toggle deduplication
    toggleDedupe: (enabled: boolean) => {
      configureLogger({ deduplicate: enabled });
      console.info(`%cLog deduplication: ${enabled ? 'ON' : 'OFF'}`, 'color: #10B981; font-weight: bold;');
    },
    
    // Help command
    help: () => {
      console.group('%c📋 MedXpense Logger Commands', 'color: #0EA5E9; font-weight: bold;');
      console.info('%cAvailable commands:', 'font-weight: bold;');
      console.info('  %clogger.setLevel(level)%c - Set log level (debug, info, warn, error, none)', 'color: #6366F1; font-family: monospace;', '');
      console.info('  %clogger.enableContext(context)%c - Enable logging for a specific context', 'color: #6366F1; font-family: monospace;', '');
      console.info('  %clogger.disableContext(context)%c - Disable logging for a specific context', 'color: #6366F1; font-family: monospace;', '');
      console.info('  %clogger.showOnly(...contexts)%c - Show only specific contexts', 'color: #6366F1; font-family: monospace;', '');
      console.info('  %clogger.reset()%c - Reset to default configuration', 'color: #6366F1; font-family: monospace;', '');
      console.info('  %clogger.toggleDedupe(enabled)%c - Turn duplicate suppression on/off', 'color: #6366F1; font-family: monospace;', '');
      console.info('  %clogger.help()%c - Show this help message', 'color: #6366F1; font-family: monospace;', '');
      
      console.info('\n%cExamples:', 'font-weight: bold;');
      console.info('  %clogger.setLevel("info")%c - Show only info logs and above', 'color: #6366F1; font-family: monospace;', '');
      console.info('  %clogger.showOnly("AUTH", "API")%c - Show only AUTH and API logs', 'color: #6366F1; font-family: monospace;', '');
      
      console.info('\n%cStandard Contexts:', 'font-weight: bold;');
      console.info(`  ${Object.values(LogContext).join(', ')}`);
      console.groupEnd();
    }
  };
}
