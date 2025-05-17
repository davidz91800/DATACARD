// resizeManager.js
// Gère la logique de redimensionnement interactif des blocs (uniquement vertical).

import { MIN_BLOC_HEIGHT_MM, ESPACE_ENTRE_BLOCS_MM } from './config.js';
import { mmToPx, pxToMm } from './utils.js';
import { saveToLocalStorage } from './storageManager.js';

let currentResizing = {
    element: null,
    direction: null, // Sera toujours 'bottom'
    startY: 0,
    startHeightPx: 0,
    startTopPx: 0,
    
    // Blocs directement en dessous et qui seront redimensionnés en conséquence
    directlyBelowElements: [], 
    
    // Blocs frères qui doivent avoir la même hauteur (ex: tacticsHold)
    siblingHeightGroup: [],
    
    parentHeightPx: 0,
};

/**
 * Initialise les poignées de redimensionnement pour un bloc (uniquement la poignée inférieure).
 * @param {HTMLElement} blocElement - L'élément bloc.
 */
export function initializeResizeHandles(blocElement) {
    const dir = 'bottom';
    const handle = document.createElement('div');
    handle.className = `resize-handle resize-handle-${dir}`;
    blocElement.appendChild(handle);
    handle.addEventListener('mousedown', (e) => startResize(e, blocElement, dir));
}

/**
 * Identifie les blocs directement en dessous de l'élément donné.
 * Ces blocs sont ceux qui commenceront immédiatement après l'élément
 * (avec l'espacement ESPACE_ENTRE_BLOCS_MM) et qui chevauchent horizontalement.
 * @param {HTMLElement} blocElement - L'élément de référence.
 * @param {HTMLElement[]} allOtherBlocs - Tous les autres blocs dans le même volet.
 * @returns {object[]} - Tableau d'objets { element, initialTopPx, initialHeightPx }.
 */
function findDirectlyBelowElements(blocElement, allOtherBlocs) {
    const belowElements = [];
    const blocElementRect = blocElement.getBoundingClientRect();
    const blocElementBottomEdgePx = blocElementRect.bottom; // Utiliser getBoundingClientRect pour la position réelle à l'écran
    const spaceBetweenPx = mmToPx(ESPACE_ENTRE_BLOCS_MM);
    const tolerancePx = mmToPx(1); // Petite tolérance pour la détection d'adjacence

    allOtherBlocs.forEach(otherBloc => {
        const otherBlocRect = otherBloc.getBoundingClientRect();
        // Vérifie si otherBloc est positionné juste en dessous de blocElement
        const isVerticallyAdjacent = Math.abs(otherBlocRect.top - (blocElementBottomEdgePx + spaceBetweenPx)) < tolerancePx;
        
        // Vérifie le chevauchement horizontal
        const isHorizontallyOverlapping = Math.max(blocElementRect.left, otherBlocRect.left) < Math.min(blocElementRect.right, otherBlocRect.right);

        if (isVerticallyAdjacent && isHorizontallyOverlapping) {
            const otherStyle = getComputedStyle(otherBloc);
            belowElements.push({
                element: otherBloc,
                initialTopPx: parseFloat(otherStyle.top), // Ou otherBlocRect.top si on préfère la position calculée
                initialHeightPx: parseFloat(otherStyle.height) // Ou otherBlocRect.height
            });
        }
    });
    return belowElements;
}


/**
 * Démarre le processus de redimensionnement.
 * @param {MouseEvent} event - L'événement mousedown.
 * @param {HTMLElement} blocElement - Le bloc à redimensionner.
 * @param {string} direction - Devrait toujours être 'bottom'.
 */
