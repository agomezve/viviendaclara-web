// Ruta: src/scripts/lugar.ts
// Campo de texto con sugerencias de municipios y provincias (combobox accesible y sin dependencias).
import { normaliza } from '../lib/calculos';

export interface OpcionLugar {
  /** Clave única («m:madrid», «p:28»). */
  clave: string;
  nombre: string;
  /** Texto secundario («Madrid», «Toda la provincia»). */
  detalle: string;
}

interface Indexada extends OpcionLugar {
  busqueda: string;
}

/**
 * Conecta un <input> con su lista de sugerencias. Llama a `alElegir` con la opción elegida
 * (o con null si se borra el texto). Devuelve una función para fijar una opción desde fuera.
 */
export function conectaLugar(
  input: HTMLInputElement,
  lista: HTMLUListElement,
  opciones: OpcionLugar[],
  alElegir: (o: OpcionLugar | null) => void,
): (clave: string) => void {
  const indexadas: Indexada[] = opciones.map((o) => ({ ...o, busqueda: normaliza(`${o.nombre} ${o.detalle}`) }));
  let visibles: Indexada[] = [];
  let activa = -1;
  const id = lista.id || `sugerencias-${Math.random().toString(36).slice(2)}`;
  lista.id = id;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', id);
  input.setAttribute('aria-expanded', 'false');
  lista.setAttribute('role', 'listbox');

  function cierra() {
    lista.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activa = -1;
  }

  function pinta() {
    lista.replaceChildren(
      ...visibles.map((o, i) => {
        const li = document.createElement('li');
        li.id = `${id}-${i}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === activa));
        li.className = `flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2.5 ${i === activa ? 'bg-teal-50' : 'hover:bg-slate-50'}`;
        const n = document.createElement('span');
        n.className = 'font-medium text-slate-900';
        n.textContent = o.nombre;
        const d = document.createElement('span');
        d.className = 'text-xs text-slate-500';
        d.textContent = o.detalle;
        li.append(n, d);
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          elige(o);
        });
        return li;
      }),
    );
    if (visibles.length) {
      lista.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      if (activa >= 0) input.setAttribute('aria-activedescendant', `${id}-${activa}`);
    } else cierra();
  }

  function busca() {
    const q = normaliza(input.value);
    if (!q) {
      visibles = [];
      cierra();
      alElegir(null);
      return;
    }
    // Primero los que empiezan por lo escrito, luego los que lo contienen
    const empieza: Indexada[] = [];
    const contiene: Indexada[] = [];
    for (const o of indexadas) {
      const n = normaliza(o.nombre);
      if (n.startsWith(q)) empieza.push(o);
      else if (o.busqueda.includes(q)) contiene.push(o);
    }
    visibles = [...empieza, ...contiene].slice(0, 8);
    activa = visibles.length ? 0 : -1;
    pinta();
  }

  function elige(o: OpcionLugar) {
    input.value = o.nombre;
    input.dataset.clave = o.clave;
    cierra();
    alElegir(o);
  }

  input.addEventListener('input', () => {
    delete input.dataset.clave;
    busca();
  });
  input.addEventListener('focus', () => {
    if (input.value && !input.dataset.clave) busca();
  });
  input.addEventListener('blur', () => {
    // Si se sale sin elegir y hay sugerencias, se toma la primera
    if (!input.dataset.clave && visibles.length && input.value) elige(visibles[0]);
    else cierra();
  });
  input.addEventListener('keydown', (e) => {
    if (lista.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = visibles.length;
      activa = (activa + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
      pinta();
    } else if (e.key === 'Enter' && activa >= 0) {
      e.preventDefault();
      elige(visibles[activa]);
    } else if (e.key === 'Escape') cierra();
  });

  return (clave: string) => {
    const o = opciones.find((x) => x.clave === clave);
    if (o) elige(o);
  };
}

/** Lee el JSON de un <script type="application/json" id="…">. */
export function leeDatos<T>(id: string): T {
  return JSON.parse(document.getElementById(id)!.textContent || 'null') as T;
}

/** Número de un <input type="number">. NaN si está vacío o no es válido. */
export function numero(input: HTMLInputElement | null): number {
  if (!input || input.value.trim() === '') return NaN;
  return Number(input.value);
}
