// Ruta: src/pages/ads.txt.ts
// Genera ads.txt a partir de ADSENSE.clientId. Sin client id, el archivo queda solo con un comentario.
import type { APIRoute } from 'astro';
import { ADSENSE } from '../config/site';

export const GET: APIRoute = () => {
  const clientId = ADSENSE.clientId.trim();
  const publisherId = clientId.replace(/^ca-/, '');
  const body = /^pub-\d{16}$/.test(publisherId)
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : '# Pendiente: configura ADSENSE.clientId en src/config/site.ts\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
