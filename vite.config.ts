import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' keeps asset paths relative, so the same build works on
// GitHub Pages (served from /repo-name/) and on any other host.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
