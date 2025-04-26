// ----------------------------
// core.ts – polished v2
// ----------------------------

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
}

export const defaultCfg: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enabledContexts: new Set(Object.values(LogContext)),
  redactedFields: new Set(['password', 'token', 'secret', 'jwt', 'authorization']),
  isProd: process.env.NODE_ENV === 'production',
  group: process.env.NODE_ENV !== 'production',
  maxDepth: process.env.NODE_ENV === 'production' ? 2 : 5,
  maxArray: process.env.NODE_ENV === 'production' ? 10 : 50,
  dedupe: process.env.NODE_ENV !== 'production'
};

let cfg: LoggerConfig = { ...defaultCfg };
export function configureLogger(partial: Partial<LoggerConfig>) {
  cfg = { ...cfg, ...partial };
  if (typeof window !== 'undefined') (window as any).__loggerCfg = cfg;
}
export { cfg };

const redact = (v: any, depth = 0): any => {
  if (!v || typeof v !== 'object') return v;
  if (depth >= cfg.maxDepth) return '[Depth‑Limit]';

  const clone: any = Array.isArray(v)
    ? v.slice(0, cfg.maxArray).map(x => redact(x, depth + 1))
    : {};

  for (const k in v) {
    const val = v[k];
    clone[k] = cfg.redactedFields.has(k.toLowerCase()) ? '[REDACTED]' : redact(val, depth + 1);
  }

  if (Array.isArray(v) && v.length > cfg.maxArray) {
    clone.push(`[+${v.length - cfg.maxArray}]`);
  }

  return clone;
};

const seen = new Map<string, { ts: number; n: number; log: () => void }>();
const DEDUPE_MS = 2000;

function printOnce(key: string, printer: () => void) {
  if (!cfg.dedupe) return printer();
  const now = Date.now();
  const rec = seen.get(key);
  if (rec && now - rec.ts < DEDUPE_MS) {
    rec.n += 1;
    rec.ts = now;
    return;
  }
  const wrapper = () => {
    const hit = seen.get(key);
    printer();
    if (hit && hit.n > 1) console.info(`${key} (x${hit.n})`);
  };
  seen.set(key, { ts: now, n: 1, log: wrapper });
  setTimeout(() => {
    const h = seen.get(key);
    if (h) {
      h.log();
      seen.delete(key);
    }
  }, DEDUPE_MS);
}

export function createLogger(ctx: LogContext | string) {
  const tag = `[${ctx}]`;
  const enabled = () => cfg.enabledContexts.has(ctx);
  const fmt = (m: string) => `${tag} ${m}`;

  let chainedFields: Record<string, any> = {};

  const out = {
    debug(msg: string, data?: any) {
      if (cfg.level > LogLevel.DEBUG || !enabled()) return;
      const key = fmt(msg);
      printOnce(key, () => {
        if (data && Object.keys(data).length > 0) {
          console.debug(key, { ...chainedFields, ...redact(data) });
        } else if (Object.keys(chainedFields).length > 0) {
          console.debug(key, chainedFields);
        } else {
          console.debug(key);
        }
      });
    },
    info(msg: string, data?: any) {
      if (cfg.level > LogLevel.INFO || !enabled()) return;
      const key = fmt(msg);
      printOnce(key, () => {
        if (data && Object.keys(data).length > 0) {
          console.info(key, { ...chainedFields, ...redact(data) });
        } else if (Object.keys(chainedFields).length > 0) {
          console.info(key, chainedFields);
        } else {
          console.info(key);
        }
      });
    },
    warn(msg: string, data?: any) {
      if (cfg.level > LogLevel.WARN || !enabled()) return;
      const payload = (data && Object.keys(data).length > 0)
        ? { ...chainedFields, ...redact(data) }
        : (Object.keys(chainedFields).length > 0 ? chainedFields : undefined);
      payload ? console.warn(fmt(msg), payload) : console.warn(fmt(msg));
    },
    error(msg: string, err?: any) {
      if (cfg.level > LogLevel.ERROR || !enabled()) return;
      const payload = (err && Object.keys(err).length > 0)
        ? { ...chainedFields, ...redact(err) }
        : (Object.keys(chainedFields).length > 0 ? chainedFields : undefined);
      payload ? console.error(fmt(msg), payload) : console.error(fmt(msg));
    },
    group(title: string, run: () => void, opts: { collapsed?: boolean } = { collapsed: true }) {
      if (!enabled()) return;
      if (cfg.group) {
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
      out.info(`⏱️ ${label} …`);
      return {
        done(details?: any) {
          out.info(`✅ ${label} ${Math.round(performance.now() - t0)} ms`, details);
        },
        fail(err: any) {
          out.error(`❌ ${label} ${Math.round(performance.now() - t0)} ms`, err);
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
    }
  };

  return out;
}

let reqCounter = 0;
export function createReqId(prefix = 'R'): string {
  reqCounter = (reqCounter + 1) % 10000;
  return `${prefix}${reqCounter.toString().padStart(3, '0')}`;
}

export function getLogger(c: LogContext | string) { return createLogger(c); }

export const authLogger   = createLogger(LogContext.AUTH);
export const apiLogger    = createLogger(LogContext.API);
export const routerLogger = createLogger(LogContext.ROUTER);
export const renderLogger = createLogger(LogContext.RENDER);
export const dataLogger   = createLogger(LogContext.DATA);
