// Ruta: scripts/euribor.mjs
// Descarga el Euríbor a 12 meses (media mensual) del Banco Central Europeo y lo guarda en
// src/data/euribor.json para la calculadora de hipoteca. Si la API falla, se conserva el último
// dato guardado y el build sigue.
import { readFile, writeFile } from 'node:fs/promises';

const API =
  'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA?lastNObservations=13&format=csvdata';
const DESTINO = new URL('../src/data/euribor.json', import.meta.url);

async function descargar() {
  const res = await fetch(API, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const lineas = (await res.text()).trim().split(/\r?\n/);
  const cab = lineas.shift().split(',');
  const iPeriodo = cab.indexOf('TIME_PERIOD');
  const iValor = cab.indexOf('OBS_VALUE');
  const serie = lineas
    .map((l) => l.split(','))
    .map((c) => ({ mes: c[iPeriodo], valor: Number(c[iValor]) }))
    .filter((d) => /^\d{4}-\d{2}$/.test(d.mes) && Number.isFinite(d.valor))
    .sort((a, b) => a.mes.localeCompare(b.mes));
  if (serie.length === 0) throw new Error('Respuesta sin datos');
  return serie;
}

try {
  const serie = await descargar();
  const ultimo = serie.at(-1);
  const datos = {
    valor: Math.round(ultimo.valor * 1000) / 1000,
    mes: ultimo.mes,
    serie: serie.map((d) => ({ mes: d.mes, valor: Math.round(d.valor * 1000) / 1000 })),
    fuente: 'Banco Central Europeo · Euríbor a 1 año, media mensual',
    url: 'https://data.ecb.europa.eu/data/datasets/FM/FM.M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA',
    descargado: new Date().toISOString(),
  };
  await writeFile(DESTINO, JSON.stringify(datos, null, 1) + '\n');
  console.log(`Euríbor ${datos.mes}: ${datos.valor} %`);
} catch (err) {
  const previo = await readFile(DESTINO, 'utf8').catch(() => null);
  if (!previo) {
    console.error(`No se pudo descargar el Euríbor y no hay copia guardada: ${err.message}`);
    process.exit(1);
  }
  console.warn(`No se pudo descargar el Euríbor (${err.message}); se usa el último guardado.`);
}
