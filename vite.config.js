import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/CPD-Scheduler/',
  plugins: [react()],
  server: {
    port: 8080,
    host: true
  }
});
