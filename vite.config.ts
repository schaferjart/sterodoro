import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: '0.0.0.0',
        port: 5178,
        allowedHosts: [
          'localhost',
          '127.0.0.1',
          '.ngrok-free.app',
          '.ngrok.io',
          '.ngrok.app'
        ],
        headers: {
          'Cross-Origin-Embedder-Policy': 'unsafe-none',
          'Cross-Origin-Opener-Policy': 'unsafe-none'
        }
      },
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: 'Sterodoro',
            short_name: 'Sterodoro',
            description: 'A productivity timer and tracker app.',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            orientation: 'portrait',
            background_color: '#18181b',
            theme_color: '#6366f1',
            categories: ['productivity', 'utilities'],
            lang: 'en',
            dir: 'ltr',
            icons: [
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'apple touch'
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'apple touch'
              }
            ],
            screenshots: [
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                form_factor: 'wide'
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                form_factor: 'narrow'
              }
            ],
            shortcuts: [
              {
                name: 'Start Timer',
                short_name: 'Timer',
                description: 'Start a new timer session',
                url: '/?action=timer',
                icons: [{ src: 'icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'View History',
                short_name: 'History',
                description: 'View your session history',
                url: '/?action=history',
                icons: [{ src: 'icon-192.png', sizes: '192x192' }]
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,png,svg,mp3}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/gpkxqsqqiemkvhcykcxw.supabase.co\//,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api',
                  expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
                },
              },
            ],
          },
          // Use our custom service worker
          srcDir: 'public',
          filename: 'sw.js',
        }),
      ],
    };
});
