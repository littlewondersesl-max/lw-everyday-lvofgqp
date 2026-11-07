import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    hmr: { path: '/vite-hmr' },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
