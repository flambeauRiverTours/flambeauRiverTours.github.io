import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    watch: {
      //the site never imports from the API at runtime, and Visual Studio's locked files there crash the watcher
      ignored: ["**/api/**"],
    },
  },
})
