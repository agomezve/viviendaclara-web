# Ruta: scripts/datos/territorio.py
# Provincias y comunidades autónomas con sus códigos INE, nombres para mostrar y slugs de URL.
# Es la tabla fija que une las tres fuentes (Ministerio de Vivienda, SERPAVI e INE).

CCAA = {
    "01": "Andalucía",
    "02": "Aragón",
    "03": "Asturias",
    "04": "Illes Balears",
    "05": "Canarias",
    "06": "Cantabria",
    "07": "Castilla y León",
    "08": "Castilla-La Mancha",
    "09": "Cataluña",
    "10": "Comunitat Valenciana",
    "11": "Extremadura",
    "12": "Galicia",
    "13": "Comunidad de Madrid",
    "14": "Región de Murcia",
    "15": "Navarra",
    "16": "País Vasco",
    "17": "La Rioja",
    "18": "Ceuta",
    "19": "Melilla",
}

# código INE de provincia: (nombre para mostrar, slug, código de comunidad)
PROVINCIAS = {
    "01": ("Álava", "alava", "16"),
    "02": ("Albacete", "albacete", "08"),
    "03": ("Alicante", "alicante", "10"),
    "04": ("Almería", "almeria", "01"),
    "05": ("Ávila", "avila", "07"),
    "06": ("Badajoz", "badajoz", "11"),
    "07": ("Illes Balears", "illes-balears", "04"),
    "08": ("Barcelona", "barcelona", "09"),
    "09": ("Burgos", "burgos", "07"),
    "10": ("Cáceres", "caceres", "11"),
    "11": ("Cádiz", "cadiz", "01"),
    "12": ("Castellón", "castellon", "10"),
    "13": ("Ciudad Real", "ciudad-real", "08"),
    "14": ("Córdoba", "cordoba", "01"),
    "15": ("A Coruña", "a-coruna", "12"),
    "16": ("Cuenca", "cuenca", "08"),
    "17": ("Girona", "girona", "09"),
    "18": ("Granada", "granada", "01"),
    "19": ("Guadalajara", "guadalajara", "08"),
    "20": ("Gipuzkoa", "gipuzkoa", "16"),
    "21": ("Huelva", "huelva", "01"),
    "22": ("Huesca", "huesca", "02"),
    "23": ("Jaén", "jaen", "01"),
    "24": ("León", "leon", "07"),
    "25": ("Lleida", "lleida", "09"),
    "26": ("La Rioja", "la-rioja", "17"),
    "27": ("Lugo", "lugo", "12"),
    "28": ("Madrid", "madrid", "13"),
    "29": ("Málaga", "malaga", "01"),
    "30": ("Murcia", "murcia", "14"),
    "31": ("Navarra", "navarra", "15"),
    "32": ("Ourense", "ourense", "12"),
    "33": ("Asturias", "asturias", "03"),
    "34": ("Palencia", "palencia", "07"),
    "35": ("Las Palmas", "las-palmas", "05"),
    "36": ("Pontevedra", "pontevedra", "12"),
    "37": ("Salamanca", "salamanca", "07"),
    "38": ("Santa Cruz de Tenerife", "santa-cruz-de-tenerife", "05"),
    "39": ("Cantabria", "cantabria", "06"),
    "40": ("Segovia", "segovia", "07"),
    "41": ("Sevilla", "sevilla", "01"),
    "42": ("Soria", "soria", "07"),
    "43": ("Tarragona", "tarragona", "09"),
    "44": ("Teruel", "teruel", "02"),
    "45": ("Toledo", "toledo", "08"),
    "46": ("Valencia", "valencia", "10"),
    "47": ("Valladolid", "valladolid", "07"),
    "48": ("Bizkaia", "bizkaia", "16"),
    "49": ("Zamora", "zamora", "07"),
    "50": ("Zaragoza", "zaragoza", "02"),
    "51": ("Ceuta", "ceuta", "18"),
    "52": ("Melilla", "melilla", "19"),
}

# Nombre de la fila del Excel de valor tasado (Ministerio de Vivienda) → código de provincia.
# Las comunidades uniprovinciales solo tienen la fila de la comunidad.
VALOR_TASADO_PROVINCIA = {
    "almeria": "04", "cadiz": "11", "cordoba": "14", "granada": "18", "huelva": "21", "jaen": "23",
    "malaga": "29", "sevilla": "41", "huesca": "22", "teruel": "44", "zaragoza": "50",
    "asturias (principado de )": "33", "asturias (principado de)": "33", "balears (illes)": "07",
    "palmas (las)": "35", "santa cruz de tenerife": "38", "cantabria": "39", "avila": "05",
    "burgos": "09", "leon": "24", "palencia": "34", "salamanca": "37", "segovia": "40", "soria": "42",
    "valladolid": "47", "zamora": "49", "albacete": "02", "ciudad real": "13", "cuenca": "16",
    "guadalajara": "19", "toledo": "45", "barcelona": "08", "girona": "17", "lleida": "25",
    "tarragona": "43", "alicante/alacant": "03", "castellon/castello": "12", "valencia/valencia": "46",
    "badajoz": "06", "caceres": "10", "coruna (a)": "15", "lugo": "27", "ourense": "32",
    "pontevedra": "36", "madrid (comunidad de)": "28", "murcia (region de)": "30",
    "navarra (comunidad foral de)": "31", "araba/alava": "01", "gipuzkoa": "20", "bizkaia": "48",
    "rioja (la)": "26", "ceuta": "51", "melilla": "52",
}

VALOR_TASADO_CCAA = {
    "andalucia": "01", "aragon": "02", "asturias (principado de )": "03", "asturias (principado de)": "03",
    "balears (illes)": "04", "canarias": "05", "cantabria": "06", "castilla y leon": "07",
    "castilla-la mancha": "08", "cataluna": "09", "comunidad valenciana": "10", "extremadura": "11",
    "galicia": "12", "madrid (comunidad de)": "13", "murcia (region de)": "14",
    "navarra (comunidad foral de)": "15", "pais vasco": "16", "rioja (la)": "17",
}

# Nombres de provincia tal y como vienen (con erratas) en la hoja municipal del valor tasado.
VALOR_TASADO_MUNICIPAL_PROVINCIA = {
    "asturias": "33", "illes balears": "07", "alicante": "03", "cantabria": "39", "la coruna": "15",
    "la rioja": "26", "las palmas": "35", "murcia": "30", "navarra": "31", "madrid": "28",
    "santa cruz de": "38", "tenerife": "38", "valencia": "46", "valladodid": "47",
}

# Municipios que el cruce automático no puede resolver: nombre del ministerio → código INE.
MUNICIPIOS_FIJOS = {
    "vitoria": "01059",
    "mahon": "07032",
    "palma de mallorca": "07040",
    "san cristobal laguna": "38023",
}

# Nombre para mostrar cuando el de la estadística no es el que usa la gente.
NOMBRES_MUNICIPIO = {
    "07032": "Maó-Mahón",
}
