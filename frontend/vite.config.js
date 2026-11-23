import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server runs on 5173, which is the origin the FastAPI CORS config allows.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
