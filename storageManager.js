import { LOCAL_STORAGE_KEY } from './config.js';
import { collectAllData, applyAllData } from './dataManager.js';
import { showNotification } from './utils.js';

/**
 * Sauvegarde toutes les données de la datacard dans le LocalStorage.
 */
export function saveToLocalStorage() {
    try {
        const data = collectAllData();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        // console.log("Data saved to LocalStorage."); // Peut être activé pour le débogage
    } catch (e) {
        console.error("Erreur de sauvegarde locale:", e);
        showNotification("Erreur de sauvegarde locale (quota dépassé ?).", 5000);
    }
}

/**
 * Charge les données depuis le LocalStorage et les applique à la datacard.
 */
export function loadFromLocalStorage() {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            applyAllData(data);
            showNotification("Données chargées depuis la sauvegarde locale.");
        } catch (e) {
            console.error("Erreur de chargement local:", e);
            showNotification("Erreur: Impossible de charger la sauvegarde locale (données corrompues ?).", 5000);
            // Optionnel: Effacer les données corrompues
            // localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    } else {
        showNotification("Aucune sauvegarde locale trouvée.");
    }
}