import { defineConfig } from 'vite';

export default defineConfig({
  base: '/plastic-platoon/',
  build: {
    target: 'es2022',
    assetsInlineLimit: 8192,
  },
});
