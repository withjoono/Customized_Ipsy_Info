import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Dev 포트 3012 (생태계 포트 표준: Infocast 3012/4012)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3012,
    proxy: {
      '/api': {
        target: 'http://localhost:4012',
        changeOrigin: true,
      },
    },
  },
});
