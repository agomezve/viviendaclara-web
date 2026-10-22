# Ruta: scripts/datos/actualizar_datos.py
# Cruza las fuentes oficiales y genera los JSON que usa la web.
#
#   python3 scripts/datos/actualizar_datos.py --fuentes <carpeta>
#
# La carpeta de fuentes debe tener (se descargan a mano o con descargar_fuentes.sh):
#   vt_libre.xls      Valor tasado de vivienda libre por provincia y CCAA (MIVAU, tabla 35101000)
#   vt_mun.xls        Valor tasado por municipio >25.000 hab. (MIVAU, tabla 35103500)
#   serpavi.xlsx      Sistema Estatal de Referencia del Precio del Alquiler de Vivienda (MIVAU)
#   renta2024.csv     Renta neta media por hogar 2024 por municipio (INE, Atlas de Distribución de Renta, tabla 30824)
#
# Necesita: pip install xlrd openpyxl

import argparse
import csv
import difflib
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

import openpyxl
import xlrd

sys.path.insert(0, str(Path(__file__).parent))
from territorio import (  # noqa: E402
    CCAA, MUNICIPIOS_FIJOS, NOMBRES_MUNICIPIO, PROVINCIAS, VALOR_TASADO_CCAA,
    VALOR_TASADO_MUNICIPAL_PROVINCIA, VALOR_TASADO_PROVINCIA,
)

RAIZ = Path(__file__).resolve().parents[2]
SALIDA_SRC = RAIZ / "src" / "data"
SALIDA_PUBLIC = RAIZ / "public" / "datos"

AÑO_ALQUILER = "24"  # sufijo de las columnas de SERPAVI (último año publicado: 2024)
HOJA_MUNICIPAL = "T2A2026"
TRIMESTRE_COMPRA = "2.º trimestre de 2026"

ARTICULOS = {"el", "la", "los", "las", "l", "a", "o", "os", "as", "es", "sa", "ses", "s"}


def sin_acentos(texto):
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


def normaliza(texto):
    return re.sub(r"\s+", " ", sin_acentos(str(texto)).lower()).strip()


def slugify(texto):
    t = normaliza(texto).replace("'", "-")
    t = re.sub(r"[^a-z0-9]+", "-", t)
    return t.strip("-")


def claves(nombre):
    """Formas comparables de un nombre: sin acentos, sin artículos y por cada alternativa con barra."""
    resultado = set()
    for parte in str(nombre).split("/"):
        t = normaliza(parte)
        t = re.sub(r"\(([^)]*)\)?", r" \1 ", t)  # «Ejido (El)» o «(La» truncado
        t = t.replace(",", " ").replace("'", " ").replace("-", " ")
        palabras = [p for p in re.split(r"[^a-z0-9]+", t) if p]
        while palabras and palabras[0] in ARTICULOS:
            palabras = palabras[1:]
        while palabras and palabras[-1] in ARTICULOS:
            palabras = palabras[:-1]
        if palabras:
            resultado.add(" ".join(palabras))
    return resultado


def nombre_legible(nombre_ine, preferido=None):
    """«Ejido, El» → «El Ejido»; con barra, se queda con la forma castellana del ministerio si coincide."""
    partes = [p.strip() for p in nombre_ine.split("/")]
    elegido = partes[0]
    if preferido and len(partes) > 1:
        claves_pref = claves(preferido)
        for p in partes:
            if claves(p) & claves_pref:
                elegido = p
                break
    m = re.match(r"^(.*), (el|la|los|las|l'|a|o|os|as|es|sa|ses)$", elegido, re.I)
    if m:
        art = m.group(2).capitalize()
        elegido = f"{art}{m.group(1)}" if art.endswith("'") else f"{art} {m.group(1)}"
    return elegido


def numero(valor):
    if valor is None:
        return None
    if isinstance(valor, (int, float)):
        return float(valor)
    s = str(valor).strip()
    if not s or s.lower().startswith("n.r") or s in {"-", ".."}:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def r1(x):
    return None if x is None else round(x, 1)


def r2(x):
    return None if x is None else round(x, 2)


def r0(x):
    return None if x is None else int(round(x))


# ---------- Lectura de fuentes ----------

