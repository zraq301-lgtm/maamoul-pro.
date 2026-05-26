import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  // استخدام ./ يضمن أن التطبيق يبحث عن ملفاته في المسار الحالي داخل الـ WebView
  base: './', 
  
  plugins: [
    react(),
    tailwindcss(),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    outDir: 'dist',
    emptyOutDir: true, // يضمن مسح المجلد قبل كل بناء جديد
    rollupOptions: {
      output: {
        // منع التخزين المؤقت للملفات (Cache Busting)
        // هذا يضمن أن المتصفح/التطبيق سيحمل التعديلات الجديدة دائماً
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
