/* Service worker do audiobook.
   Troque o número de CACHE a cada publicação para os aparelhos pegarem a versão nova. */
const CACHE = 'pauling-v174';  // acompanhe APP_VERSAO do index.html (1.47 → v147)
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './three.min.js',
  './legendas.js',
  './icones/icone.svg',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/icone-maskable-512.png',
  './icones/apple-touch-icon.png',
  './imagens/amauri_jr.jpg',
  './imagens/rutherford_free.jpg',
  './imagens/Niels_Bohr_free.jpg',
  './imagens/Linus_Pauling_Free.png',
  './imagens/bohr_postulados.webp',
  './imagens/Erwin_Madelung.jpeg',
  './imagens/pauling_book.png',
  './imagens/pauling_book_page.png',
  './fontes/ibm-plex-mono-500.woff2',
  './fontes/ibm-plex-sans-300.woff2',
  './fontes/ibm-plex-sans-400.woff2',
  './fontes/ibm-plex-sans-500.woff2',
  './fontes/ibm-plex-sans-600.woff2',
  './fontes/space-grotesk-500.woff2',
  './fontes/space-grotesk-600.woff2',
  './fontes/space-grotesk-700.woff2',
  './audio/' + encodeURIComponent('audio_distribuição_0') + '.mp3',
  './audio/' + encodeURIComponent('audio_distribuição_1') + '.mp3',
  './audio/' + encodeURIComponent('audio_distribuição_2') + '.mp3',
  './audio/' + encodeURIComponent('audio_distribuição_3') + '.mp3',
  './audio/' + encodeURIComponent('audio_distribuição_4') + '.mp3',
  './audio/' + encodeURIComponent('audio_distribuição_5') + '.mp3',
  './audio/' + encodeURIComponent('audio_distribuição_5.1') + '.mp3',
  './audio/' + encodeURIComponent('audio_distribuição_5.2') + '.mp3',
  './audio/' + encodeURIComponent('audio_distribuição_6') + '.mp3',
  ...['7', '7.1', '7.2', '7.3', '7.4', '8', '8.1', '8.2', '8.3', '8.3A', '8.4', '8.5', '8.5A', '8.6', '8.6A', '8.7', '8.8', '8.9', '8.95', '9', '9.0', '9.1', '9.2', '9.3', '9.4', '9.4A', '9.4B', '9.5', '9.5A', '9.5B', '9.5C', '9.5D', '9.6'].map(n => './audio/' + encodeURIComponent('audio_distribuição_' + n) + '.mp3'),
  /* sons do quiz */
  ...['funfare','applause','error','Calmanaproximaacerta','exato!','muitobem','issomesmo!','excelente']
      .map(n => './audio/vfx/' + encodeURIComponent(n) + '.mp3'),
  './audio/vfx/right.mp3',
  './audio/vfx/flip.mp3',
  './audio/vfx/transition_cube.mp3',
  './audio/vfx/' + encodeURIComponent('typing sound') + '.mp3',
  './audio/vfx/electron_jumping.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* O player de áudio pede o arquivo em pedaços ("Range"). Aqui o arquivo inteiro
   vem do cache (ou da rede, e é guardado) e devolvemos só o pedaço pedido. */
async function respostaParcial(req){
  const cache = await caches.open(CACHE);
  let resp = await cache.match(req.url);
  if (!resp){
    try {
      const rede = await fetch(req.url);
      if (!rede.ok) return rede;
      await cache.put(req.url, rede.clone());
      resp = rede;
    } catch(e){ return Response.error(); }
  }
  const buf = await resp.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  const total = buf.byteLength;
  const ini = m && m[1] ? +m[1] : 0;
  const fim = m && m[2] ? Math.min(+m[2], total - 1) : total - 1;
  return new Response(buf.slice(ini, fim + 1), {
    status: 206,
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${ini}-${fim}/${total}`,
      'Content-Length': String(fim - ini + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.headers.has('range')){
    e.respondWith(respostaParcial(req));
    return;
  }

  // a página vem sempre da rede quando há internet → mudanças aparecem na hora
  if (req.mode === 'navigate'){
    e.respondWith(
      fetch(req.url, { cache: 'reload' }).then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copia));
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // o resto (imagens, fontes, áudios) sai do cache e é guardado na primeira vez
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      if (resp && resp.status === 200){
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
      }
      return resp;
    }))
  );
});
