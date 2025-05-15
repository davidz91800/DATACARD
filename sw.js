const CACHE_NAME = 'cietDatacardFull_v4-cache-final'; // CHANGEZ CE NOM SI VOUS MODIFIEZ urlsToCache OU LE SW
const urlsToCache = [
    './', // Cache la page d'accueil (index.html à la racine)
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './favicon.ico', // Si vous avez un favicon.ico à la racine
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    // Polices Google - elles seront mises en cache si accessibles lors de l'installation.
    // Pour un mode hors-ligne 100% garanti pour les polices, hébergez-les localement et ajoutez les chemins ici.
    'https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap',
    // Les fichiers .woff2 sont chargés par le CSS ci-dessus. Ils seront mis en cache par le navigateur via la stratégie de fetch,
    // mais pour une mise en cache agressive par le SW, vous devriez les lister explicitement si vous les hébergez localement.
    // Exemple si hébergées localement (chemins à adapter):
    // './fonts/montserrat-v25-latin-regular.woff2',
    // './fonts/montserrat-v25-latin-700.woff2',
];

// Événement d'installation : mise en cache des ressources de base de l'application
self.addEventListener('install', event => {
    console.log('SW: Evento INSTALL disparado');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Cache aberto:', CACHE_NAME);
                console.log('SW: Tentando cachear urls iniciais:', urlsToCache);
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('SW: Todos os arquivos em urlsToCache foram cacheados com sucesso!');
                    })
                    .catch(error => {
                        console.error('SW: Falha em cache.addAll():', error);
                        // Log pour aider à identifier quelle URL a causé l'échec
                        urlsToCache.forEach(url => {
                            fetch(new Request(url, { mode: 'no-cors' })) // mode no-cors pour les requêtes cross-origin comme les polices
                                .then(res => {
                                    if (!res.ok && res.status !== 0) { // status 0 pour les requêtes opaques réussies
                                        console.error(`SW: Falha ao buscar ${url} durante cache.addAll - Status: ${res.status}`);
                                    }
                                })
                                .catch(err => console.error(`SW: Erro de rede ao buscar ${url} durante cache.addAll:`, err));
                        });
                    });
            })
            .catch(error => {
                console.error('SW: Falha em caches.open():', error);
            })
    );
});

// Événement d'activation : nettoyage des anciens caches et prise de contrôle
self.addEventListener('activate', event => {
    console.log('SW: Evento ACTIVATE disparado');
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
            return self.clients.claim(); // Permet au SW de contrôler les clients immédiatement
        }).catch(error => {
            console.error('SW: Erro durante a ativação (limpeza de cache ou reivindicação de clientes):', error);
        })
    );
});

// Événement fetch : intercepter les requêtes réseau et servir depuis le cache si possible
self.addEventListener('fetch', event => {
    // console.log('SW: Evento FETCH para', event.request.url); // Peut être très verbeux, décommentez pour débogage
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // console.log('SW: Servindo do cache:', event.request.url);
                    return cachedResponse;
                }

                // console.log('SW: Buscando da rede:', event.request.url);
                return fetch(event.request).then(
                    networkResponse => {
                        // Optionnel : Mettre en cache dynamiquement les nouvelles requêtes réussies
                        // Utile si vous avez des ressources qui ne sont pas dans urlsToCache
                        // mais que vous voulez rendre disponibles hors ligne après leur premier chargement.
                        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                            // Ne pas mettre en cache toutes les requêtes (ex: API POST/PUT), seulement les GET valides.
                            // S'assurer que l'URL n'est pas une extension Chrome ou autre chose d'interne.
                            if (!event.request.url.startsWith('chrome-extension://')) {
                                const responseToCache = networkResponse.clone();
                                caches.open(CACHE_NAME) // Utiliser le même cache ou un cache dynamique séparé
                                    .then(cache => {
                                        // console.log('SW: Cacheando nova requisição:', event.request.url);
                                        cache.put(event.request, responseToCache);
                                    });
                            }
                        }
                        return networkResponse;
                    }
                ).catch(error => {
                    console.warn('SW: Falha na requisição de rede e não encontrado no cache:', event.request.url, error);
                    // Optionnel : Renvoyer une page hors-ligne personnalisée
                    // if (event.request.mode === 'navigate') { // Seulement pour les navigations de page
                    //     return caches.match('./offline.html'); // Assurez-vous que offline.html est dans urlsToCache
                    // }
                    // Pour les autres types de requêtes (images, scripts), laisser l'erreur se propager
                    // pour que l'application puisse la gérer ou afficher un état dégradé.
                });
            })
    );
});