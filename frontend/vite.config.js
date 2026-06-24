import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Meetx',
        short_name: 'Meetx',
        description: 'Meetx Video Conferencing App',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'meetlogo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'meetlogo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    host: true,
    port: 3000,
    open: true,
    allowedHosts: ["polite-tires-hug.loca.lt"],
  },
});
