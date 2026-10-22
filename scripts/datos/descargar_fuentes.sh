#!/bin/sh
# Ruta: scripts/datos/descargar_fuentes.sh
# Descarga las fuentes oficiales a una carpeta temporal (no se suben al repositorio: pesan cientos de MB).
#   sh scripts/datos/descargar_fuentes.sh /ruta/temporal
# Si el ministerio publica un SERPAVI nuevo, cambia la URL y AÑO_ALQUILER en actualizar_datos.py.
set -e
D="${1:?Indica la carpeta de destino}"
mkdir -p "$D"
curl -fL -o "$D/vt_libre.xls" "https://apps.fomento.gob.es/BoletinOnline2/sedal/35101000.XLS"
curl -fL -o "$D/vt_mun.xls" "https://apps.fomento.gob.es/BoletinOnline2/sedal/35103500.XLS"
curl -fL -o "$D/serpavi.xlsx" "https://cdn.mivau.gob.es/portal-web-mivau/vivienda/serpavi/2026-03_09_bd_SERPAVI_2011-2024%20-%20DEFINITIVO%20WEB_v2.xlsx"
# Renta por hogar (INE, tabla 30824): el CSV completo pesa ~400 MB; se queda solo con el nivel municipal de 2024.
curl -fL "https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/30824.csv" \
  | tr -d "\r" \
  | awk -F';' '$2=="" && $3=="" && $5=="2024"' > "$D/renta2024.csv"
echo "Fuentes descargadas en $D"
