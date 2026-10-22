// Ruta: src/data/guias.ts
// Lista de guías: el orden es el de /guias. `fecha` = publicación; `revisada` = última revisión de datos.
export interface GuiaMeta {
  slug: string;
  titulo: string;
  /** Título SEO (≤ 60 caracteres). */
  tituloSeo: string;
  descripcion: string;
  resumen: string;
  fecha: string;
  revisada?: string;
}

export const GUIAS: GuiaMeta[] = [
  {
    slug: 'alquilar-habitacion',
    titulo: 'Cómo alquilar una habitación sin llevarte sustos',
    tituloSeo: 'Alquilar una habitación: qué mirar antes de pagar',
    descripcion: 'Qué comprobar antes de alquilar una habitación en un piso compartido: contrato, fianza, gastos, empadronamiento, ayudas y señales de estafa.',
    resumen: 'Contrato, fianza, gastos, empadronamiento y las ayudas que existen para habitaciones.',
    fecha: '2026-10-23',
  },
  {
    slug: 'ayuda-alquiler-jovenes',
    titulo: 'Ayuda al alquiler para jóvenes 2026: requisitos y cuánto dan',
    tituloSeo: 'Ayuda al alquiler para jóvenes 2026: requisitos',
    descripcion: 'Requisitos de la ayuda estatal al alquiler para menores de 36 años del Plan de Vivienda 2026-2030: ingresos, alquiler máximo, cuantía y cómo pedirla.',
    resumen: 'Quién puede pedirla, el alquiler máximo y cuánto se cobra, según el Real Decreto 326/2026.',
    fecha: '2026-10-23',
  },
  {
    slug: 'aval-ico-hipoteca-jovenes',
    titulo: 'Aval ICO: la hipoteca de hasta el 100 % para jóvenes y familias',
    tituloSeo: 'Aval ICO hipoteca 100 %: requisitos y cómo pedirlo',
    descripcion: 'Cómo funciona el aval del ICO para comprar la primera vivienda: quién puede pedirlo, límites de precio y patrimonio y qué pagas igualmente.',
    resumen: 'Qué cubre el aval del Estado, quién puede pedirlo y el dinero que necesitas igualmente.',
    fecha: '2026-10-23',
  },
  {
    slug: 'gastos-comprar-casa',
    titulo: 'Gastos de comprar una casa en 2026: impuestos por comunidad',
    tituloSeo: 'Gastos de comprar casa 2026: impuestos por comunidad',
    descripcion: 'Cuánto dinero necesitas además de la entrada para comprar una vivienda en 2026: ITP, IVA y AJD de cada comunidad, notaría, registro y tasación.',
    resumen: 'ITP, IVA y AJD de cada comunidad y el resto de gastos que no te cubre la hipoteca.',
    fecha: '2026-10-23',
  },
  {
    slug: 'fianza-alquiler',
    titulo: 'La fianza del alquiler: cuánto te pueden pedir y cómo recuperarla',
    tituloSeo: 'Fianza del alquiler: cuánto pueden pedirte y devolución',
    descripcion: 'Lo que dice la Ley de Arrendamientos Urbanos sobre la fianza: 1 mes de renta, garantías extra de hasta 2 meses, depósito y plazo de devolución.',
    resumen: '1 mes de fianza, hasta 2 de garantía extra y qué pasa si no te la devuelven.',
    fecha: '2026-10-23',
  },
  {
    slug: 'donde-es-mas-barato-alquilar',
    titulo: 'Dónde es más barato alquilar en España, según Hacienda',
    tituloSeo: 'Dónde es más barato alquilar en España (datos oficiales)',
    descripcion: 'Ranking de los municipios más baratos y más caros para alquilar un piso, con la mediana de los contratos declarados a Hacienda y el esfuerzo que suponen.',
    resumen: 'Los municipios más baratos y más caros con los contratos reales declarados a Hacienda.',
    fecha: '2026-10-23',
  },
];

export const guia = (slug: string) => GUIAS.find((g) => g.slug === slug)!;
