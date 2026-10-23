// Ruta: src/config/site.ts
// Fuente única de datos del sitio: nombre, navegación, enlaces legales y datos del titular.
// Cualquier cambio de marca o de ruta se hace aquí.

// Dominio y ruta base: se configuran solo en astro.config.mjs (`site` y `base`).
const SITE_ORIGIN = (import.meta.env.SITE ?? 'https://viviendaclara.aarongomezvera.es').replace(/\/+$/, '');
/** Ruta base sin barra final: '' en un dominio propio, '/viviendaclara-web' en GitHub Pages. */
export const BASE_PATH = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

export const SITE = {
  name: 'ViviendaClara',
  /** URL pública del sitio, incluida la ruta base (sin barra final). */
  url: `${SITE_ORIGIN}${BASE_PATH}`,
  locale: 'es_ES',
  lang: 'es',
  tagline: 'Busca piso con tu presupuesto y datos oficiales, sin letra pequeña',
  /** <title> de la portada (60 caracteres como máximo). */
  homeTitle: 'ViviendaClara · Busca piso según tu presupuesto',
  description:
    'Pon tu presupuesto y te llevamos a los pisos que encajan en Idealista y Fotocasa. Precios oficiales de alquiler y compra, hipoteca, gastos, ayudas y más.',
  year: 2026,
  /**
   * Código de verificación de Google Search Console (método "Etiqueta HTML").
   * Pega solo el valor de content="…". Vacío: no se añade la etiqueta.
   */
  googleSiteVerification: '',
  bingSiteVerification: 'E034624449B5B3E1E75EFD689A3D6A72',
} as const;

/**
 * Datos del titular del sitio (LSSI-CE art. 10). Se muestran en el aviso legal,
 * la política de privacidad y la página de contacto.
 * Si alguno queda vacío, las páginas muestran un aviso "[Pendiente: …]" visible.
 */
export const OWNER = {
  name: 'Aarón Gómez Vera',
  email: 'contacto@aarongomezvera.es',
} as const;

/**
 * Formulario de contacto. Sin `formEndpoint`, el formulario abre el programa de correo
 * del usuario con el mensaje ya redactado (no se envían datos a terceros).
 */
export const CONTACT = {
  formEndpoint: '',
} as const;

/** Fecha de la última revisión de los textos legales. */
export const LEGAL_UPDATED = '23 de octubre de 2026';

/**
 * Google AdSense. Mismo editor que el resto de webs; cada dominio nuevo hay que añadirlo
 * en AdSense > Sitios y esperar la aprobación. Los bloques solo aparecen cuando tienen id.
 */
export const ADSENSE = {
  clientId: 'ca-pub-3004394150242621',
  slots: {
    horizontal: '',
    rectangle: '',
    'in-article': '',
  },
} as const;

export type AdFormat = keyof typeof ADSENSE.slots;

/** true si hay un client id de AdSense con formato válido ("ca-pub-" + 16 dígitos). */
export function isAdSenseEnabled(): boolean {
  return /^ca-pub-\d{16}$/.test(ADSENSE.clientId.trim());
}

/** Canal de YouTube donde enseño cómo construyo estas webs con IA. */
export const CHANNEL = {
  name: 'IA en Crudo',
  url: 'https://www.youtube.com/@iaencrudo',
} as const;

/** Autor real de la web: bloque de autor de las páginas de ciudad y provincia y JSON-LD (Person). */
export const AUTHOR = {
  name: OWNER.name,
  href: '/sobre-mi',
  jobTitle: 'Programador backend',
  initials: 'AG',
  /** Perfiles del autor en otras webs (schema.org sameAs). */
  sameAs: [CHANNEL.url],
  bio: `Soy ${OWNER.name}, programador backend. He construido ${SITE.name} con ayuda de IA y lo cuento en mi canal ${CHANNEL.name}. Las cifras no las genera ninguna IA: son los datos oficiales del Ministerio de Vivienda, el INE, Hacienda y el Banco Central Europeo, tal cual.`,
} as const;

