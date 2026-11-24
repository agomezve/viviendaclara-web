// Ruta: src/lib/indexables.mjs
// Qué fichas de municipio se indexan. Las que tienen pocas tasaciones dan un precio poco fiable y
// Google ya las deja en «Descubierta: actualmente sin indexar»: se marcan noindex y salen del sitemap,
// pero siguen publicadas y enlazadas. Lo usan src/pages/vivienda/[slug].astro y astro.config.mjs.

/** Tasaciones mínimas (Ministerio de Vivienda) para que el precio de compra del municipio sea fiable. */
export const MIN_TASACIONES = 25;

/**
 * Desde el 24-nov-2026, para indexar hace falta algo más que el mínimo: 50 tasaciones, ser capital de
 * provincia o tener impresiones en Google. Las fichas de 25 a 49 tasaciones sin impresiones (30) pasan
 * a noindex para que Google y AdSense vean solo las fichas con más datos. Siguen publicadas y enlazadas.
 */
export const TASACIONES_INDEXAR = 50;

/** Capitales de provincia: se indexan con el mínimo de 25 tasaciones aunque no lleguen a 50. */
export const CAPITALES = [
  'vitoria-gasteiz', 'albacete', 'alicante', 'almeria', 'avila', 'badajoz', 'palma', 'barcelona', 'burgos',
  'caceres', 'cadiz', 'castellon-de-la-plana', 'ciudad-real', 'cordoba', 'a-coruna', 'cuenca', 'girona',
  'granada', 'guadalajara', 'donostia', 'huelva', 'huesca', 'jaen', 'leon', 'lleida', 'logrono', 'lugo',
  'madrid', 'malaga', 'murcia', 'pamplona', 'ourense', 'oviedo', 'palencia', 'las-palmas-de-gran-canaria',
  'pontevedra', 'salamanca', 'santa-cruz-de-tenerife', 'santander', 'segovia', 'sevilla', 'soria',
  'tarragona', 'teruel', 'toledo', 'valencia', 'valladolid', 'bilbao', 'zamora', 'zaragoza', 'ceuta', 'melilla',
];

/**
 * Municipios con impresiones en Google: se indexan aunque no lleguen a los mínimos
 * (Search Console, últimos 90 días; consultado el 18-nov y el 24-nov-2026). Revisar en cada revisión semanal.
 */
export const CON_IMPRESIONES = [
  'alcorcon', 'algeciras', 'antequera', 'badalona', 'boadilla-del-monte', 'cangas', 'chiclana-de-la-frontera',
  'eivissa', 'elche', 'estepona', 'jumilla', 'las-rozas-de-madrid', 'majadahonda', 'marin', 'ourense',
  'portugalete', 'pozuelo-de-alarcon', 'rivas-vaciamadrid', 'torrejon-de-ardoz', 'torremolinos', 'tres-cantos',
  'valdemoro', 'xativa',
];

/** @param {{ slug: string, compra: { tasaciones?: number | null } }} m */
export const municipioIndexable = (m) => {
  const t = m.compra?.tasaciones ?? 0;
  if (CON_IMPRESIONES.includes(m.slug)) return true;
  if (t >= TASACIONES_INDEXAR) return true;
  return t >= MIN_TASACIONES && CAPITALES.includes(m.slug);
};
