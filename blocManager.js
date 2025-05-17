import { blocConfiguration } from './config.js';
import { initializeBlocSpecificInteractions } from './uiInteractions.js'; // Sera créé plus tard
import { initializeResizeHandles } from './resizeManager.js'; // Sera créé plus tard

/**
 * Charge le contenu HTML d'un template de bloc.
 * @param {string} templateFile - Le nom du fichier HTML du template (sans .html).
 * @returns {Promise<string>} Le contenu HTML du template.
 */
async function fetchBlocTemplate(templateFile) {
    const response = await fetch(`./${templateFile}.html`);
    if (!response.ok) {
        throw new Error(`Impossible de charger le template: ${templateFile}.html - Status: ${response.status}`);
    }
    return response.text();
}

/**
 * Crée un élément DOM à partir d'une chaîne HTML.
 * Prend uniquement le premier élément racine du HTML fourni.
 * @param {string} htmlString - La chaîne HTML.
 * @returns {Node | null} Le premier nœud élément créé, ou null.
 */
function createNodeFromHTML(htmlString) {
    const
      tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString.trim();
    return tempDiv.firstChild;
}


/**
 * Rend tous les blocs configurés dans les volets appropriés.
 */
export async function renderAllBlocs() {
    for (const config of blocConfiguration) {
        const targetVolet = document.getElementById(config.targetVoletId);
        if (!targetVolet) {
            console.warn(`Volet cible ${config.targetVoletId} non trouvé pour le template ${config.templateFile}.`);
            continue;
        }

        try {
            const blocHTML = await fetchBlocTemplate(config.templateFile);
            const blocNode = createNodeFromHTML(blocHTML);

            if (blocNode && blocNode.nodeType === Node.ELEMENT_NODE) {
                targetVolet.appendChild(blocNode);
                // Initialiser les interactions spécifiques à ce bloc nouvellement ajouté
                initializeBlocSpecificInteractions(blocNode);
                initializeResizeHandles(blocNode);
            } else {
                console.warn(`Le template ${config.templateFile}.html n'a pas produit un nœud valide.`);
            }
        } catch (error) {
            console.error(`Erreur lors du rendu du bloc ${config.templateFile}:`, error);
        }
    }
}