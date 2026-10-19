import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import * as path from 'node:path';
import Pages from 'vite-plugin-pages';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), 
    Pages({
      dirs: [{ dir: 'src', baseRoute: '' }],
      extensions: ['tsx'],
      resolver: 'react',
      routeStyle: 'nuxt',
      importMode: 'async',
    })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),     // ahora "@/algo" → "src/algo"
    },
  },
  server: {
    // Puerto propio de Mi Despensa (el 5173 es del sistema de pago). Es el origen autorizado en Google Cloud y en el servidor.
    port: 5181,
    strictPort: true,
    watch: {
      // promo-output/ acumula grabaciones .webm del script scripts/promo/generate-promo.mjs
      // — algunos nombres de archivo ahí rompían el file watcher de Vite (chokidar lstat
      // UNKNOWN error), tumbando el server de dev por completo apenas arrancaba.
      ignored: ['**/promo-output/**'],
    },
  },
});