function startResize(event, blocElement, direction) {
    event.preventDefault();
    event.stopPropagation();

    document.body.classList.add('is-resizing');
    blocElement.classList.add('is-resizing-element');

    currentResizing.element = blocElement;
    currentResizing.direction = direction;
    currentResizing.startY = event.clientY;

    const computedStyle = getComputedStyle(blocElement);
    currentResizing.startHeightPx = parseFloat(computedStyle.height);
    currentResizing.startTopPx = parseFloat(computedStyle.top);

    const parent = blocElement.parentElement;
    if (parent) {
        const parentStyle = getComputedStyle(parent);
        currentResizing.parentHeightPx = parseFloat(parentStyle.height) - (parseFloat(parentStyle.paddingTop) || 0) - (parseFloat(parentStyle.paddingBottom) || 0);

        const allOtherBlocsInVolet = Array.from(parent.children)
            .filter(el => el.classList.contains('bloc') && el !== blocElement && el.style.display !== 'none');
        
        currentResizing.directlyBelowElements = findDirectlyBelowElements(blocElement, allOtherBlocsInVolet);
        currentResizing.directlyBelowElements.forEach(item => {
            item.element.classList.add('is-resizing-affected-below');
        });

    } else {
        currentResizing.parentHeightPx = window.innerHeight;
        currentResizing.directlyBelowElements = [];
    }

    // Gérer les groupes de blocs à hauteur synchronisée (ex: tacticsHold)
    currentResizing.siblingHeightGroup = [];
    const blocId = blocElement.dataset.blocId;
    if (blocId) {
        let groupIdentifier = null;
        if (blocId.startsWith('tacticsHold')) groupIdentifier = 'tacticsHold';
        // Ajoutez d'autres identifiants de groupe ici si nécessaire
        // else if (blocId.startsWith('targetsDz') || blocId.startsWith('targetsLz')) groupIdentifier = 'targetsGroup'; 

        if (groupIdentifier && parent) {
            parent.querySelectorAll(`.bloc[data-bloc-id^="${groupIdentifier}"]`).forEach(sibling => {
                if (sibling !== blocElement) {
                    const siblingStyle = getComputedStyle(sibling);
                    currentResizing.siblingHeightGroup.push({
                        element: sibling,
                        initialTopPx: parseFloat(siblingStyle.top),
                        initialHeightPx: parseFloat(siblingStyle.height)
                    });
                }
            });
        }
    }
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
}


/**
 * Effectue le redimensionnement lors du mouvement de la souris.
 * @param {MouseEvent} event - L'événement mousemove.
 */
