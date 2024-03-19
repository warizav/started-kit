import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';
import vitePluginSass from 'vite-plugin-sass'; // Importa el plugin de Sass

export default defineConfig({
  plugins: [
    react(),
    vitePluginSass() // Agrega el plugin de Sass
  ],
  test: {
    exclude: [...configDefaults.exclude, '**/src/api/**', '**/main.tsx/**']
  },
  build: {
    outDir: path.join(__dirname, 'dist/src/client')
  }
});