def lee_valor_tasado_provincias(ruta):
    libro = xlrd.open_workbook(ruta)
    hoja = libro.sheet_by_index(libro.nsheets - 1)
    cabecera_años = hoja.row_values(11)
    cabecera_trim = hoja.row_values(13)
    columnas = []  # (índice, etiqueta «2026-T2»)
    año = None
    for i in range(2, len(cabecera_trim)):
        a = str(cabecera_años[i]).strip()
        if a.startswith("Año"):
            año = a.split()[-1]
        t = str(cabecera_trim[i]).strip()
        if año and t and t[0].isdigit():
            columnas.append((i, f"{año}-T{t[0]}"))
    provincias, ccaa, nacional = {}, {}, None
    for r in range(14, hoja.nrows):
        fila = hoja.row_values(r)
        nombre = normaliza(fila[1])
        if not nombre or nombre.startswith("n.r"):
            continue
        serie = {etq: r1(numero(fila[i])) for i, etq in columnas}
        dato = {
            "m2": serie[columnas[-1][1]],
            "variacionAnual": r1(numero(fila[columnas[-1][0] + 2])),
            "serie": serie,
        }
        if nombre == "total nacional":
            nacional = dato
            continue
        if nombre in VALOR_TASADO_CCAA:
            ccaa[VALOR_TASADO_CCAA[nombre]] = dato
        if nombre in VALOR_TASADO_PROVINCIA:
            provincias[VALOR_TASADO_PROVINCIA[nombre]] = dato
    faltan = sorted(set(PROVINCIAS) - set(provincias))
    if faltan:
        sys.exit(f"Faltan provincias en el valor tasado: {faltan}")
    return provincias, ccaa, nacional, columnas[-1][1]


def lee_valor_tasado_municipios(ruta):
    hoja = xlrd.open_workbook(ruta).sheet_by_name(HOJA_MUNICIPAL)
    filas = []
    provincia = None
    for r in range(17, hoja.nrows):
        fila = hoja.row_values(r)
        if str(fila[1]).strip():
            provincia = str(fila[1]).strip()
        municipio = str(fila[2]).strip()
        if not municipio:
            continue
        filas.append({
            "provincia": provincia,
            "municipio": municipio,
            "nueva": numero(fila[3]),
            "usada": numero(fila[4]),
            "total": numero(fila[5]),
            "tasaciones": numero(fila[7]),
        })
    return filas


def lee_serpavi(ruta):
    libro = openpyxl.load_workbook(ruta, read_only=True)
    a = AÑO_ALQUILER

    def extrae(fila, idx):
        def v(col):
            i = idx.get(f"{col}_{a}")
            return None if i is None else numero(fila[i])
        return {
            "m2": r2(v("ALQM2_LV_M_VC")),
            "m2P25": r2(v("ALQM2_LV_25_VC")),
            "m2P75": r2(v("ALQM2_LV_75_VC")),
            "mes": r0(v("ALQTBID12_M_VC")),
            "mesP25": r0(v("ALQTBID12_25_VC")),
            "mesP75": r0(v("ALQTBID12_75_VC")),
            "superficie": r0(v("SLVM2_M_VC")),
            "viviendas": r0(v("BI_ALVHEPCO_TVC")),
        }

    def hoja(nombre, col_codigo, col_nombre):
        filas = libro[nombre].iter_rows(values_only=True)
        cab = next(filas)
        idx = {c: i for i, c in enumerate(cab) if c}
        datos = {}
        for fila in filas:
            codigo = fila[idx[col_codigo]]
            if not codigo:
                continue
            datos[str(codigo).zfill(len(str(codigo)))] = {"nombre": fila[idx[col_nombre]], **extrae(fila, idx), "_fila": fila, "_idx": idx}
        return datos

    ccaa = hoja("CCAA", "CCAA", "LITCCAA")
    provincias = hoja("Provincias", "CPRO", "LITPRO")
    municipios = hoja("Municipios", "CUMUN", "NMUN")
    for grupo in (ccaa, provincias, municipios):
        for d in grupo.values():
            d.pop("_fila"), d.pop("_idx")
    return ccaa, provincias, municipios


def lee_renta(ruta):
    renta = {}
    with open(ruta, encoding="utf-8") as f:
        for fila in csv.reader(f, delimiter=";"):
            if len(fila) < 6 or fila[1] or fila[2]:
                continue
            if fila[3] != "Renta neta media por hogar":
                continue
            codigo = fila[0][:5]
            valor = fila[5].replace(".", "").replace(",", ".")
            if codigo.isdigit() and valor:
                renta[codigo] = float(valor)
    return renta


