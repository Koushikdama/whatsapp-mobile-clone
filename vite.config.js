import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Output directory
      outDir: 'dist',

      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true
        }
      },

      // Code splitting configuration
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: {
            // React core
            'react-vendor': ['react', 'react-dom'],

            // React Router
            'router': ['react-router-dom'],

            // Icons
            'icons': ['lucide-react'],

            // Large dependencies
            'lottie': ['lottie-react'],
            'chess': ['chess.js']
          },

          // Chunk file naming
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 1000,

      // Source maps for production debugging (disable for smaller builds)
      sourcemap: false
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    }
  };
});