/** Página que explica qué hace la IA, qué reviso yo y de dónde salen los datos. */
export const CONTENT_PROCESS = { href: '/como-hacemos-este-contenido', title: 'Cómo hacemos este contenido' } as const;

/** Nota de transparencia bajo el bloque de autor. */
export const AI_NOTE = `Contenido redactado con ayuda de IA y revisado por ${OWNER.name}.`;

/**
 * Mis webs y el canal. El pie muestra todas menos la actual (`CURRENT_PROJECT`).
 * Las páginas de ciudad y provincia enlazan a las de `CONTEXT_LINKS`.
 */
export const PROJECTS = [
  {
    id: 'finanzas',
    name: 'CapitalPráctico',
    url: 'https://finanzas.aarongomezvera.es',
    description: 'Calculadoras y guías de finanzas personales',
  },
  {
    id: 'ahorro',
    name: 'AhorroLuz',
    url: 'https://ahorroluz.aarongomezvera.es',
    description: 'Calculadoras y guías para pagar menos luz y gas',
  },
  {
    id: 'viajes',
    name: 'ViajaChollo',
    url: 'https://viajesychollos.aarongomezvera.es',
    description: 'Herramientas y guías para viajar barato',
  },
  {
    id: 'repostabarato',
    name: 'RepostaBarato',
    url: 'https://repostabarato.aarongomezvera.es',
    description: 'La gasolinera más barata cerca de ti',
  },
  {
    id: 'vivienda',
    name: 'ViviendaClara',
    url: 'https://viviendaclara.aarongomezvera.es',
    description: 'Busca piso según tu presupuesto, con datos oficiales',
  },
  {
    id: 'canal',
    name: CHANNEL.name,
    url: CHANNEL.url,
    description: 'Canal de YouTube: cómo hago estas webs con IA',
  },
] as const;

export type ProjectId = (typeof PROJECTS)[number]['id'];
export const CURRENT_PROJECT: ProjectId = 'vivienda';

export function getProject(id: ProjectId) {
  return PROJECTS.find((p) => p.id === id)!;
}

/** Enlaces a otras de mis webs al final de las páginas de ciudad y provincia (`path`: ruta en esa web). */
export const CONTEXT_LINKS: readonly { project: ProjectId; path: string; text: string }[] = [
  {
    project: 'finanzas',
    path: '/',
    text: 'Calcula tu sueldo neto y organiza tus ahorros para la entrada en CapitalPráctico.',
  },
  {
    project: 'ahorro',
    path: '/',
    text: 'Cuando ya tengas casa, calcula cuánto vas a pagar de luz en AhorroLuz.',
  },
];

/** Aviso al final de las páginas de ciudad y provincia y en /sobre-mi. */
export const CHANNEL_NOTE = `Mira cómo hice esta web con IA en mi canal ${CHANNEL.name}`;

/**
 * Newsletter. Mientras `formAction` esté vacío, el bloque no se muestra.
 * `provider`: nombre del servicio (p. ej. "Brevo"); se menciona en la política de privacidad.
 * `formAction`: URL a la que el proveedor indica enviar su formulario (método POST, campo "email").
 */
export const NEWSLETTER = {
  provider: '',
  formAction: '',
  title: 'Te aviso cuando salgan datos nuevos de vivienda',
  text: 'Un correo cuando el Ministerio publique precios nuevos o se abran ayudas. Sin spam: te das de baja con un clic.',
} as const;

export function isNewsletterEnabled(): boolean {
  return NEWSLETTER.formAction.trim() !== '';
}

/**
 * Google Analytics 4 ("G-XXXXXXXXXX"). Vacío: no se carga nada.
 * Con Consent Mode v2 todo empieza denegado; la CMP de Google (AdSense) actualiza el consentimiento.
 */
export const GA4_ID = 'G-DZ84DX2JWB';

