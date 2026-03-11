import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        taskpane: 'taskpane.html',
      }
    }
  },
  server: {
    port: 3000,
    https: true,
  }
})