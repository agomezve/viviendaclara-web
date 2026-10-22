// Ruta: src/lib/datos.ts
// Acceso tipado a los datos oficiales (los genera scripts/datos/actualizar_datos.py y scripts/euribor.mjs).
import municipiosJson from '../data/municipios.json';
import provinciasJson from '../data/provincias.json';
import comunidadesJson from '../data/comunidades.json';
import fuentesJson from '../data/fuentes.json';
import euriborJson from '../data/euribor.json';
import portalesJson from '../data/portales.json';
import impuestosJson from '../data/impuestos.json';
import type { ReglaITP } from './calculos';

export interface Alquiler {
  m2: number;
  m2P25: number | null;
  m2P75: number | null;
  mes: number | null;
  mesP25: number | null;
  mesP75: number | null;
  superficie: number | null;
  viviendas: number | null;
}

export interface CompraMunicipio {
  m2: number | null;
  m2Nueva: number | null;
  m2Usada: number | null;
  tasaciones: number | null;
}

export interface Municipio {
  ine: string;
  nombre: string;
  slug: string;
  provincia: string;
  ccaa: string;
  compra: CompraMunicipio;
  alquiler: Alquiler | null;
  rentaHogar: number | null;
  esfuerzoCompraAnios: number | null;
  esfuerzoAlquilerPct: number | null;
}

export interface CompraProvincia {
  m2: number | null;
  variacionAnual: number | null;
  serie: Record<string, number | null>;
}

export interface Provincia {
  codigo: string;
  nombre: string;
  slug: string;
  ccaa: string;
  compra: CompraProvincia;
  alquiler: Alquiler | null;
  municipios: string[];
}

export interface Comunidad {
  codigo: string;
  nombre: string;
  compra: CompraProvincia | null;
  alquiler: Alquiler | null;
}

export const MUNICIPIOS = municipiosJson as Municipio[];
export const PROVINCIAS = provinciasJson as Provincia[];
export const COMUNIDADES = comunidadesJson as Comunidad[];
export const FUENTES = fuentesJson;
export const EURIBOR = euriborJson as { valor: number; mes: string; serie: { mes: string; valor: number }[]; fuente: string; url: string };
export const IMPUESTOS = impuestosJson as unknown as {
  revisado: string;
  fuente: { nombre: string; url: string };
  ivaViviendaNueva: number;
  comunidades: Record<
    string,
    { itp?: ReglaITP; ajd?: number; foral?: string; enlaces?: [string, string][]; nuevaSinIva?: string; nuevaEnlace?: string }
  >;
};

const PORTALES = portalesJson as unknown as {
  idealista: { municipios: Record<string, string>; provincias: Record<string, string> };
  fotocasa?: { municipios: Record<string, string>; provincias: Record<string, string> };
};

/** Superficie de referencia para comparar precios de compra (m²). */
export const SUPERFICIE_REFERENCIA = 80;

const porSlug = new Map(MUNICIPIOS.map((m) => [m.slug, m]));
const provPorCodigo = new Map(PROVINCIAS.map((p) => [p.codigo, p]));
const provPorSlug = new Map(PROVINCIAS.map((p) => [p.slug, p]));
const ccaaPorCodigo = new Map(COMUNIDADES.map((c) => [c.codigo, c]));

export const municipio = (slug: string) => porSlug.get(slug);
export const provincia = (codigo: string) => provPorCodigo.get(codigo)!;
export const provinciaPorSlug = (slug: string) => provPorSlug.get(slug);
export const comunidad = (codigo: string) => ccaaPorCodigo.get(codigo)!;

export function municipiosDe(codigoProvincia: string): Municipio[] {
  return MUNICIPIOS.filter((m) => m.provincia === codigoProvincia);
}

/** «2026-T2» → «2.º trimestre de 2026». */
export function trimestreLegible(t: string): string {
  const [a, q] = t.split('-T');
  return `${q}.º trimestre de ${a}`;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** «2026-09» → «septiembre de 2026». */
export function mesLegible(m: string): string {
  const [a, mm] = m.split('-');
  return `${MESES[Number(mm) - 1]} de ${a}`;
}

/** Ubicaciones de los portales para un municipio (o su provincia si el portal no lo tiene). */
export function ubicacionesPortales(m: Municipio | undefined, codigoProvincia: string) {
  return {
    idealista: (m && PORTALES.idealista.municipios[m.ine]) || PORTALES.idealista.provincias[codigoProvincia],
    fotocasa: (m && PORTALES.fotocasa?.municipios[m.ine]) || PORTALES.fotocasa?.provincias[codigoProvincia] || null,
  };
}

/** Datos mínimos de cada municipio para los buscadores del navegador. */
export function indiceBuscador() {
  return MUNICIPIOS.map((m) => {
    const u = ubicacionesPortales(m, m.provincia);
    return {
      s: m.slug,
      n: m.nombre,
      p: provincia(m.provincia).nombre,
      pc: m.provincia,
      c: m.ccaa,
      cm2: m.compra.m2,
      am2: m.alquiler?.m2 ?? null,
      am: m.alquiler?.mes ?? null,
      a25: m.alquiler?.mesP25 ?? null,
      a75: m.alquiler?.mesP75 ?? null,
      sup: m.alquiler?.superficie ?? null,
      r: m.rentaHogar,
      id: u.idealista,
      fc: u.fotocasa,
    };
  });
}

export type EntradaBuscador = ReturnType<typeof indiceBuscador>[number];

/** Provincias para el buscador (cuando el municipio no está en la lista). */
export function indiceProvincias() {
  return PROVINCIAS.map((p) => {
    const u = ubicacionesPortales(undefined, p.codigo);
    return {
      s: p.slug,
      n: p.nombre,
      c: p.ccaa,
      pc: p.codigo,
      cm2: p.compra.m2,
      am2: p.alquiler?.m2 ?? null,
      am: p.alquiler?.mes ?? null,
      a25: p.alquiler?.mesP25 ?? null,
      a75: p.alquiler?.mesP75 ?? null,
      sup: p.alquiler?.superficie ?? null,
      id: u.idealista,
      fc: u.fotocasa,
    };
  });
}

export type EntradaProvincia = ReturnType<typeof indiceProvincias>[number];
