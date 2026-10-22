// Ruta: scripts/indexnow.mjs
// Avisa a IndexNow (Bing, Yandex, Seznam…) de todas las URL del sitemap publicado.
// Uso: npm run indexnow   (no se ejecuta en los builds locales; en GitHub Actions, tras el deploy)
// - Clave: el archivo public/<clave>.txt cuyo contenido es la propia clave.
// - Sitemap: la línea "Sitemap:" de public/robots.txt.
// Si algo falla, solo muestra un aviso y termina sin error para no romper el despliegue.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = join(import.meta.dirname, '..', 'public');
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function warn(message) {
  console.warn(`⚠️  IndexNow: ${message}`);
  process.exit(0);
}

const key = readdirSync(PUBLIC)
  .filter((f) => /^[a-f0-9]{32}\.txt$/.test(f))
  .map((f) => f.slice(0, -4))
  .find((k) => readFileSync(join(PUBLIC, `${k}.txt`), 'utf8').trim() === k);
if (!key) warn('no encuentro public/<clave>.txt.');

const sitemapUrl = readFileSync(join(PUBLIC, 'robots.txt'), 'utf8').match(/^Sitemap:\s*(\S+)/im)?.[1];
if (!sitemapUrl) warn('no encuentro la línea "Sitemap:" en public/robots.txt.');
const { origin, host } = new URL(sitemapUrl);

async function locs(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

try {
  // sitemap-index.xml → sitemap-0.xml… → URL de las páginas
  const urls = [];
  for (const loc of await locs(sitemapUrl)) {
    if (loc.endsWith('.xml')) urls.push(...(await locs(loc)));
    else urls.push(loc);
  }
  const urlList = [...new Set(urls)].filter((u) => u.startsWith(origin)).slice(0, 10000);
  if (urlList.length === 0) warn('el sitemap no tiene URL.');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${origin}/${key}.txt`, urlList }),
  });
  if (res.ok) console.log(`✅ IndexNow: ${urlList.length} URL enviadas (HTTP ${res.status}).`);
  else warn(`HTTP ${res.status} ${await res.text().catch(() => '')}`.trim());
} catch (error) {
  warn(error instanceof Error ? error.message : String(error));
}
