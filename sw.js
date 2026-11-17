/* Service worker do audiobook.
   Troque o número de CACHE a cada publicação para os aparelhos pegarem a versão nova. */
const CACHE = 'pauling-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icones/icone.svg',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/icone-maskable-512.png',
  './icones/apple-touch-icon.png',
  './imagens/amauri_jr.jpg',
  './fontes/ibm-plex-mono-500.woff2',
  './fontes/ibm-plex-sans-300.woff2',
  './fontes/ibm-plex-sans-400.woff2',
  './fontes/ibm-plex-sans-500.woff2',
  './fontes/ibm-plex-sans-600.woff2',
  './fontes/space-grotesk-500.woff2',
  './fontes/space-grotesk-600.woff2',
  './fontes/space-grotesk-700.woff2',
  './audio/vfx/flip.mp3',
  './audio/vfx/transition_cube.mp3'
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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // pedidos parciais de áudio (avançar/voltar na narração) vão direto pra rede
  if (req.headers.has('range')) return;

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
