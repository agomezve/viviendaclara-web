// Ruta: src/lib/indexables.mjs
// Qué fichas de municipio se indexan. Las que tienen pocas tasaciones dan un precio poco fiable y
// Google ya las deja en «Descubierta: actualmente sin indexar»: se marcan noindex y salen del sitemap,
// pero siguen publicadas y enlazadas. Lo usan src/pages/vivienda/[slug].astro y astro.config.mjs.

/** Tasaciones mínimas (Ministerio de Vivienda) para que el precio de compra del municipio sea fiable. */
export const MIN_TASACIONES = 25;

/**
 * Municipios por debajo del mínimo que se indexan igual porque ya tienen impresiones en Google
 * (Search Console, últimos 28 días, consultado el 18-nov-2026). Revisar en cada revisión semanal.
 */
export const CON_IMPRESIONES = [
  'alcorcon', 'algeciras', 'antequera', 'cangas', 'eivissa', 'jumilla', 'las-rozas-de-madrid',
  'marin', 'ourense', 'portugalete', 'rivas-vaciamadrid', 'torremolinos', 'xativa',
];

/** @param {{ slug: string, compra: { tasaciones?: number | null } }} m */
export const municipioIndexable = (m) => (m.compra?.tasaciones ?? 0) >= MIN_TASACIONES || CON_IMPRESIONES.includes(m.slug);