# ---------- Cruce de nombres ----------

def empareja(filas_vt, municipios_serpavi):
    indice = {}
    por_provincia = {}
    for codigo, d in municipios_serpavi.items():
        for k in claves(d["nombre"]):
            indice.setdefault(k, []).append(codigo)
            por_provincia.setdefault(codigo[:2], {})[k] = codigo
    nombre_prov = {normaliza(k): v for k, v in VALOR_TASADO_PROVINCIA.items()}
    nombre_prov.update({normaliza(nombre): c for c, (nombre, _, _) in PROVINCIAS.items()})
    nombre_prov.update(VALOR_TASADO_MUNICIPAL_PROVINCIA)
    emparejados, dudosos, sin_pareja = [], [], []
    vistos = set()
    for fila in filas_vt:
        prov = nombre_prov.get(normaliza(fila["provincia"] or ""))
        candidatos = set()
        for k in claves(fila["municipio"]):
            candidatos.update(indice.get(k, []))
        if len(candidatos) > 1 and prov:
            candidatos = {c for c in candidatos if c.startswith(prov)} or candidatos
        codigo = MUNICIPIOS_FIJOS.get(normaliza(fila["municipio"]))
        if codigo:
            candidatos = set()
        elif len(candidatos) == 1:
            codigo = candidatos.pop()
        if not codigo and not candidatos:
            # Nombres incompletos («Puerto de Santa María» sin «El»): parecido dentro de la provincia y, si no, en toda España
            for ambito in ([por_provincia.get(prov, {})] if prov else []) + [{k: v[0] for k, v in indice.items() if len(v) == 1}]:
                for k in claves(fila["municipio"]):
                    parecido = difflib.get_close_matches(k, list(ambito), n=1, cutoff=0.88)
                    if parecido:
                        codigo = ambito[parecido[0]]
                        dudosos.append(f"{fila['municipio']} → {municipios_serpavi[codigo]['nombre']}")
                        break
                if codigo:
                    break
        if not codigo:
            sin_pareja.append(f"{fila['provincia']} / {fila['municipio']} ({len(candidatos)} candidatos)")
            continue
        if codigo in vistos:
            continue
        vistos.add(codigo)
        emparejados.append((codigo, fila))
    return emparejados, dudosos, sin_pareja


# ---------- Salida ----------

def esfuerzo_compra(m2, renta, superficie=80):
    if not m2 or not renta:
        return None
    return round(m2 * superficie / renta, 1)


