// Ruta: scripts/ipv.mjs
// Descarga el Índice de Precios de Vivienda (IPV) del INE, base 2025, por trimestres desde 2007, para
// España y las 19 comunidades y ciudades autónomas (tabla 79563). Guarda src/data/ipv.json para
// /indice-precios-vivienda. Si la API falla, se conserva el último dato guardado y el build sigue.
import { writeFile } from 'node:fs/promises';

const TABLA = 79563;
const API = `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/${TABLA}?tip=A`;
const DESTINO = new URL('../src/data/ipv.json', import.meta.url);

// Nombres del INE → código de comunidad de src/data/comunidades.json ('00' = España).
const CODIGOS = {
  Nacional: '00',
  'Andalucía': '01',
  'Aragón': '02',
  'Asturias, Principado de': '03',
  'Balears, Illes': '04',
  Canarias: '05',
  Cantabria: '06',
  'Castilla y León': '07',
  'Castilla - La Mancha': '08',
  'Cataluña': '09',
  'Comunitat Valenciana': '10',
  Extremadura: '11',
  Galicia: '12',
  'Madrid, Comunidad de': '13',
  'Murcia, Región de': '14',
  'Navarra, Comunidad Foral de': '15',
  'País Vasco': '16',
  'Rioja, La': '17',
  Ceuta: '18',
  Melilla: '19',
};
const TIPOS = { General: 'general', 'Vivienda nueva': 'nueva', 'Vivienda segunda mano': 'segunda' };
const MEDIDAS = { 'Índice': 'indice', 'Variación anual': 'anual', 'Variación trimestral': 'trimestral' };
const TRIMESTRE = { 19: 'T1', 20: 'T2', 21: 'T3', 22: 'T4' };

async function descargar() {
  const res = await fetch(API, { signal: AbortSignal.timeout(60_000), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const series = await res.json();
  const territorios = {};
  let provisional = null;
  for (const s of series) {
    const [territorio, tipo, medida] = s.Nombre.split('.').map((x) => x.trim());
    const codigo = CODIGOS[territorio];
    if (!codigo || !TIPOS[tipo] || !MEDIDAS[medida]) continue;
    const t = (territorios[codigo] ??= { codigo, nombreINE: territorio });
    const datos = s.Data.filter((d) => d.Valor != null && !d.Secreto)
      .map((d) => [`${d.Anyo}-${d.T3_Periodo ?? TRIMESTRE[d.FK_Periodo]}`, d.Valor, d.T3_TipoDato])
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (!datos.length) continue;
    if (codigo === '00' && tipo === 'General' && medida === 'Índice') provisional = datos.at(-1)[2] ?? null;
    (t[TIPOS[tipo]] ??= {})[MEDIDAS[medida]] = Object.fromEntries(datos.map(([k, v]) => [k, v]));
  }
  const nacional = territorios['00']?.general?.indice;
  if (!nacional || Object.keys(territorios).length < 20) throw new Error('Respuesta incompleta');
  return {
    fuente: 'INE · Índice de Precios de Vivienda (IPV), base 2025',
    url: `https://www.ine.es/jaxiT3/Tabla.htm?t=${TABLA}`,
    tabla: TABLA,
    ultimoTrimestre: Object.keys(nacional).at(-1),
    tipoDato: provisional,
    descargado: new Date().toISOString(),
    territorios: Object.values(territorios).sort((a, b) => a.codigo.localeCompare(b.codigo)),
  };
}

try {
  const datos = await descargar();
  await writeFile(DESTINO, JSON.stringify(datos) + '\n');
  const n = datos.territorios[0].general;
  console.log(`[ipv] ${datos.ultimoTrimestre}: índice ${n.indice[datos.ultimoTrimestre]}, anual ${n.anual[datos.ultimoTrimestre]} %`);
} catch (err) {
  console.warn(`[ipv] No se pudo descargar (${err.message}): se mantiene src/data/ipv.json.`);
}
