import { defineConfig } from 'vite';
const apiTarget = process.env.YEARBOOK_API_URL || 'http://127.0.0.1:3001';
export default defineConfig({
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': { target: apiTarget, changeOrigin: false }, '/uploads': { target: apiTarget, changeOrigin: false } } },
  build: { target: 'es2022', rollupOptions: { output: { manualChunks: { three: ['three'], animation: ['gsap'] } } } }
});
