// Ruta: src/scripts/buscador.ts
// Buscador de la portada: con el presupuesto, calcula para qué da en el lugar elegido
// y abre la búsqueda con filtros en Idealista y Fotocasa.
import { euros, miles, decimal1, urlIdealista, urlFotocasa, type Operacion, type FiltrosPortal } from '../lib/calculos';
import { conectaLugar, leeDatos, numero, type OpcionLugar } from './lugar';
import type { EntradaBuscador, EntradaProvincia } from '../lib/datos';

type Lugar = (EntradaBuscador & { tipo: 'm' }) | (EntradaProvincia & { tipo: 'p' });

const raiz = document.querySelector<HTMLElement>('[data-buscador]');
if (raiz) iniciar(raiz);

function iniciar(raiz: HTMLElement) {
  const { municipios, provincias, superficie } = leeDatos<{
    municipios: EntradaBuscador[];
    provincias: EntradaProvincia[];
    superficie: number;
  }>('datos-buscador');

  const lugares = new Map<string, Lugar>();
  const opciones: OpcionLugar[] = [];
  for (const m of municipios) {
    lugares.set(`m:${m.s}`, { ...m, tipo: 'm' });
    opciones.push({ clave: `m:${m.s}`, nombre: m.n, detalle: m.p });
  }
  for (const p of provincias) {
    lugares.set(`p:${p.pc}`, { ...p, tipo: 'p' });
    opciones.push({ clave: `p:${p.pc}`, nombre: `Provincia de ${p.n}`, detalle: 'Toda la provincia' });
  }

  const $ = <T extends Element>(sel: string) => raiz.querySelector<T>(sel)!;
  const form = $<HTMLFormElement>('form');
  const inputLugar = $<HTMLInputElement>('[data-lugar]');
  const inputMax = $<HTMLInputElement>('[name="max"]');
  const sufijo = $<HTMLElement>('[data-sufijo]');
  const selDorm = $<HTMLSelectElement>('[name="dormitorios"]');
  const bloqueVivienda = raiz.querySelectorAll<HTMLElement>('[data-solo-vivienda]');
  const resultado = $<HTMLElement>('[data-resultado]');
  const aviso = $<HTMLElement>('[data-aviso]');

  let lugar: Lugar | null = null;

  const fijaLugar = conectaLugar(inputLugar, $<HTMLUListElement>('[data-sugerencias]'), opciones, (o) => {
    lugar = o ? lugares.get(o.clave) ?? null : null;
    actualiza();
  });

  const operacion = (): Operacion =>
    (form.querySelector<HTMLInputElement>('[name="operacion"]:checked')?.value as Operacion) ?? 'alquiler';

  function filtros(): FiltrosPortal {
    const max = numero(inputMax);
    const fd = new FormData(form);
    return {
      operacion: operacion(),
      max: Number.isFinite(max) && max > 0 ? max : undefined,
      dormitorios: Number(selDorm.value) || 0,
      ascensor: fd.has('ascensor'),
      garaje: fd.has('garaje'),
      terraza: fd.has('terraza'),
    };
  }

  function actualiza() {
    const op = operacion();
    sufijo.textContent = op === 'compra' ? '€' : '€/mes';
    inputMax.placeholder = op === 'compra' ? 'Ej.: 200000' : op === 'habitacion' ? 'Ej.: 400' : 'Ej.: 900';
    for (const el of bloqueVivienda) el.hidden = op === 'habitacion';
    guardaEnUrl();

    if (!lugar) {
      resultado.hidden = true;
      aviso.hidden = false;
      return;
    }
    aviso.hidden = true;
    resultado.hidden = false;
    pintaResultado(lugar, filtros());
  }

  function pintaResultado(l: Lugar, f: FiltrosPortal) {
    const nombre = l.tipo === 'm' ? l.n : `la provincia de ${l.n}`;
    const titulo = $<HTMLElement>('[data-r-titulo]');
    const cifra = $<HTMLElement>('[data-r-cifra]');
    const cifraTexto = $<HTMLElement>('[data-r-cifra-texto]');
    const detalle = $<HTMLElement>('[data-r-detalle]');
    const barra = $<HTMLElement>('[data-r-barra]');
    const fuente = $<HTMLElement>('[data-r-fuente]');
    const max = f.max;
    barra.hidden = true;
    cifra.parentElement!.hidden = false;

    if (f.operacion === 'habitacion') {
      titulo.textContent = `Habitaciones en ${nombre}`;
      cifra.parentElement!.hidden = true;
      detalle.textContent = `No hay estadística oficial del precio de las habitaciones, así que aquí no te damos una cifra. Abre las habitaciones disponibles con tu presupuesto en Idealista y Fotocasa.${l.am ? ` Como referencia, un piso entero se alquila por una mediana de ${euros(l.am)} al mes.` : ''}`;
      fuente.textContent = l.am ? 'Alquiler mediano de un piso: contratos de 2024 declarados a Hacienda (SERPAVI, Ministerio de Vivienda).' : '';
    } else if (f.operacion === 'alquiler') {
      titulo.textContent = `Alquilar en ${nombre}${max ? ` con ${euros(max)} al mes` : ''}`;
      if (max && l.am2) {
        cifra.textContent = `${miles(max / l.am2)} m²`;
        cifraTexto.textContent = 'es la superficie que pagas con tu presupuesto al precio mediano por m²';
      } else {
        cifra.textContent = euros(l.am);
        cifraTexto.textContent = 'es el alquiler mediano de un piso';
      }
      const partes = [
        `El alquiler mediano de un piso es de ${euros(l.am)} al mes (${decimal1(l.am2)} €/m²)${l.sup ? `, con ${miles(l.sup)} m² de media` : ''}.`,
      ];
      if (max && l.a25 && l.a75 && l.am) {
        barra.hidden = false;
        pintaBarra(barra, max, l.a25, l.am, l.a75);
        if (max < l.a25) partes.push('Tu presupuesto está por debajo de lo que pagan 3 de cada 4 inquilinos: hay poca oferta a ese precio.');
        else if (max < l.am) partes.push('Tu presupuesto está entre el 25 % más barato y la mitad de los contratos.');
        else if (max < l.a75) partes.push('Tu presupuesto está por encima de la mitad de los contratos: tienes opciones.');
        else partes.push('Tu presupuesto supera lo que pagan 3 de cada 4 inquilinos.');
      }
      detalle.textContent = partes.join(' ');
      fuente.textContent = 'Contratos de alquiler de 2024 declarados a Hacienda (SERPAVI, Ministerio de Vivienda). Los precios de los anuncios de hoy pueden ser distintos.';
    } else {
      titulo.textContent = `Comprar en ${nombre}${max ? ` con ${euros(max)}` : ''}`;
      if (max && l.cm2) {
        cifra.textContent = `${miles(max / l.cm2)} m²`;
        cifraTexto.textContent = 'es la superficie que pagas con tu presupuesto al valor tasado medio';
      } else {
        cifra.textContent = euros(l.cm2 ? l.cm2 * superficie : null);
        cifraTexto.textContent = `cuesta de media un piso de ${superficie} m²`;
      }
      detalle.textContent = `El valor tasado medio es de ${euros(l.cm2)} por m²: un piso de ${superficie} m² sale por unos ${euros(l.cm2 ? l.cm2 * superficie : null)}. Recuerda sumar los impuestos y gastos de la compra.`;
      fuente.textContent = 'Valor tasado medio de la vivienda libre del 2.º trimestre de 2026 (Ministerio de Vivienda). Es lo que tasan los bancos, no el precio de los anuncios.';
    }

    // Enlaces a los portales
    const aId = $<HTMLAnchorElement>('[data-r-idealista]');
    const aFc = $<HTMLAnchorElement>('[data-r-fotocasa]');
    aId.href = urlIdealista(l.id, f);
    const fc = l.fc ? urlFotocasa(l.fc, f) : null;
    aFc.hidden = !fc;
    if (fc) aFc.href = fc;
    $<HTMLElement>('[data-r-extras]').hidden = f.operacion === 'habitacion' || !(f.ascensor || f.garaje || f.terraza);

    const ficha = $<HTMLAnchorElement>('[data-r-ficha]');
    ficha.href = l.tipo === 'm' ? `/vivienda/${l.s}` : `/provincia/${l.s}`;
    ficha.textContent = l.tipo === 'm' ? `Todos los datos de ${l.n}` : `Todos los datos de la provincia de ${l.n}`;
  }

  /** Barra con el 25 %, la mediana y el 75 % de los alquileres y tu presupuesto encima. */
  function pintaBarra(barra: HTMLElement, max: number, p25: number, p50: number, p75: number) {
    const min = Math.min(p25 * 0.6, max);
    const top = Math.max(p75 * 1.4, max);
    const pos = (v: number) => `${(((v - min) / (top - min)) * 100).toFixed(1)}%`;
    barra.querySelector<HTMLElement>('[data-b-rango]')!.style.left = pos(p25);
    barra.querySelector<HTMLElement>('[data-b-rango]')!.style.right = `calc(100% - ${pos(p75)})`;
    barra.querySelector<HTMLElement>('[data-b-mediana]')!.style.left = pos(p50);
    barra.querySelector<HTMLElement>('[data-b-tu]')!.style.left = pos(max);
    barra.querySelector<HTMLElement>('[data-b-p25]')!.textContent = euros(p25);
    barra.querySelector<HTMLElement>('[data-b-p50]')!.textContent = euros(p50);
    barra.querySelector<HTMLElement>('[data-b-p75]')!.textContent = euros(p75);
  }

  function guardaEnUrl() {
    const f = filtros();
    if (!inputLugar.dataset.clave && !f.max) return;
    const p = new URLSearchParams();
    p.set('op', f.operacion);
    if (inputLugar.dataset.clave) p.set('lugar', inputLugar.dataset.clave);
    if (f.max) p.set('max', String(f.max));
    if (f.dormitorios) p.set('dorm', String(f.dormitorios));
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }

  // Valores iniciales desde la URL (los enlaces de las otras herramientas los usan)
  const q = new URLSearchParams(location.search);
  const op = q.get('op');
  if (op) {
    const r = form.querySelector<HTMLInputElement>(`[name="operacion"][value="${CSS.escape(op)}"]`);
    if (r) r.checked = true;
  }
  if (q.get('max')) inputMax.value = q.get('max')!;
  if (q.get('dorm')) selDorm.value = q.get('dorm')!;
  if (q.get('lugar')) fijaLugar(q.get('lugar')!);

  form.addEventListener('input', (e) => {
    if (e.target !== inputLugar) actualiza();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!lugar) {
      inputLugar.focus();
      return;
    }
    actualiza();
    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  actualiza();
}
