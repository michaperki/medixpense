let collectedLogs: string[] = [];

Cypress.on('window:before:load', (win) => {
  const originalConsoleLog = win.console.log;
  win.console.log = (...args) => {
    const msg = args.join(' ');
    collectedLogs.push(msg);
    Cypress.task('log', msg);
    originalConsoleLog.apply(win.console, args);
  };
});

// After each test, dump logs
afterEach(function () {
  const testTitle = (this.currentTest?.fullTitle() || 'unknown').replace(/\s+/g, '_');
  if (collectedLogs.length > 0) {
    Cypress.task('saveLogs', {
      filename: `${testTitle}.log`,
      content: collectedLogs.join('\n'),
    });
    collectedLogs = [];
  }
});
