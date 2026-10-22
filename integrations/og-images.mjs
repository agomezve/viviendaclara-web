// Ruta: integrations/og-images.mjs
// Genera tras el build una imagen Open Graph de 1200×630 (PNG) por página, con satori + resvg.
// Lee de cada HTML de dist/ las metas que pone src/components/SEO.astro:
//   og:image (dónde guardar la imagen), og:image:alt (titular), og:site_name,
//   article:section (antetítulo, si existe) y article:author.
// Fuente: Inter (@fontsource/inter, WOFF con tildes, ñ y €).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (weight) => readFile(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`));

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

function meta(html, key) {
  const re = new RegExp(`<meta[^>]+(?:property|name)="${key}"[^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content="([^"]*)"/i)?.[1];
  return content === undefined ? undefined : decode(content);
}

const h = (type, style, children) => ({
  type,
  props: { style, children: Array.isArray(children) ? children.filter(Boolean) : children },
});

function titleSize(text) {
  const n = [...text].length;
  if (n <= 40) return 72;
  if (n <= 60) return 62;
  if (n <= 85) return 54;
  return 46;
}

function card({ title, kicker, siteName, host, author }, colors) {
  // Lienzo de 1200×630 con márgenes de 72 px a los lados y 64 px arriba y abajo.
  const inner = h(
    'div',
    {
      width: 1056,
      height: 502,
      margin: '64px 72px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    [
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h('div', { display: 'flex', width: 96, height: 8, borderRadius: 4, backgroundColor: colors.accent }),
        kicker &&
          h(
            'div',
            { display: 'flex', marginTop: 28, fontSize: 28, fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
            kicker,
          ),
        h(
          'div',
          { display: 'flex', width: 1056, marginTop: kicker ? 18 : 36, fontSize: titleSize(title), fontWeight: 800, lineHeight: 1.12, letterSpacing: -1 },
          title,
        ),
      ]),
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 26, color: '#cbd5e1' }, [
        h('div', { display: 'flex', flexDirection: 'column' }, [
          h('div', { display: 'flex', fontSize: 34, fontWeight: 800, color: '#f8fafc' }, siteName),
          h('div', { display: 'flex', marginTop: 6 }, host),
        ]),
        h('div', { display: 'flex' }, author ? `Por ${author}` : ''),
      ]),
    ],
  );
  return h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      backgroundColor: colors.background,
      backgroundImage: `radial-gradient(circle at 100% 0%, ${colors.glow} 0%, ${colors.background} 55%)`,
      color: '#f8fafc',
      fontFamily: 'Inter',
    },
    [inner],
  );
}

/**
 * @param {{ accent: string, background?: string, glow?: string, author?: string }} options
 * @returns {import('astro').AstroIntegration}
 */
export default function ogImages(options) {
  const colors = { background: '#0f172a', glow: '#1e293b', ...options };
  return {
    name: 'og-images',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const fonts = [
          { name: 'Inter', data: await font(400), weight: 400, style: 'normal' },
          { name: 'Inter', data: await font(700), weight: 700, style: 'normal' },
          { name: 'Inter', data: await font(800), weight: 800, style: 'normal' },
        ];
        const start = Date.now();
        let count = 0;
        for await (const file of htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const image = meta(html, 'og:image');
          const title = meta(html, 'og:image:alt');
          if (!image || !title) continue;
          const url = new URL(image);
          const target = join(root, decodeURIComponent(url.pathname));
          const siteName = meta(html, 'og:site_name') ?? '';
          const kicker = meta(html, 'article:section') ?? '';
          const author = meta(html, 'article:author') ?? options.author ?? '';
          const svg = await satori(card({ title, kicker, siteName, host: url.host, author }, colors), {
            width: 1200,
            height: 630,
            fonts,
          });
          const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: false } }).render().asPng();
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, png);
          count++;
        }
        logger.info(`${count} imágenes Open Graph generadas en ${((Date.now() - start) / 1000).toFixed(1)} s.`);
      },
    },
  };
}
