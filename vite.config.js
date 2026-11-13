import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the production build can be hosted from any sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
