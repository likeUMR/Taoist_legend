import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 使用相对路径，支持子目录部署
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 9999,
  }
});
