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
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: 'Sterodoro',
            short_name: 'Sterodoro',
            description: 'A productivity timer and tracker app.',
            start_url: '.',
            display: 'standalone',
            background_color: '#18181b',
            theme_color: '#6366f1',
            icons: [
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              },
            ],
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
