const CACHE_NAME = 'datacard-ciet-mod-cache-v1'; // Changez le nom du cache si la structure change
const urlsToCache = [
    '.',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap',
    // Ajoutez ici les URLs exactes des fichiers woff2 si vous les connaissez et voulez les cacher agressivement
    // Exemple (à vérifier dans l'onglet Network de votre navigateur):
    'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WRhyzbi.woff2',
    'https://fonts.gstatic.com/s/montserrat/v25/JTURjIg1_i6t8kCHKm45_dJE3gnD_g.woff2'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'}))); // Force reload from network
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Servir depuis le cache
                }
                // Important: Cloner la requête. Une requête est un flux et ne peut être consommée qu'une fois.
                // Il nous faut la cloner pour pouvoir l'utiliser à la fois par le cache et par le navigateur.
                let fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function(response) {
                        // Vérifier si nous avons reçu une réponse valide
                        if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') { // basic pour same-origin, cors pour les polices
                            return response;
                        }

                        // Important: Cloner la réponse. Une réponse est un flux et ne peut être consommée qu'une fois.
                        // Il nous faut la cloner pour pouvoir l'utiliser à la fois par le cache et par le navigateur.
                        let responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});