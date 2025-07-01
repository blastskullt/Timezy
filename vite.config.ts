import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          utils: ['date-fns', 'lucide-react']
        }
      }
    },
    sourcemap: false, // Desabilitar sourcemaps em produção por segurança
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.logs em produção
        drop_debugger: true
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    headers: {
      // Headers de segurança para desenvolvimento
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  // Garantir que o diretório public seja copiado
  publicDir: 'public'
});