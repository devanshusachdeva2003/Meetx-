import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
