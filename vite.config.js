import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // هذا يضمن توافق المسارات عند البناء في GitHub Actions
    outDir: 'dist',
    emptyOutDir: true,
  }
})
