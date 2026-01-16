import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './dev',
  publicDir: '../public',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@gamebyte': path.resolve(__dirname, './src')
    }
  },

  server: {
    port: 8080,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },

  build: {
    outDir: '../dist-dev',
    sourcemap: true
  },

  optimizeDeps: {
    include: ['pixi.js', 'gsap']
  }
});
