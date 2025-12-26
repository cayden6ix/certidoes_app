import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_DEV_PORT ?? '5173', 10),
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://certidoes-backend:3000',
        changeOrigin: true,
        rewrite: (reqPath) => reqPath,
      },
    },
  },
});
