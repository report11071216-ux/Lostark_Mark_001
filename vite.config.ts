import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      // 서비스워커가 캐싱할 파일 패턴
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],

      // PWA 앱 정보 (manifest)
      manifest: {
        name: "쁘밍 길드 홈페이지",
        short_name: "쁘밍",
        description: "로스트아크 쁘밍 길드 전용 홈페이지",
        theme_color: "#0a0e18",
        background_color: "#0a0e18",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "ko",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      // 서비스워커(오프라인 캐싱) 설정
      workbox: {
        // 캐싱 대상 파일 유형
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],

        // 페이지 이동 시 항상 index.html 반환 (SPA)
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api\//],

        // 런타임 캐싱 전략
        runtimeCaching: [
          {
            // Supabase API 요청 — 네트워크 우선, 실패 시 캐시 사용
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24시간
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 이미지 파일 — 캐시 우선
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
              },
            },
          },
          {
            // Google Fonts 등 외부 폰트
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1년
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      // 개발 환경에서도 PWA 동작 확인 가능하게 설정
      devOptions: {
        enabled: false, // 개발 중 true로 바꾸면 PWA 테스트 가능
        type: "module",
      },
    }),
  ],
});
