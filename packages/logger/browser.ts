
import { cfg, configureLogger } from './core';

(function boot() {
  if (typeof window === 'undefined') return;
  if ((window as any).__medx_logger_boot) return;
  (window as any).__medx_logger_boot = true;
  if (!cfg.isProd)
    console.info('%c🔍 MedXpense logger v2 loaded – logger.help() for commands', 'color:#0EA5E9;font-weight:bold;background:#EFF6FF;padding:2px 5px;border-radius:3px');
  applyConsoleFilters();
  exposeControls();
})();

function applyConsoleFilters() {
  if (cfg.isProd || typeof window === 'undefined') return;
  if ((window as any).__consoleFiltered) return;
  (window as any).__consoleFiltered = true;
  const noisy = ['Removing unpermitted intrinsics', '[Fast Refresh]', 'turbopack-hmr'];
  const orig = { log: console.log, info: console.info, debug: console.debug } as any;
  ['log', 'info', 'debug'].forEach(k => {
    console[k] = (...args: any[]) => {
      const txt = args[0] ? String(args[0]) : '';
      if (noisy.some(p => txt.includes(p))) return; // drop early
      if (noisy.some(p => txt.includes(p)) && cfg.level > 0) return;
      orig[k](...args);
    };
  });
}

function exposeControls() {
  if (cfg.isProd || typeof window === 'undefined') return;
  if ((window as any).logger) return;
  const map = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };
  (window as any).logger = {
    setLevel(l: keyof typeof map) { configureLogger({ level: map[l] }); },
    enable(ctx: string) { cfg.enabledContexts.add(ctx); },
    disable(ctx: string) { cfg.enabledContexts.delete(ctx); },
    showOnly(...ctxs: string[]) { configureLogger({ enabledContexts: new Set(ctxs) }); },
    reset() { configureLogger(cfg); },
    help() {
      console.info('%cLogger commands:', 'color:#0EA5E9;font-weight:bold');
      console.info('  logger.setLevel(\"info\")');
      console.info('  logger.enable(\"API\")');
      console.info('  logger.showOnly(\"AUTH\",\"API\")');
      console.info('  logger.reset()');
    }
  };
}
