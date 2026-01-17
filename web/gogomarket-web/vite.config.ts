import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 600,
    // Use esbuild for minification (faster, included by default)
    minify: 'esbuild',
  },
})

