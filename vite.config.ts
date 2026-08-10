import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function shortSha() {
  const fromEnv = process.env.GITHUB_SHA?.slice(0, 7);
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
}

export default defineConfig({
  base: './',
  define: {
    __BUILD_SHA__: JSON.stringify(shortSha())
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 8192,
    sourcemap: false
  }
});
