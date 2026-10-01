import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: '/invoiceflow/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'sw.js',
        ],
        manifest: {
          id: '/invoiceflow/',
          name: 'InvoiceFlow - Invoice & Ledger Manager',
          short_name: 'InvoiceFlow',
          description:
            'Mobile-responsive full-stack invoice generator with client management, PDF print export, invoice history, and monthly & yearly financial statements.',
          start_url: '/invoiceflow/',
          scope: '/invoiceflow/',
          display: 'standalone',
          orientation: 'portrait-primary',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          icons: [
            {
              src: '/invoiceflow/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/invoiceflow/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/invoiceflow/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/invoiceflow/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/(identitytoolkit|securetoken|firestore|firebaseinstallations|accounts)\.googleapis\.com\/.*/i,
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
