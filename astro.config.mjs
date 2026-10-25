import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dccircuitlabs.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  vite: {
    // O <model-viewer> (~1 MB, inclui three.js) só é baixado quando um visualizador 3D chega perto da tela.
    build: { chunkSizeWarningLimit: 1200 },
  },
});
