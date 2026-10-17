import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Forward /api calls to the small Express API so the Groq key never reaches the browser.
  server: { proxy: { '/api': 'http://localhost:8787' } },
})
