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
      disable: process.env.NODE_ENV === 'development',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'avatar.png'],
      manifest: {
        name: 'Accelerator',
        short_name: 'Accel',
        description: 'AI-powered startup accelerator tool',
        theme_color: '#9E28B5',
        icons: [
          {
            src: 'avatar.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@electric-sql/pglite']
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});