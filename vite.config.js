import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'generate-console-entry',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist');
        const indexPath = path.resolve(distDir, 'index.html');
        const consoleDir = path.resolve(distDir, 'console');
        if (fs.existsSync(indexPath)) {
          if (!fs.existsSync(consoleDir)) {
            fs.mkdirSync(consoleDir, { recursive: true });
          }
          fs.copyFileSync(indexPath, path.resolve(consoleDir, 'index.html'));
        }
      }
    }
  ],
  server: {
    host: true,
    port: 5173
  }
});

