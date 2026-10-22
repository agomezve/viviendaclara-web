// Ruta: src/lib/calculos.ts
// Funciones puras que usan tanto las páginas (en el build) como los scripts del navegador.
// No importa ningún JSON para que los scripts del cliente pesen poco.

// ─── Formato ────────────────────────────────────────────────────────────────
const fmt0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234.5 → «1.235 €». Intl no pone el punto de miles en números de 4 cifras en es-ES; aquí sí. */
export function euros(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${miles(Math.round(n))} €`;
}

/** Número entero con punto de miles también en 4 cifras (1.234). */
export function miles(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const s = fmt0.format(Math.round(n));
  return /^-?\d{4}$/.test(s) ? s.replace(/^(-?\d)(\d{3})$/, '$1.$2') : s;
}

export function decimal1(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '—' : fmt1.format(n);
}

export function decimal2(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '—' : fmt2.format(n);
}

export function porcentaje(n: number | null | undefined, decimales = 1): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${decimales === 0 ? miles(n) : decimales === 2 ? fmt2.format(n) : fmt1.format(n)} %`;
}

/** Quita acentos y pasa a minúsculas para buscar sin importar cómo se escriba. */
export function normaliza(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// ─── Hipoteca ───────────────────────────────────────────────────────────────

/** Cuota mensual de un préstamo francés. tipoAnual en % (3,2 → 3.2). */
export function cuotaHipoteca(capital: number, tipoAnual: number, anios: number): number {
  const n = Math.round(anios * 12);
  if (capital <= 0 || n <= 0) return 0;
  const i = tipoAnual / 100 / 12;
  if (i === 0) return capital / n;
  return (capital * i) / (1 - Math.pow(1 + i, -n));
}

/** Capital máximo que se paga con una cuota mensual dada. */
export function capitalConCuota(cuota: number, tipoAnual: number, anios: number): number {
  const n = Math.round(anios * 12);
  if (cuota <= 0 || n <= 0) return 0;
  const i = tipoAnual / 100 / 12;
  if (i === 0) return cuota * n;
  return (cuota * (1 - Math.pow(1 + i, -n))) / i;
}

export interface FilaAmortizacion {
  anio: number;
  intereses: number;
  amortizado: number;
  pendiente: number;
}

/** Resumen anual de la amortización. */
export function tablaAmortizacion(capital: number, tipoAnual: number, anios: number): FilaAmortizacion[] {
  const cuota = cuotaHipoteca(capital, tipoAnual, anios);
  const i = tipoAnual / 100 / 12;
  let pendiente = capital;
  const filas: FilaAmortizacion[] = [];
  for (let a = 1; a <= anios; a++) {
    let intereses = 0;
    let amortizado = 0;
    for (let m = 0; m < 12 && pendiente > 0.005; m++) {
      const int = pendiente * i;
      const amort = Math.min(cuota - int, pendiente);
      intereses += int;
      amortizado += amort;
      pendiente -= amort;
    }
    filas.push({ anio: a, intereses, amortizado, pendiente: Math.max(0, pendiente) });
  }
  return filas;
}

// ─── Impuestos de compra ────────────────────────────────────────────────────

export type ReglaITP =
  | { tipo: 'fijo'; pct: number }
  | { tipo: 'progresivo'; tramos: [number, number][] }
  | { tipo: 'total'; tramos: [number, number][] }
  | { tipo: 'umbral'; pct: number; umbral: number; pctAlto: number };

/** Cuota del ITP general (sin reducciones personales) para un precio. */
export function cuotaITP(precio: number, regla: ReglaITP): number {
  if (precio <= 0) return 0;
  switch (regla.tipo) {
    case 'fijo':
      return (precio * regla.pct) / 100;
    case 'umbral':
      return (precio * (precio > regla.umbral ? regla.pctAlto : regla.pct)) / 100;
    case 'total': {
      // Un único tipo para todo el valor, el del tramo en el que cae
      let pct = regla.tramos[0][1];
      for (const [desde, p] of regla.tramos) if (precio > desde) pct = p;
      return (precio * pct) / 100;
    }
    case 'progresivo': {
      // Cada tramo paga a su tipo
      let cuota = 0;
      regla.tramos.forEach(([desde, p], idx) => {
        const hasta = regla.tramos[idx + 1]?.[0] ?? Infinity;
        if (precio > desde) cuota += ((Math.min(precio, hasta) - desde) * p) / 100;
      });
      return cuota;
    }
  }
}

/** 7.75 → «7,75 %», 6 → «6 %». */
export function pctCorto(n: number): string {
  return `${String(n).replace('.', ',')} %`;
}

/** Texto corto del tipo: «7 %», «del 8 % al 10 % según el precio». */
export function describeITP(regla: ReglaITP): string {
  switch (regla.tipo) {
    case 'fijo':
      return pctCorto(regla.pct);
    case 'umbral':
      return `${pctCorto(regla.pct)} (${pctCorto(regla.pctAlto)} si pasa de ${euros(regla.umbral)})`;
    default: {
      const ps = regla.tramos.map((t) => t[1]);
      return `del ${pctCorto(Math.min(...ps))} al ${pctCorto(Math.max(...ps))} según el precio`;
    }
  }
}

// ─── Enlaces a portales ─────────────────────────────────────────────────────

export type Operacion = 'alquiler' | 'compra' | 'habitacion';

export interface FiltrosPortal {
  operacion: Operacion;
  /** Precio máximo: €/mes en alquiler, € en compra. */
  max?: number;
  /** Dormitorios mínimos (0 = sin filtro). */
  dormitorios?: number;
  ascensor?: boolean;
  garaje?: boolean;
  terraza?: boolean;
}

const DORMITORIOS_IDEALISTA = [
  'de-un-dormitorio',
  'de-dos-dormitorios',
  'de-tres-dormitorios',
  'de-cuatro-cinco-habitaciones-o-mas',
];

/** URL de búsqueda en Idealista con filtros. `ubicacion`: slug de Idealista («madrid-madrid», «asturias»). */
export function urlIdealista(ubicacion: string, f: FiltrosPortal): string {
  const ruta =
    f.operacion === 'habitacion' ? 'alquiler-habitacion' : f.operacion === 'alquiler' ? 'alquiler-viviendas' : 'venta-viviendas';
  const filtros: string[] = [];
  if (f.max && f.max > 0) filtros.push(`con-precio-hasta_${Math.round(f.max)}`);
  if (f.operacion !== 'habitacion') {
    const d = Math.min(Math.max(f.dormitorios ?? 0, 0), 4);
    if (d > 0) filtros.push(...DORMITORIOS_IDEALISTA.slice(d - 1));
    if (f.ascensor) filtros.push('ascensor');
    if (f.garaje) filtros.push('garaje');
    if (f.terraza) filtros.push('terraza');
  }
  return `https://www.idealista.com/${ruta}/${ubicacion}/${filtros.length ? `${filtros.join(',')}/` : ''}`;
}

/** URL de búsqueda en Fotocasa. `ubicacion`: slug de Fotocasa («madrid-capital», «getafe»). */
export function urlFotocasa(ubicacion: string, f: FiltrosPortal): string | null {
  if (f.operacion === 'habitacion') return null;
  const ruta = f.operacion === 'alquiler' ? 'alquiler' : 'comprar';
  const params = new URLSearchParams();
  if (f.max && f.max > 0) params.set('maxPrice', String(Math.round(f.max)));
  if (f.dormitorios && f.dormitorios > 0) params.set('minRooms', String(Math.min(f.dormitorios, 4)));
  const q = params.toString();
  return `https://www.fotocasa.es/es/${ruta}/viviendas/${ubicacion}/todas-las-zonas/l${q ? `?${q}` : ''}`;
}

// ─── Impuestos y dinero necesario para comprar ──────────────────────────────

export interface ImpuestosComunidad {
  itp?: ReglaITP;
  ajd?: number;
  foral?: string;
  enlaces?: [string, string][];
  nuevaSinIva?: string;
  nuevaEnlace?: string;
}

export interface DesgloseImpuestos {
  itp: number;
  iva: number;
  ajd: number;
  total: number;
  /** true si no sabemos el impuesto (régimen foral, IGIC de Canarias): total = 0. */
  desconocido: boolean;
}

/** Impuestos de la compra con los tipos generales: ITP si es usada; IVA + AJD si es nueva. */
export function impuestosCompra(precio: number, c: ImpuestosComunidad, nueva: boolean, ivaPct: number): DesgloseImpuestos {
  const cero = { itp: 0, iva: 0, ajd: 0, total: 0 };
  if (!c.itp || c.ajd == null) return { ...cero, desconocido: true };
  if (!nueva) {
    const itp = cuotaITP(precio, c.itp);
    return { ...cero, itp, total: itp, desconocido: false };
  }
  if (c.nuevaSinIva) return { ...cero, desconocido: true };
  const iva = (precio * ivaPct) / 100;
  const ajd = (precio * c.ajd) / 100;
  return { itp: 0, iva, ajd, total: iva + ajd, desconocido: false };
}

/**
 * Precio máximo que se puede pagar con unos ahorros: entrada (1 - financiación) + impuestos + otros gastos.
 * `financiacion` es la parte del precio que pone el banco (0,8 = 80 %).
 */
export function precioMaximoPorAhorros(
  ahorros: number,
  financiacion: number,
  otrosGastos: number,
  impuestos: (precio: number) => number,
): number {
  const necesario = (p: number) => p * (1 - financiacion) + impuestos(p) + otrosGastos;
  if (ahorros <= otrosGastos) return 0;
  let lo = 0;
  let hi = 20_000_000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (necesario(mid) <= ahorros) lo = mid;
    else hi = mid;
  }
  return lo;
}
