import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' => chemins relatifs, fonctionne quel que soit le sous-dossier
// GitHub Pages (https://user.github.io/staffweb/) sans casser les assets.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    open: true,
  },
})
