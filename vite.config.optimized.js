import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Feature chunks
          'dashboard': [
            './src/pages/dashboard/Dashboard.jsx',
            './src/pages/dashboard/Admin.jsx',
            './src/pages/dashboard/AdminEnhanced.jsx'
          ],
          'cat-workspace': [
            './src/pages/dashboard/CATProjectView.jsx'
          ],
          'job-management': [
            './src/pages/dashboard/JobManagement.jsx',
            './src/pages/dashboard/CreateJob.jsx'
          ],
          'profile': [
            './src/pages/dashboard/TranslatorProfile.jsx',
            './src/pages/dashboard/MyProfile.jsx'
          ],
          'services': [
            './src/services/segmentationEngine.js',
            './src/services/browserFileParser.js',
            './src/services/simpleUploadManager.js'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  }
})
