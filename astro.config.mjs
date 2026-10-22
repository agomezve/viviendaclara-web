// @ts-check
// Ruta: astro.config.mjs
import { defineConfig } from 'astro/config';

// Tailwind CSS 4 se integra como plugin de Vite. La antigua integración
// @astrojs/tailwind solo es compatible con Tailwind 3 y Astro <= 5.
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { existsSync, readFileSync } from 'node:fs';
import basePathLinks from './integrations/base-path-links.mjs';
import ogImages from './integrations/og-images.mjs';

// <lastmod> del sitemap: fecha de la última actualización de los datos oficiales
// (la escribe scripts/datos/actualizar_datos.py) en las páginas que se generan con ellos.
const FUENTES = './src/data/fuentes.json';
const fechaDatos = existsSync(FUENTES) ? JSON.parse(readFileSync(FUENTES, 'utf8')).actualizado : undefined;
/** @param {string} path */
const conDatos = (path) => path === '/' || /^\/(vivienda|provincia|precios|esfuerzo|donde-me-llega)(\/|$)/.test(path);

// https://astro.build/config
export default defineConfig({
  // ─── DOMINIO Y RUTA BASE ────────────────────────────────────────────────────
  // Subdominio propio servido por GitHub Pages (public/CNAME). Si cambias de dominio,
  // actualiza también public/CNAME y la línea "Sitemap:" de public/robots.txt.
  // Para volver a la URL de GitHub Pages: site 'https://agomezve.github.io' y base '/viviendaclara-web'.
  // El resto del código (canónicas, Open Graph, JSON-LD, sitemap y enlaces) se adapta solo.
  site: 'https://viviendaclara.aarongomezvera.es',
  base: '/',

  // Astro 7 usa por defecto 'jsx', que elimina el espacio de un salto de línea entre
  // texto y enlace ("en la<a>…"). `true` comprime el HTML sin perder espacios visibles.
  compressHTML: true,

  // Sin la barra de herramientas de desarrollo (para que las capturas salgan limpias).
  devToolbar: { enabled: false },

  // URL limpias sin barra final: /vivienda/madrid
  trailingSlash: 'never',
  build: {
    format: 'file',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404'),
      serialize(item) {
        return fechaDatos && conDatos(new URL(item.url).pathname) ? { ...item, lastmod: fechaDatos } : item;
      },
    }),
    // Imagen Open Graph 1200×630 de cada página (colores de la marca).
    ogImages({ accent: '#2dd4bf', glow: '#134e4a' }),
    basePathLinks(),
  ],
});
