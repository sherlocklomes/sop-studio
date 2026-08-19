import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/sop-studio/' : '/',
  server: {
    port: 5177,
    open: true,
  },
  preview: {
    port: 4177,
    open: true,
  },
  build: {
    target: 'es2022',
  },
});
