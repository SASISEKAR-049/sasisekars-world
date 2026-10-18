import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: './' makes every built URL relative, so the site works from a
// sub-folder (GitHub Pages) as well as from a domain root (Netlify, Vercel).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Three.js (~525 kB) is its own lazy chunk, loaded after the intro
  build: { target: 'es2020', chunkSizeWarningLimit: 600 }
});
