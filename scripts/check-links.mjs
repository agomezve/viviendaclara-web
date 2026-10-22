// Ruta: scripts/check-links.mjs
// Revisa el HTML generado en dist/ (ejecuta antes `npm run build`). Sin dependencias.
// Comprueba:
//   1. Enlaces internos rotos (href y src que apuntan a este sitio).
//   2. Enlaces de afiliado sin rel="sponsored": tp.media y tpo.li (Travelpayouts), emrldco,
//      los dominios de AFFILIATES en src/config/site.ts y cualquier enlace con data-afiliado.
//   3. Páginas sin <title>, meta description u og:image (y que la og:image exista en dist/).
//   4. Títulos de más de 60 caracteres y descripciones fuera de 120-155 (páginas indexables).
//   5. Imágenes sin atributo alt.
// Termina con código 1 si encuentra algún problema.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta primero: npm run build');
  process.exit(1);
}

const siteOrigin = (() => {
  const robots = readFileSync(join(ROOT, 'public', 'robots.txt'), 'utf8');
  return new URL(robots.match(/^Sitemap:\s*(\S+)/im)[1]).origin;
})();

// Dominios de afiliado: fijos + los que haya en las url de src/config/site.ts dentro de AFFILIATES.
const affiliateHosts = new Set(['tp.media', 'emrldco.com', 'tpo.li']);
const config = readFileSync(join(ROOT, 'src', 'config', 'site.ts'), 'utf8');
const affiliatesBlock = config.match(/export const AFFILIATES[\s\S]*?\n\}( as const)?;/)?.[0] ?? '';
for (const m of affiliatesBlock.matchAll(/url:\s*'(https?:\/\/[^']+)'/g)) affiliateHosts.add(new URL(m[1]).host);
const isAffiliateHost = (host) => [...affiliateHosts].some((h) => host === h || host.endsWith(`.${h}`));

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:=("([^"]*)"|'([^']*)'|([^\\s>]+)))?(?=[\\s/>])`, 'i'));
  if (!m) return undefined;
  return decode(m[2] ?? m[3] ?? m[4] ?? '');
};
const metaContent = (html, key) => {
  const tag = html.match(new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]*>`, 'i'))?.[0];
  return tag ? attr(tag, 'content') : undefined;
};
const length = (s) => [...s].length;

/** ¿Existe en dist/ el recurso de esta ruta? (/x → x.html, x/index.html o el archivo x) */
function exists(pathname) {
  let p = decodeURIComponent(pathname);
  if (p.endsWith('/')) p += 'index';
  const base = join(DIST, p);
  return [base, `${base}.html`, join(base, 'index.html')].some((f) => existsSync(f) && statSync(f).isFile());
}

const problems = [];
const add = (file, message) => problems.push(`${relative(DIST, file)}: ${message}`);
let pages = 0;

for (const file of walk(DIST)) {
  if (!file.endsWith('.html')) continue;
  const html = readFileSync(file, 'utf8');
  if (!/<head[\s>]/i.test(html)) continue; // p. ej. archivos de verificación de Google
  pages++;
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);

  // 3 y 4. Metadatos
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
  const description = metaContent(html, 'description')?.trim() ?? '';
  const ogImage = metaContent(html, 'og:image') ?? '';
  if (!title) add(file, 'sin <title>');
  if (!description) add(file, 'sin meta description');
  if (!ogImage) add(file, 'sin og:image');
  else if (ogImage.startsWith(siteOrigin) && !exists(new URL(ogImage).pathname))
    add(file, `og:image no existe en dist/: ${ogImage}`);
  if (!noindex) {
    if (title && length(title) > 60) add(file, `título de ${length(title)} caracteres (máx. 60): «${title}»`);
    if (description && (length(description) < 120 || length(description) > 155))
      add(file, `descripción de ${length(description)} caracteres (120-155): «${description}»`);
  }

  // 1 y 2. Enlaces
  for (const [tag] of html.matchAll(/<(?:a|link|img|script|source|form)\b[^>]*>/gi)) {
    const isAnchor = /^<a\b/i.test(tag);
    for (const name of ['href', 'src', 'action']) {
      const value = attr(tag, name);
      if (!value || /^(#|mailto:|tel:|javascript:|data:)/i.test(value)) continue;
      if (/^<link\b/i.test(tag) && /rel="(preconnect|dns-prefetch)"/i.test(tag)) continue;
      let url;
      try {
        url = new URL(value, `${siteOrigin}/`);
      } catch {
        add(file, `URL no válida: ${value}`);
        continue;
      }
      if (url.origin === siteOrigin) {
        if (!exists(url.pathname)) add(file, `enlace interno roto: ${value}`);
      } else if (isAnchor && name === 'href' && (isAffiliateHost(url.host) || attr(tag, 'data-afiliado') !== undefined)) {
        const rel = (attr(tag, 'rel') ?? '').toLowerCase().split(/\s+/);
        if (!rel.includes('sponsored')) add(file, `enlace de afiliado sin rel="sponsored": ${value}`);
      }
    }
  }

  // 5. Imágenes sin alt
  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    if (attr(tag, 'alt') === undefined) add(file, `imagen sin alt: ${attr(tag, 'src') ?? tag.slice(0, 80)}`);
  }
}

if (problems.length > 0) {
  console.error(`❌ ${problems.length} problemas en ${pages} páginas:\n`);
  for (const p of problems) console.error(`  • ${p}`);
  process.exit(1);
}
console.log(`✅ ${pages} páginas revisadas: sin enlaces rotos ni problemas de SEO.`);
