import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env': {}, // fallback tránh lỗi "process is not defined"
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