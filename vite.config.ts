import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' keeps asset paths relative, so the same build works on
// GitHub Pages (served from /repo-name/) and on any other host.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // The dictionaries in src/lib/words are meant to be big, and each one is
    // its own chunk that only downloads when that language is in use. Raised
    // so the build stops warning about something that is on purpose.
    chunkSizeWarningLimit: 800,
  },
})
