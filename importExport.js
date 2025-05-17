import { collectAllData, applyAllData, getContentData, setContentData } from './dataManager.js';
import { saveToLocalStorage } from './storageManager.js';
import { showNotification, downloadJson } from './utils.js';

/**
 * Exporte les données d'un bloc spécifique en JSON.
 * @param {HTMLElement} blocDiv - L'élément div du bloc.
 */
export function exportBlocData(blocDiv) {
    const blocId = blocDiv.dataset.blocId;
    const titreElement = blocDiv.querySelector('.bloc-titre');
    const contentElement = blocDiv.querySelector('.bloc-content');

    if (!blocId || !contentElement) {
        showNotification("Erreur: Exportation de bloc impossible (ID ou contenu manquant).", 5000);
        console.error("exportBlocData: blocId ou contentElement manquant.", blocDiv);
        return;
    }

    const blocDataObject = {
        blocId: blocId,
        title: titreElement ? titreElement.innerHTML : "",
        content: getContentData(contentElement),
        style: {
            top: blocDiv.style.top || undefined,
            left: blocDiv.style.left || undefined,
            width: blocDiv.style.width || undefined,
            height: blocDiv.style.height || undefined,
        }
    };
    downloadJson(JSON.stringify(blocDataObject, null, 2), `${blocId}_data.json`);
    showNotification(`Bloc "${blocId}" exporté.`);
}

/**
 * Importe les données d'un fichier JSON pour un bloc spécifique.
 * @param {Event} event - L'événement de changement de l'input file.
 * @param {HTMLElement} blocDiv - L'élément div du bloc cible.
 */
export function importBlocData(event, blocDiv) {
    const file = event.target.files[0];
    if (!file) return;

    const targetBlocId = blocDiv.dataset.blocId;
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.blocId !== targetBlocId) {
                alert(`Erreur: Fichier pour bloc "${importedData.blocId}", mais le bloc cible est "${targetBlocId}". L'importation est annulée.`);
                return;
            }

            const titreElement = blocDiv.querySelector('.bloc-titre');
            const contentElement = blocDiv.querySelector('.bloc-content');

            if (titreElement && importedData.title !== undefined) {
                titreElement.innerHTML = importedData.title;
            }
            if (contentElement && importedData.content) {
                setContentData(contentElement, importedData.content);
            }
            if (importedData.style) {
                ['top', 'left', 'width', 'height'].forEach(prop => {
                    if (importedData.style[prop]) {
                        blocDiv.style[prop] = importedData.style[prop];
                    } else {
                        blocDiv.style[prop] = ''; // Réinitialiser si la propriété de style n'est pas dans l'import
                    }
                });
            }
            showNotification(`Bloc "${targetBlocId}" importé avec succès.`);
            saveToLocalStorage(); // Sauvegarder après l'import d'un bloc
        } catch (err) {
            alert("Erreur lors de la lecture ou de l'application du fichier JSON du bloc: " + err.message);
            console.error("Erreur importBlocData:", err);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Réinitialiser l'input file pour permettre de réimporter le même fichier
}

/**
 * Exporte toutes les données de la datacard en JSON.
 */
export function exportAllData() {
    const allData = collectAllData();
    downloadJson(JSON.stringify(allData, null, 2), 'datacard_CIET_all_data.json');
    showNotification("Toutes les données ont été exportées.");
}

/**
 * Importe toutes les données de la datacard à partir d'un fichier JSON.
 * @param {Event} event - L'événement de changement de l'input file.
 */
export function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            applyAllData(importedData);
            showNotification("Toutes les données ont été importées avec succès.");
            saveToLocalStorage(); // Sauvegarder après l'import global
        } catch (err) {
            alert("Erreur lors de la lecture ou de l'application du fichier JSON global: " + err.message);
            console.error("Erreur importAllData:", err);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Réinitialiser l'input file
}