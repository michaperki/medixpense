export enum LogLevel { DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3, NONE = 4 }

export enum LogContext {
  AUTH = 'AUTH',
  API = 'API',
  ROUTER = 'ROUTER',
  RENDER = 'RENDER',
  DATA = 'DATA'
}

export interface LoggerConfig {
  level: LogLevel;
  enabledContexts: Set<LogContext | string>;
  redactedFields: Set<string>;
  isProd: boolean;
  group: boolean;
  maxDepth: number;
  maxArray: number;
  dedupe: boolean;
  dedupeWindow: number;
}

export const defaultCfg: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enabledContexts: new Set(Object.values(LogContext)),
  redactedFields: new Set(['password', 'token', 'secret', 'jwt', 'authorization']),
  isProd: process.env.NODE_ENV === 'production',
  group: process.env.NODE_ENV !== 'production',
  maxDepth: process.env.NODE_ENV === 'production' ? 2 : 5,
  maxArray: process.env.NODE_ENV === 'production' ? 10 : 50,
  dedupe: process.env.NODE_ENV !== 'production',
  dedupeWindow: 500 // ms
};

let cfg: LoggerConfig = { ...defaultCfg };
export function configureLogger(partial: Partial<LoggerConfig>) {
  cfg = { ...cfg, ...partial };
  if (typeof window !== 'undefined') (window as any).__loggerCfg = cfg;
}
export { cfg };

// For tracking page transitions and separating logs
let currentPage = '';
export function setCurrentPage(page: string) {
  if (page !== currentPage) {
    if (currentPage && !cfg.isProd) {
      console.log('──────────────────────────────────────────────────────────');
    }
    currentPage = page;
  }
}

// Redaction utility to protect sensitive data
const redact = (v: any, depth = 0): any => {
  if (!v || typeof v !== 'object') return v;
  if (depth >= cfg.maxDepth) return '[Depth‑Limit]';

  const clone: any = Array.isArray(v)
    ? v.slice(0, cfg.maxArray).map(x => redact(x, depth + 1))
    : {};

  if (!Array.isArray(v)) {
    for (const k in v) {
      const val = v[k];
      clone[k] = cfg.redactedFields.has(k.toLowerCase()) ? '[REDACTED]' : redact(val, depth + 1);
    }
  }

  if (Array.isArray(v) && v.length > cfg.maxArray) {
    clone.push(`[+${v.length - cfg.maxArray}]`);
  }

  return clone;
};

// Improved deduplication mechanism
const seenMessages = new Map<string, { count: number, lastTime: number }>();

function shouldLog(key: string): boolean {
  if (!cfg.dedupe) return true;
  
  const now = Date.now();
  const existing = seenMessages.get(key);
  
  if (existing && (now - existing.lastTime) < cfg.dedupeWindow) {
    // Update count but don't log
    existing.count++;
    existing.lastTime = now;
    return false;
  }
  
  // New message or outside window
  seenMessages.set(key, { count: 1, lastTime: now });
  
  // Clean old entries periodically
  if (Math.random() < 0.05) {
    const cutoff = now - (cfg.dedupeWindow * 5);
    for (const [msgKey, data] of seenMessages.entries()) {
      if (data.lastTime < cutoff) {
        seenMessages.delete(msgKey);
      }
    }
  }
  
  return true;
}

// Helper to format byte sizes
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper for API request/response logging
export function formatApiLog(reqId: string, method: string, url: string, status?: number, 
                        timeMs?: number, size?: string | number): string {
  if (!status) {
    return `▶️ ${reqId} ${method} ${url}`;
  }
  
  let statusSymbol = '✅';
  if (status >= 400) statusSymbol = status >= 500 ? '❌' : '⚠️';
  
  const sizeStr = size ? 
    (typeof size === 'number' ? formatBytes(size) : size) : 
    '';
  
  return `${statusSymbol} ${reqId} →${status} ${timeMs}ms ${sizeStr}`;
}

// Request ID generator
let reqCounter = 0;
export function createReqId(prefix = 'R'): string {
  reqCounter = (reqCounter + 1) % 10000;
  return `${prefix}${reqCounter.toString().padStart(3, '0')}`;
}

