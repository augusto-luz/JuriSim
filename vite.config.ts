import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Prevents the build from failing if the bundle size is large
    chunkSizeWarningLimit: 1600,
  }
});