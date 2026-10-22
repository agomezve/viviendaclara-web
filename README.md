# ViviendaClara

Qué casa te puedes permitir, dónde y cuánto cuesta de verdad, con datos oficiales.
https://viviendaclara.aarongomezvera.es

- **Stack:** Astro 7 + Tailwind 4, salida estática en GitHub Pages (`.github/workflows/deploy.yml`).
- **Datos oficiales** (`src/data/*.json`):
  - Compra: valor tasado del Ministerio de Vivienda (trimestral).
  - Alquiler: SERPAVI (Hacienda, anual). Renta: Atlas de Renta del INE.
  - Se regeneran a mano con `scripts/datos/descargar_fuentes.sh` y `python3 scripts/datos/actualizar_datos.py`.
  - Euríbor: `scripts/euribor.mjs`, se ejecuta en cada `prebuild` (el workflow reconstruye cada lunes).
  - Impuestos (`impuestos.json`) y ayudas (`ayudas.json`): copiados de Hacienda y del BOE (RD 326/2026). Revisar cada año.
  - Enlaces a portales (`portales.json`): slugs de Idealista y Fotocasa por municipio y provincia.
- **Páginas:** buscador en portada, 10 herramientas, 306 municipios (`/vivienda/<slug>`), 52 provincias
  (`/provincia/<slug>`), `/precios`, `/esfuerzo` y páginas legales.
- **Cálculos:** `src/lib/calculos.ts` (funciones puras, compartidas entre build y navegador).

## Antes de publicar

```bash
npm run build
npm run check:links
npx astro check
```
