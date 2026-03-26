import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // 👈 Restored your original SWC plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // ✅ Keeps the port fixed
    hmr: {
      overlay: false, // ✅ Fixes the WebSocket disconnect error
    },
  },
})