export function isAnalyticsEnabled(): boolean {
  return /^G-[A-Z0-9]+$/.test(GA4_ID.trim());
}

/** Devuelve el valor o un marcador visible "[Pendiente: …]". */
export function pending(value: string, label: string): string {
  return value.trim() !== '' ? value : `[Pendiente: ${label}]`;
}

export function isPending(value: string): boolean {
  return value.trim() === '';
}

export const NAV_LINKS = [
  { href: '/', title: 'Buscador' },
  { href: '/cuanto-puedo-pagar', title: '¿Cuánto puedo pagar?' },
  { href: '/herramientas', title: 'Herramientas' },
  { href: '/precios', title: 'Precios por ciudad' },
  { href: '/guias', title: 'Guías' },
] as const;

/** Las 10 herramientas, en el orden en que aparecen en portada y en /herramientas. */
export const HERRAMIENTAS = [
  { href: '/', titulo: 'Buscador con tu presupuesto', texto: 'Pon lo que puedes pagar y abre los pisos que encajan en Idealista y Fotocasa.', icono: 'buscar' },
  { href: '/cuanto-puedo-pagar', titulo: '¿Cuánto puedo pagar?', texto: 'Con tu sueldo y tus ahorros, el alquiler o el piso máximo que te puedes permitir.', icono: 'cartera' },
  { href: '/donde-me-llega', titulo: '¿Dónde me llega?', texto: 'Los municipios donde tu presupuesto da para la casa que necesitas.', icono: 'mapa' },
  { href: '/gastos-compra', titulo: 'Gastos de comprar', texto: 'Impuestos de tu comunidad y el dinero que necesitas de verdad además de la entrada.', icono: 'recibo' },
  { href: '/hipoteca', titulo: 'Calculadora de hipoteca', texto: 'Cuota, intereses totales y tabla de amortización con el Euríbor actual.', icono: 'banco' },
  { href: '/alquilar-o-comprar', titulo: '¿Alquilar o comprar?', texto: 'Compara lo que pagas en cada caso a lo largo de los años.', icono: 'balanza' },
  { href: '/te-cobran-de-mas', titulo: '¿Te cobran de más?', texto: 'Compara tu alquiler con lo que se paga de verdad en tu municipio según Hacienda.', icono: 'lupa' },
  { href: '/ayudas', titulo: 'Ayudas a la vivienda', texto: 'Comprueba en 1 minuto a qué ayudas estatales podrías optar.', icono: 'mano' },
  { href: '/esfuerzo', titulo: 'Ranking de esfuerzo', texto: 'Cuántos años de sueldo cuesta un piso en cada ciudad.', icono: 'grafica' },
  { href: '/estafas-alquiler', titulo: 'Evita estafas', texto: 'Señales de alarma y lista para revisar antes de pagar o firmar.', icono: 'escudo' },
] as const;

export const LEGAL_LINKS = [
  { href: '/aviso-legal', title: 'Aviso legal' },
  { href: '/politica-privacidad', title: 'Política de privacidad' },
  { href: '/politica-cookies', title: 'Política de cookies' },
  { href: '/afiliados', title: 'Enlaces de afiliado' },
] as const;

export const SITE_LINKS = [
  { href: '/sobre-mi', title: 'Sobre mí' },
  { href: '/contacto', title: 'Contacto' },
  { href: CONTENT_PROCESS.href, title: CONTENT_PROCESS.title },
] as const;

/** Quita la ruta base de un pathname: '/viviendaclara-web/contacto' → '/contacto'. */
export function stripBase(pathname: string): string {
  if (BASE_PATH && (pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`))) {
    return pathname.slice(BASE_PATH.length) || '/';
  }
  return pathname;
}

/** URL absoluta de una ruta interna ('/contacto'), incluida la ruta base. */
export function absoluteUrl(path: string): string {
  const clean = stripBase(path.startsWith('/') ? path : `/${path}`);
  return `${SITE.url}${clean}`;
}
