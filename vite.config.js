/// <reference types="vitest" />
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  worker: {
    format: 'es'
  },
   plugins: [
     solidPlugin(),
    VitePWA({
      disable: true, // Disabled during development
      registerType: 'autoUpdate',
      // includeAssets: ['avatar.png'],
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
        icons: [
          // Icons can be added here when needed
        ]
      },
       workbox: {
         globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
         runtimeCaching: [
           {
             urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif)$/,
             handler: 'CacheFirst',
             options: {
               cacheName: 'images-cache',
               expiration: {
                 maxEntries: 50,
                 maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
               },
             },
           },
           {
             urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
             handler: 'StaleWhileRevalidate',
             options: {
               cacheName: 'assets-cache',
               expiration: {
                 maxEntries: 100,
                 maxAgeSeconds: 24 * 60 * 60, // 24 hours
               },
             },
           },
           {
             urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
             handler: 'NetworkOnly', // Don't cache API calls
             options: {
               cacheName: 'api-cache',
             },
           },
           {
             urlPattern: ({ request, url }) => request.destination === 'document' && !url.pathname.startsWith('/api/'),
             handler: 'NetworkFirst', // For pages, try network first, fall back to cache
             options: {
               cacheName: 'pages-cache',
               expiration: {
                 maxEntries: 10,
                 maxAgeSeconds: 24 * 60 * 60, // 24 hours
               },
             },
           }
         ]
       },
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
   optimizeDeps: {
     exclude: ['@electric-sql/pglite'],
     include: ['@electric-sql/pglite/dist/*.js', '@electric-sql/pglite/dist/*.wasm']
   },
   test: {
     globals: true,
     environment: 'jsdom',
     setupFiles: ['./src/test/setup.ts'],
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