function doResize(event) {
    if (!currentResizing.element) return;

    const dy = event.clientY - currentResizing.startY;
    const element = currentResizing.element;
    const minHeightPx = mmToPx(MIN_BLOC_HEIGHT_MM);
    const spaceBetweenElementsPx = mmToPx(ESPACE_ENTRE_BLOCS_MM);

    let newHeightPx = currentResizing.startHeightPx + dy;

    // 1. Appliquer la hauteur minimale à l'élément redimensionné
    if (newHeightPx < minHeightPx) {
        newHeightPx = minHeightPx;
    }

    // 2. Gérer les blocs directement en dessous
    if (currentResizing.directlyBelowElements.length > 0) {
        // Pour simplifier, on considère le premier bloc en dessous comme principal affecté, 
        // les autres dans ce groupe 'directlyBelowElements' suivront (si côte à côte).
        const mainBelowItem = currentResizing.directlyBelowElements[0];
        const maxPossibleHeightForElement = mainBelowItem.initialTopPx + mainBelowItem.initialHeightPx - currentResizing.startTopPx - spaceBetweenElementsPx - minHeightPx;

        if (newHeightPx > maxPossibleHeightForElement) {
            newHeightPx = maxPossibleHeightForElement;
        }
         // Ré-appliquer la hauteur minimale si le calcul ci-dessus l'a rendue trop petite
        if (newHeightPx < minHeightPx) {
            newHeightPx = minHeightPx;
        }
    } else {
        // Si pas de bloc en dessous, l'élément peut s'étendre jusqu'au bas du parent
        const maxElementHeightAlone = currentResizing.parentHeightPx - currentResizing.startTopPx;
        if (newHeightPx > maxElementHeightAlone) {
            newHeightPx = maxElementHeightAlone;
        }
    }

    element.style.height = `${pxToMm(newHeightPx)}mm`;
    const newElementBottomPx = currentResizing.startTopPx + newHeightPx;

    // 3. Ajuster les blocs directement en dessous
    currentResizing.directlyBelowElements.forEach(item => {
        const belowEl = item.element;
        const newBelowTopPx = newElementBottomPx + spaceBetweenElementsPx;
        let newBelowHeightPx = (item.initialTopPx + item.initialHeightPx) - newBelowTopPx;

        if (newBelowHeightPx < minHeightPx) {
            newBelowHeightPx = minHeightPx;
            // Si la hauteur du bloc en dessous atteint le min, le bloc du dessus ne peut plus s'étendre
            // Cette contrainte est déjà plus ou moins gérée par maxPossibleHeightForElement
        }
        
        // S'assurer que le bloc en dessous ne dépasse pas le parent
        if (newBelowTopPx + newBelowHeightPx > currentResizing.parentHeightPx) {
            newBelowHeightPx = currentResizing.parentHeightPx - newBelowTopPx;
            if (newBelowHeightPx < minHeightPx) newBelowHeightPx = minHeightPx; // encore minHeight
        }


        belowEl.style.top = `${pxToMm(newBelowTopPx)}mm`;
        belowEl.style.height = `${pxToMm(newBelowHeightPx)}mm`;
    });

    // 4. Synchroniser la hauteur des blocs frères (comme tacticsHold)
    // Le bloc redimensionné (element) et ses frères (siblingHeightGroup)
    const allInGroup = [element, ...currentResizing.siblingHeightGroup.map(s => s.element)];
    allInGroup.forEach(groupElement => {
        if (groupElement === element) return; // Déjà fait

        const geStyle = getComputedStyle(groupElement);
        const geTopPx = parseFloat(geStyle.top);
        let geNewHeightPx = newHeightPx; // Ils prennent la même hauteur que 'element'

        // Appliquer les mêmes contraintes de hauteur que pour 'element'
        // par rapport à LEURS propres blocs directement en dessous.
        // C'est la partie complexe : chaque 'sibling' peut avoir ses propres 'directlyBelowElements'.
        // Pour l'instant, on applique une contrainte simple : ne pas dépasser le parent.
        if (geTopPx + geNewHeightPx > currentResizing.parentHeightPx) {
            geNewHeightPx = currentResizing.parentHeightPx - geTopPx;
        }
        if (geNewHeightPx < minHeightPx) {
            geNewHeightPx = minHeightPx;
        }
        groupElement.style.height = `${pxToMm(geNewHeightPx)}mm`;

        // Idéalement, il faudrait aussi ajuster les blocs en dessous de CHAQUE sibling.
        // Cette partie est omise pour l'instant pour ne pas trop complexifier,
        // en supposant que les blocs 'sibling' ont des configurations "en dessous" similaires
        // ou que l'ajustement du bloc principal est dominant.
        // Une solution complète nécessiterait de recalculer les 'directlyBelowElements' pour chaque sibling
        // et d'appliquer la logique d'ajustement.
    });

    // 5. Assurer que le dernier bloc (ou groupe de derniers blocs) s'étend jusqu'en bas si possible
    // Cette logique est plus complexe à mettre en œuvre dynamiquement pendant le drag.
    // Une approche serait, à la fin du redimensionnement (stopResize), de vérifier si le dernier bloc
    // peut être étendu. Pour l'instant, ce n'est pas implémenté ici.
    // La logique actuelle fait que si on réduit un bloc, celui du dessous s'agrandit, ce qui tend vers cet effet.
}

/**
 * Arrête le processus de redimensionnement.
 */
function stopResize() {
    if (!currentResizing.element) return;

    document.body.classList.remove('is-resizing');
    currentResizing.element.classList.remove('is-resizing-element');
    
    currentResizing.directlyBelowElements.forEach(item => {
        item.element.classList.remove('is-resizing-affected-below');
    });

    // Optionnel: Ajustement final pour que le dernier bloc touche le bas
    // Cela nécessiterait d'identifier le(s) "dernier(s)" bloc(s) dans chaque colonne visuelle
    // et d'ajuster leur hauteur. C'est une étape de "layout" complexe.
    // Pour l'instant, on se fie au comportement d'étirement/rétrécissement.

    currentResizing.element = null;
    currentResizing.directlyBelowElements = [];
    currentResizing.siblingHeightGroup = [];

    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);

    saveToLocalStorage();
}