// Main logger creation function
export function createLogger(ctx: LogContext | string) {
  const tag = `[${ctx}]`;
  const enabled = () => cfg.enabledContexts.has(ctx);
  const fmt = (m: string) => `${tag} ${m}`;

  let chainedFields: Record<string, any> = {};

  // Helper to clean up empty metadata objects
  function cleanMeta(meta?: object) {
    if (!meta || (typeof meta === 'object' && Object.keys(meta).length === 0)) {
      return undefined;
    }
    return meta;
  }

  const out = {
    debug(msg: string, data?: any) {
      if (cfg.level > LogLevel.DEBUG || !enabled()) return;
      const key = fmt(msg);
      if (!shouldLog(key)) return;
      
      const payload = data === undefined ? chainedFields : { ...chainedFields, ...redact(data) };
      const cleaned = cleanMeta(payload);
      cleaned ? console.debug(key, cleaned) : console.debug(key);
    },
    
    info(msg: string, data?: any) {
      if (cfg.level > LogLevel.INFO || !enabled()) return;
      const key = fmt(msg);
      if (!shouldLog(key)) return;
      
      const payload = data === undefined ? chainedFields : { ...chainedFields, ...redact(data) };
      const cleaned = cleanMeta(payload);
      cleaned ? console.info(key, cleaned) : console.info(key);
    },
    
    warn(msg: string, data?: any) {
      if (cfg.level > LogLevel.WARN || !enabled()) return;
      const key = fmt(msg);
      if (!shouldLog(key)) return;
      
      const payload = data === undefined ? chainedFields : { ...chainedFields, ...redact(data) };
      const cleaned = cleanMeta(payload);
      cleaned ? console.warn(key, cleaned) : console.warn(key);
    },
    
    error(msg: string, err?: any) {
      if (cfg.level > LogLevel.ERROR || !enabled()) return;
      const key = fmt(msg);
      
      const payload = err === undefined ? chainedFields : { ...chainedFields, ...redact(err) };
      const cleaned = cleanMeta(payload);
      cleaned ? console.error(key, cleaned) : console.error(key);
    },
    
    group(title: string, run: () => void, opts: { collapsed?: boolean } = { collapsed: true }) {
      if (!enabled()) return;
      if (cfg.group && typeof console.groupCollapsed === 'function') {
        const open = opts.collapsed ? console.groupCollapsed : console.group;
        open(fmt(title));
        try { run(); } finally { console.groupEnd(); }
      } else {
        out.info(`▼ ${title}`);
        run();
        out.info(`▲ End ${title}`);
      }
    },
    
    timer(label: string) {
      if (!enabled()) return { done() {}, fail() {} };
      const t0 = performance.now();
      
      // Only log start in debug mode
      if (cfg.level === LogLevel.DEBUG) {
        out.debug(`⏱️ ${label}`);
      }
      
      return {
        done(details?: any) {
          const ms = Math.round(performance.now() - t0);
          out.info(`✅ ${label} ${ms} ms`, details);
        },
        fail(err: any) {
          const ms = Math.round(performance.now() - t0);
          out.error(`❌ ${label} ${ms} ms`, err);
        }
      };
    },
    
    time<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
      const t = out.timer(label);
      return (async () => {
        try {
          const val = await fn();
          t.done();
          return val;
        } catch (err) {
          t.fail(err);
          throw err;
        }
      })();
    },
    
    with(fields: Record<string, any>) {
      chainedFields = { ...chainedFields, ...fields };
      return out;
    },
    
    clear() {
      chainedFields = {};
      return out;
    },
    
    // Boot log - special one-time log for component initialization
    boot(component: string, fields?: Record<string, any>) {
      if (cfg.level > LogLevel.INFO || !enabled()) return;
      out.info(`${component} ready`, fields);
    }
  };

  return out;
}

// Pre-configured loggers
export function getLogger(c: LogContext | string) { return createLogger(c); }

export const authLogger   = createLogger(LogContext.AUTH);
export const apiLogger    = createLogger(LogContext.API);
export const routerLogger = createLogger(LogContext.ROUTER);
export const renderLogger = createLogger(LogContext.RENDER);
export const dataLogger   = createLogger(LogContext.DATA);
