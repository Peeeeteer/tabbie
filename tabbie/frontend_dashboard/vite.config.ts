import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
 
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['class-variance-authority'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Fallback for when API server isn't running
          proxy.on('error', (err, req, res) => {
            console.log('API server not available, using mock responses');
            if (req.url?.includes('/api/setup/upload')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Mock upload success' }));
            } else if (req.url?.includes('/api/setup/discover')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ip: '192.168.2.93' })); // Mock discovered IP
            }
          });
        }
      }
    }
  },
})