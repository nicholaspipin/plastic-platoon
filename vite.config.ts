import { defineConfig, type Plugin } from 'vite';

/**
 * Pixi v8 loads its environment/renderer chunks via runtime dynamic imports,
 * which costs 2 serial round-trips on a cold cellular load. Preload every
 * chunk we will actually use (skip the WebGPU/Canvas fallback renderers and
 * worker bundle) so the browser fetches them alongside the entry.
 */
function preloadDynamicChunks(): Plugin {
  return {
    name: 'preload-dynamic-chunks',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const skip = /WebGPU|CanvasRenderer|webworkerAll/;
        const links = Object.values(ctx.bundle)
          .filter((c) => c.type === 'chunk' && !c.isEntry && !skip.test(c.fileName))
          .map((c) => `    <link rel="modulepreload" crossorigin href="${c.fileName}" />`)
          .join('\n');
        return html.replace('</head>', `${links}\n  </head>`);
      },
    },
  };
}

export default defineConfig({
  base: '/plastic-platoon/',
  plugins: [preloadDynamicChunks()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 8192,
  },
});
