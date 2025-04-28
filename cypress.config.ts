import { defineConfig } from 'cypress';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Capture console logs
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
        saveLogs({ filename, content }: { filename: string; content: string }) {
          const logsDir = path.join('cypress', 'logs');
          if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
          }
          fs.writeFileSync(path.join(logsDir, filename), content);
          return null;
        },
      });
    },
  },
});
