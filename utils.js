// --- FONCTIONS UTILITAIRES ---

/**
 * Convertit des millimètres en pixels.
 * @param {number} mm - Valeur en millimètres.
 * @returns {number} Valeur en pixels.
 */
export function mmToPx(mm) {
    return (mm / 25.4) * 96; // Supposant 96 DPI
}

/**
 * Convertit des pixels en millimètres.
 * @param {number} px - Valeur en pixels.
 * @returns {number} Valeur en millimètres.
 */
export function pxToMm(px) {
    return (px / 96) * 25.4; // Supposant 96 DPI
}

/**
 * Déclenche le téléchargement d'un fichier JSON.
 * @param {string} jsonData - Les données JSON sous forme de chaîne.
 * @param {string} filename - Le nom de fichier souhaité.
 */
export function downloadJson(jsonData, filename) {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Affiche une notification temporaire à l'utilisateur.
 * @param {string} message - Le message à afficher.
 * @param {number} [duration=2500] - La durée d'affichage en millisecondes.
 */
export function showNotification(message, duration = 2500) {
    const area = document.getElementById('notification-area');
    if (!area) {
        console.warn("Zone de notification 'notification-area' non trouvée.");
        return;
    }
    area.textContent = message;
    area.classList.add('show');
    setTimeout(() => area.classList.remove('show'), duration);
}

/**
 * Enregistre le Service Worker.
 */
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js') // sw.js à la racine
                .then(registration => {
                    console.log('Service Worker: Registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker: Registration Failed:', error);
                });
        });
    } else {
        console.log('Service Worker not supported by this browser.');
    }
}