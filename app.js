// app.js
// Point d'entrée principal de l'application Datacard CIET.
// Initialise les modules et coordonne les fonctionnalités.

import { renderAllBlocs } from './blocManager.js';
import { initializeGlobalEventListeners, setupPageToggle } from './uiInteractions.js';
import { loadFromLocalStorage } from './storageManager.js';
import { registerServiceWorker } from './utils.js';

/**
 * Fonction principale d'initialisation de l'application.
 */
async function main() {
    // 1. Enregistrer le Service Worker (si applicable)
    registerServiceWorker();

    // 2. Afficher les blocs HTML à partir des templates
    // renderAllBlocs va aussi appeler initializeBlocSpecificInteractions et initializeResizeHandles pour chaque bloc.
    try {
        await renderAllBlocs();
    } catch (error) {
        console.error("Erreur critique lors du rendu initial des blocs:", error);
        // Afficher un message à l'utilisateur ici si nécessaire
        return; // Arrêter l'initialisation si les blocs ne peuvent pas être rendus
    }
    
    // 3. Mettre en place les écouteurs d'événements globaux
    // (impression, export/import global, sauvegarde/chargement local, etc.)
    initializeGlobalEventListeners();

    // 4. Configurer la bascule d'affichage Recto/Verso
    setupPageToggle();

    // 5. Charger les données précédemment sauvegardées depuis LocalStorage (si existantes)
    // Cela doit se faire APRÈS que les blocs et leurs interactions sont en place
    // pour que les données soient correctement appliquées et que les listeners (ex: autosave) soient actifs.
    loadFromLocalStorage();

    console.log("Application Datacard CIET initialisée.");
}

// Lancer l'application lorsque le DOM est prêt.
// L'utilisation de type="module" pour app.js garantit qu'il s'exécute après le parsing du HTML.
// Mais DOMContentLoaded est une sécurité supplémentaire pour s'assurer que tout est là.
document.addEventListener('DOMContentLoaded', main);