def esfuerzo_alquiler(mes, renta):
    if not mes or not renta:
        return None
    return round(mes * 12 / renta * 100, 1)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--fuentes", required=True, type=Path)
    args = p.parse_args()
    F = args.fuentes

    vt_prov, vt_ccaa, vt_nacional, ultimo = lee_valor_tasado_provincias(F / "vt_libre.xls")
    vt_mun = lee_valor_tasado_municipios(F / "vt_mun.xls")
    s_ccaa, s_prov, s_mun = lee_serpavi(F / "serpavi.xlsx")
    renta = lee_renta(F / "renta2024.csv")

    emparejados, dudosos, sin_pareja = empareja(vt_mun, s_mun)
    print(f"Municipios del valor tasado: {len(vt_mun)} · emparejados: {len(emparejados)}")
    for d in dudosos:
        print("  parecido:", d)
    for s in sin_pareja:
        print("  SIN PAREJA:", s)

    municipios = []
    slugs = {}
    for codigo, fila in emparejados:
        s = s_mun[codigo]
        cpro = codigo[:2]
        nombre_prov, slug_prov, cod_ccaa = PROVINCIAS[cpro]
        nombre = NOMBRES_MUNICIPIO.get(codigo) or nombre_legible(s["nombre"], fila["municipio"])
        slug = slugify(nombre)
        if slug in slugs:
            slug = f"{slug}-{slug_prov}"
        slugs[slug] = codigo
        alquiler = {k: v for k, v in s.items() if k != "nombre"}
        if alquiler["m2"] is None:
            alquiler = None
        r = renta.get(codigo)
        municipios.append({
            "ine": codigo,
            "nombre": nombre,
            "slug": slug,
            "provincia": cpro,
            "ccaa": cod_ccaa,
            "compra": {
                "m2": r1(fila["total"]),
                "m2Nueva": r1(fila["nueva"]),
                "m2Usada": r1(fila["usada"]),
                "tasaciones": r0(fila["tasaciones"]),
            },
            "alquiler": alquiler,
            "rentaHogar": r0(r),
            "esfuerzoCompraAnios": esfuerzo_compra(fila["total"], r),
            "esfuerzoAlquilerPct": esfuerzo_alquiler(alquiler and alquiler["mes"], r),
        })
    municipios.sort(key=lambda m: (m["provincia"], m["nombre"]))

    provincias = []
    for cpro, (nombre, slug, cod_ccaa) in PROVINCIAS.items():
        alq = {k: v for k, v in s_prov.get(cpro, {}).items() if k != "nombre"} or None
        if alq and alq["m2"] is None:
            alq = None
        provincias.append({
            "codigo": cpro,
            "nombre": nombre,
            "slug": slug,
            "ccaa": cod_ccaa,
            "compra": vt_prov[cpro],
            "alquiler": alq,
            "municipios": [m["slug"] for m in municipios if m["provincia"] == cpro],
        })

    comunidades = []
    for cod, nombre in CCAA.items():
        alq = {k: v for k, v in s_ccaa.get(cod, {}).items() if k != "nombre"} or None
        if alq and alq["m2"] is None:
            alq = None
        comunidades.append({
            "codigo": cod,
            "nombre": nombre,
            "compra": vt_ccaa.get(cod) or next((vt_prov[c] for c, (_, _, cc) in PROVINCIAS.items() if cc == cod), None),
            "alquiler": alq,
        })

    # Todos los municipios con alquiler de referencia (para «¿Te cobran de más?» y el autocompletado)
    alquiler_todos = []
    for codigo, s in sorted(s_mun.items()):
        if s["m2"] is None or codigo[:2] not in PROVINCIAS:
            continue
        alquiler_todos.append([
            codigo, NOMBRES_MUNICIPIO.get(codigo) or nombre_legible(s["nombre"]), s["m2"], s["m2P25"], s["m2P75"], s["mes"], s["superficie"], s["viviendas"],
        ])

    meta = {
        "actualizado": date.today().isoformat(),
        "compra": {
            "fuente": "Ministerio de Vivienda y Agenda Urbana · Valor tasado medio de vivienda libre",
            "periodo": TRIMESTRE_COMPRA,
            "ultimoTrimestre": ultimo,
            "nacional": vt_nacional,
            "url": "https://apps.fomento.gob.es/BoletinOnline2/?nivel=2&orden=35000000",
        },
        "alquiler": {
            "fuente": "Ministerio de Vivienda y Agenda Urbana · Sistema Estatal de Referencia del Precio del Alquiler de Vivienda (SERPAVI)",
            "periodo": f"20{AÑO_ALQUILER}",
            "url": "https://www.mivau.gob.es/vivienda/alquila-bien-es-tu-derecho/serpavi",
            "nota": "Mediana de los contratos de alquiler de pisos (vivienda colectiva) declarados a Hacienda.",
        },
        "renta": {
            "fuente": "INE · Atlas de Distribución de Renta de los Hogares",
            "periodo": "2024",
            "url": "https://www.ine.es/dynt3/inebase/index.htm?padre=12385",
        },
    }

    SALIDA_SRC.mkdir(parents=True, exist_ok=True)
    SALIDA_PUBLIC.mkdir(parents=True, exist_ok=True)

    def guarda(ruta, datos, compacto=False):
        with open(ruta, "w", encoding="utf-8") as f:
            if compacto:
                json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
            else:
                json.dump(datos, f, ensure_ascii=False, indent=1)
        print(f"  {ruta.relative_to(RAIZ)} ({ruta.stat().st_size // 1024} KB)")

    guarda(SALIDA_SRC / "municipios.json", municipios)
    guarda(SALIDA_SRC / "provincias.json", provincias)
    guarda(SALIDA_SRC / "comunidades.json", comunidades)
    guarda(SALIDA_SRC / "fuentes.json", meta)
    guarda(SALIDA_PUBLIC / "alquiler-municipios.json", alquiler_todos, compacto=True)


if __name__ == "__main__":
    main()
