import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react({
    babel: {
      plugins: ['@emotion'],
    },
  })],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env': {},
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
    devSourcemap: true,
  },
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'PDFDocsSetting',
      fileName: 'pdf-docs-setting',
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});