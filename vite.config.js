import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/head-sniper/",

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "HEAD SNIPER",
        short_name: "HEAD SNIPER",
        description: "戸田競艇予想アプリ",
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        start_url: "/head-sniper/",
        scope: "/head-sniper/",

        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
      },
    }),
  ],
});