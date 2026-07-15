import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' rend le build relatif : fonctionne sur GitHub Pages quel que soit le nom du repo
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
