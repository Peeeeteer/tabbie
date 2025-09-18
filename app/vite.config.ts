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
    port: 3000,
    host: true, // Allow external connections
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // ESP32 will likely use port 8080
        changeOrigin: true,
        configure: (proxy, options) => {
          // Fallback for when ESP32 server isn't running
          proxy.on('error', (err, req, res) => {
            console.log('ESP32 server not available, using mock responses');
            if (req.url?.includes('/api/setup/upload')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Mock upload success' }));
            } else if (req.url?.includes('/api/setup/discover')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ip: '192.168.1.100' })); // Mock discovered ESP32 IP
            }
          });
        }
      }
    }
  },
})