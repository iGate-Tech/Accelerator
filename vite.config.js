/// <reference types="vitest" />
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';

// Plugin to set proper headers for WASM files required by PGLite
const wasmHeadersPlugin = {
  name: 'wasm-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url.endsWith('.wasm')) {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      }
      next();
    });
  }
};

export default defineConfig({
  resolve: {
    alias: {
      '@src': '/src',
      '@lib': '/src/lib',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@assets': '/src/assets',
      '@context': '/src/context',
      '@hooks': '/src/hooks',
      '@stores': '/src/stores',
    },
  },
  define: {
    global: 'globalThis',
    process: { env: {}, browser: true }
  },
  worker: {
    format: 'es'
  },
  plugins: [
    solidPlugin(),
    VitePWA({
      disable: true,
      registerType: 'autoUpdate',
      manifest: {
        name: 'Accelerator AI',
        short_name: 'Accelerator',
        description: 'AI-powered startup accelerator tool',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#9E28B5',
        orientation: 'portrait-primary',
        categories: ['productivity', 'business'],
        lang: 'en-US',
        dir: 'ltr',
        icons: []
      },
      devOptions: { enabled: false }
    })
  ],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite']
  },
  build: {
    target: 'esnext',
    commonjsOptions: { transformMixedEsModules: true }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    proxy: {
      '/api': process.env.NODE_ENV === 'production' ? false : {
        target: process.env.DOCKER_ENV === 'true' ? 'http://backend:3000' : 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
