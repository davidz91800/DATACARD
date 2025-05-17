// sw.js
// CHANGEZ CE NOM SI VOUS MODIFIEZ urlsToCache OU LE SW
const CACHE_NAME = 'cietDatacardFull_v5-flat-cache-final-holdsUpdate'; // Nom de cache mis à jour
const urlsToCache = [
    // Fichiers principaux
    './', 
    './index.html',
    './manifest.json',
    './favicon.ico',

    // Icônes
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',

    // Fichiers CSS
    './base.css',
    './layout.css',
    './bloc-core.css',
    './bloc-positions.css',
    './bloc-ui.css',
    './tables.css',
    './global-ui.css',
    './resize.css',
    './print.css',

    // Fichiers JavaScript
    './app.js',
    './config.js',
    './utils.js',
    './storageManager.js',
    './dataManager.js',
    './importExport.js',
    './blocManager.js',
    './resizeManager.js',
    './uiInteractions.js',

    // Fichiers HTML des templates de blocs
    './msnObjectiveR.html',
    './domesticsR.html',
    './supportR.html',
    './comladderR.html',
    './timelineR.html',
    './externalContractsR.html',
    './elementPackageContractsR.html',
    './tacticsHeaderR.html',
    './tacticsHold1R.html',
    './tacticsHold2R.html',
    './tacticsHold3R.html', // AJOUTÉ
    // './tacticsJoinPackageR.html', // SUPPRIMÉ
    './tacticsIngressR.html',
    './targetsDzOneR.html',
    './whatIfsSafetyR.html',
    './missionCodewordsV.html',
    './generalCodewordsV.html',
    
    'https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap',
];

// ... (le reste du fichier sw.js reste inchangé)
self.addEventListener('install', event => {
    console.log('SW: Evento INSTALL disparado (Cache:', CACHE_NAME, ')');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Cache aberto:', CACHE_NAME);
                console.log('SW: Tentando cachear urls iniciais:', urlsToCache.length, 'items.');
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('SW: Todos os arquivos em urlsToCache foram cacheados com sucesso!');
                    })
                    .catch(error => {
                        console.error('SW: Falha em cache.addAll() pour le cache', CACHE_NAME, ':', error);
                        urlsToCache.forEach(url => {
                            const request = new Request(url, { mode: 'no-cors' }); 
                            fetch(request)
                                .then(res => {
                                    if (!res.ok && res.status !== 0) { 
                                        console.error(`SW: Falha ao buscar ${url} durante cache.addAll - Status: ${res.status} ${res.statusText}`);
                                    } else if (res.status === 0) {
                                    }
                                })
                                .catch(err => console.error(`SW: Erro de rede ao buscar ${url} durante cache.addAll:`, err));
                        });
                        return Promise.reject(error);
                    });
            })
            .catch(error => {
                console.error('SW: Falha em caches.open() pour le cache', CACHE_NAME, ':', error);
                return Promise.reject(error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('SW: Evento ACTIVATE disparado (Cache actuel:', CACHE_NAME, ')');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Limpando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('SW: Caches antigos limpos, reivindicando clientes.');
            return self.clients.claim(); 
        }).catch(error => {
            console.error('SW: Erro durante a ativação (limpeza de cache ou reivindicação de clientes):', error);
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return; 
    }
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(
                    networkResponse => {
                        if (networkResponse && networkResponse.status === 200 &&
                            !event.request.url.startsWith('chrome-extension://') &&
                            !event.request.url.startsWith('moz-extension://') &&
                            event.request.url.startsWith('http')) { 
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch(cacheError => {
                                    console.warn('SW: Falha ao colocar no cache dinâmico:', event.request.url, cacheError);
                                });
                        }
                        return networkResponse;
                    }
                ).catch(error => {
                    console.warn('SW: Falha na requisição de rede E não encontrado no cache:', event.request.url, error);
                });
            })
    );
});