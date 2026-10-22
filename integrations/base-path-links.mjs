// Ruta: integrations/base-path-links.mjs
// Cuando el sitio se publica bajo una subruta (p. ej. https://agomezve.github.io/finanzas-web/),
// Astro añade la base a sus propios recursos (/finanzas-web/_astro/…), pero no a los enlaces
// escritos a mano en componentes y artículos Markdown (href="/contacto").
// Esta integración reescribe, tras el build, los atributos href, src y action que empiezan
// por "/" para anteponer la base. Con un dominio propio (base "/") no hace nada.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

/** @returns {import('astro').AstroIntegration} */
export default function basePathLinks() {
  let base = '/';
  return {
    name: 'base-path-links',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.replace(/\/+$/, '');
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (!base) return;
        const root = fileURLToPath(dir);
        // Atributo="/ruta" que no sea "//dominio" ni empiece ya por la base.
        const pattern = new RegExp(`\\b(href|src|action)="\\/(?!\\/|${base.slice(1)}(?:\\/|"))`, 'g');
        let files = 0;
        for await (const file of htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const updated = html.replace(pattern, `$1="${base}/`);
          if (updated !== html) {
            await writeFile(file, updated);
            files++;
          }
        }
        logger.info(`Enlaces internos con la base "${base}" en ${files} archivos HTML.`);
      },
    },
  };
}
