// uiInteractions.js
// Gère les interactions utilisateur : boutons globaux, page toggle,
// checkboxes, ajout/suppression de lignes de tableau, sélecteurs L/R, etc.

import { DOM_ELEMENT_IDS, TABLE_ROW_STRUCTURES } from './config.js';
import { saveToLocalStorage, loadFromLocalStorage } from './storageManager.js';
import { exportAllData, importAllData as handleImportAllData, exportBlocData, importBlocData as handleImportBlocData } from './importExport.js';
import { showNotification } from './utils.js';
// applyAllData n'est pas directement utilisé ici, mais triggerAutoSave appelle saveToLocalStorage qui utilise des fonctions de dataManager

let autoSaveTimeout; // Variable pour le délai d'auto-sauvegarde

/**
 * Déclenche une sauvegarde automatique après un délai.
 * Cette fonction doit être accessible globalement ou importée là où elle est utilisée.
 */
function triggerAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        // S'assurer que saveToLocalStorage est disponible (elle devrait l'être car importée)
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
            // console.log("Auto-saved data."); // Pour débogage
        } else {
            console.warn("saveToLocalStorage function not found for auto-save.");
        }
    }, 1500); // Délai d'attente avant sauvegarde (1.5 secondes)
}

/**
 * Gère le basculement de l'état d'une checkbox personnalisée et sauvegarde.
 * `this` se réfère à l'élément checkbox.
 */
export function toggleCheckboxUI() {
    const isChecked = this.dataset.checked === 'true';
    this.dataset.checked = String(!isChecked);
    this.setAttribute('aria-checked', String(!isChecked));
    triggerAutoSave();
}

/**
 * SUPPRIMÉ: Gère la sélection L/R dans les blocs HOLD.
 * `this` se réfère à l'élément .lr-selector cliqué.
 */
// function handleLRSelectorClick() { ... } // Cette fonction est maintenant supprimée

/**
 * Ajoute une nouvelle ligne à un tableau (tbody) avec la structure appropriée.
 * @param {HTMLTableSectionElement} tbodyElement - L'élément tbody.
 * @param {string} tableId - L'identifiant de la structure de table (ex: 'comladder').
 */
export function addTableRowUI(tbodyElement, tableId) {
    if (!tbodyElement) return;

    const newRow = tbodyElement.insertRow();
    const numLine = tbodyElement.rows.length;

    const structureFn = TABLE_ROW_STRUCTURES[tableId] || TABLE_ROW_STRUCTURES.default;
    const structureDefinition = structureFn(numLine);

    structureDefinition.forEach((cellDef, index) => {
        const cell = newRow.insertCell();
        if (cellDef.type === 'checkbox') {
            const checkbox = document.createElement('span');
            Object.assign(checkbox, {
                className: 'data-field checkbox-custom',
                tabIndex: 0,
                role: 'checkbox'
            });
            checkbox.dataset.key = cellDef.key || `cb_r${numLine}_c${index}`;
            checkbox.dataset.checked = 'false';
            checkbox.setAttribute('aria-checked', 'false');
            cell.appendChild(checkbox);
        } else { // type 'text' par défaut
            const span = document.createElement('span');
            span.setAttribute('contenteditable', 'true');
            span.innerHTML = cellDef.value || '';
            cell.appendChild(span);
        }
    });

    const actionCell = newRow.insertCell();
    actionCell.classList.add('no-print');
    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-row-btn');
    removeButton.title = "Supprimer cette ligne";
    removeButton.innerHTML = '-';
    actionCell.appendChild(removeButton);

    triggerAutoSave();
}

/**
 * Supprime une ligne de tableau.
 * @param {HTMLTableRowElement} rowElement - L'élément tr à supprimer.
 */
export function removeTableRowUI(rowElement) {
    if (!rowElement) return;
    rowElement.remove();
    triggerAutoSave();
}

/**
 * Initialise les écouteurs d'événements globaux de l'application.
 */
export function initializeGlobalEventListeners() {
    const printBtn = document.getElementById(DOM_ELEMENT_IDS.printDatacardBtn);
    const exportAllBtn = document.getElementById(DOM_ELEMENT_IDS.exportAllBtn);
    const importAllInput = document.getElementById(DOM_ELEMENT_IDS.importAllInput);
    const clearAllBtn = document.getElementById(DOM_ELEMENT_IDS.clearAllBtn);
    const saveLocallyBtn = document.getElementById(DOM_ELEMENT_IDS.saveLocallyBtn);
    const loadLocalBtn = document.getElementById(DOM_ELEMENT_IDS.loadLocalBtn);

    if (printBtn) printBtn.addEventListener('click', () => window.print());
    if (exportAllBtn) exportAllBtn.addEventListener('click', exportAllData);
    if (importAllInput) importAllInput.addEventListener('change', handleImportAllData);
    if (clearAllBtn) clearAllBtn.addEventListener('click', confirmClearAllData);

    if (saveLocallyBtn) {
        saveLocallyBtn.addEventListener('click', () => {
            saveToLocalStorage();
            showNotification("Données sauvegardées manuellement dans le navigateur.");
        });
    }
    if (loadLocalBtn) {
        loadLocalBtn.addEventListener('click', () => {
            if (confirm("Charger les données locales ? Toutes les modifications non sauvegardées seront perdues.")) {
                loadFromLocalStorage();
            }
        });
    }

    const datacardViewer = document.querySelector(DOM_ELEMENT_IDS.datacardViewer);
    if (datacardViewer) {
        // Écouteur unique pour 'input' et 'change' (pour les select)
        datacardViewer.addEventListener('input', (event) => {
            const target = event.target;
            if (target.isContentEditable ||
                target.classList.contains('data-field') || // Cela inclut les contenteditable et les select
                (target.tagName === 'SPAN' && target.closest('td[contenteditable="true"]')) ||
                target.classList.contains('classification-footer')) {
                triggerAutoSave();
            }
        });
        // Ajouter un écouteur spécifique pour l'événement 'change' sur les select pour l'auto-save
        datacardViewer.addEventListener('change', (event) => {
            const target = event.target;
            if (target.tagName === 'SELECT' && target.classList.contains('data-field')) {
                triggerAutoSave();
            }
        });
    }
}

/**
 * Initialise les interactions spécifiques à un bloc.
 * @param {HTMLElement} blocDiv - L'élément div du bloc.
 */
export function initializeBlocSpecificInteractions(blocDiv) {
    const exportButton = blocDiv.querySelector('.bloc-actions button[data-action="export"]');
    if (exportButton) exportButton.addEventListener('click', () => exportBlocData(blocDiv));

    const importInput = blocDiv.querySelector('.bloc-actions input[type="file"][data-action="import"]');
    if (importInput) importInput.addEventListener('change', (event) => handleImportBlocData(event, blocDiv));

    blocDiv.querySelectorAll('.checkbox-custom').forEach(checkbox => {
        checkbox.addEventListener('click', function() { toggleCheckboxUI.call(this); });
        checkbox.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleCheckboxUI.call(this);
            }
        });
    });

    // SUPPRIMÉ: Gestion des sélecteurs L/R dans les blocs HOLD
    // blocDiv.querySelectorAll('.lr-selector').forEach(selector => { ... });

    blocDiv.querySelectorAll('.add-row-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tableRef = btn.dataset.tableRef;
            const tableBody = blocDiv.querySelector(`table.${tableRef}-table tbody, table[data-table-id="${tableRef}"] tbody`);
            if (tableBody) {
                addTableRowUI(tableBody, tableRef);
            } else {
                console.warn("Table body non trouvée pour ajout de ligne. Ref:", tableRef, "dans le bloc", blocDiv.dataset.blocId || blocDiv.className);
            }
        });
    });

    const table = blocDiv.querySelector('table');
    if (table) {
        table.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('remove-row-btn')) {
                const row = e.target.closest('tr');
                if (row) removeTableRowUI(row);
            }
        });
    }
}

/**
 * Configure la fonctionnalité de bascule d'affichage des pages (Recto/Verso/Les deux).
 */
export function setupPageToggle() {
    const rectoPage = document.getElementById(DOM_ELEMENT_IDS.pageRecto);
    const versoPage = document.getElementById(DOM_ELEMENT_IDS.pageVerso);
    const showRectoBtn = document.getElementById(DOM_ELEMENT_IDS.showRectoBtn);
    const showVersoBtn = document.getElementById(DOM_ELEMENT_IDS.showVersoBtn);
    const showBothBtn = document.getElementById(DOM_ELEMENT_IDS.showBothBtn);

    if (!rectoPage || !versoPage || !showRectoBtn || !showVersoBtn || !showBothBtn) {
        console.warn("Éléments pour le page toggle non trouvés.");
        return;
    }

    function setActiveButton(activeBtn) {
        [showRectoBtn, showVersoBtn, showBothBtn].forEach(btn => btn.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    }

    showRectoBtn.addEventListener('click', () => {
        rectoPage.style.display = 'flex';
        versoPage.style.display = 'none';
        setActiveButton(showRectoBtn);
    });
    showVersoBtn.addEventListener('click', () => {
        rectoPage.style.display = 'none';
        versoPage.style.display = 'flex';
        setActiveButton(showVersoBtn);
    });
    showBothBtn.addEventListener('click', () => {
        rectoPage.style.display = 'flex';
        versoPage.style.display = 'flex';
        setActiveButton(showBothBtn);
    });

    rectoPage.style.display = 'flex';
    versoPage.style.display = 'none';
    setActiveButton(showRectoBtn);
}

/**
 * Confirme et efface toutes les données de la datacard.
 */
function confirmClearAllData() {
    if (confirm("Voulez-vous vraiment vider toute la datacard et réinitialiser la taille et position des blocs ? Cette action est irréversible.")) {
        document.querySelectorAll('.bloc').forEach(blocDiv => {
            const contentElement = blocDiv.querySelector('.bloc-content');
            if (contentElement) {
                const contentType = contentElement.dataset.contentType || 'html';
                if (contentType === 'structured') {
                    contentElement.querySelectorAll('.data-field').forEach(field => {
                        if (field.classList.contains('checkbox-custom')) {
                            field.dataset.checked = "false";
                            field.setAttribute('aria-checked', "false");
                        } else if (field.tagName === 'SELECT') {
                            // Réinitialiser le select à sa première option (qui est 'L' par défaut)
                            if (field.options.length > 0) {
                                field.value = field.options[0].value;
                            }
                        } else { // contenteditable
                            field.innerHTML = '';
                        }
                    });
                    // La réinitialisation spécifique des L/R selectors est supprimée

                } else if (contentType === 'table') {
                    const tbody = contentElement.querySelector('tbody');
                    if (tbody) {
                        tbody.querySelectorAll('td span[contenteditable="true"]').forEach(s => s.innerHTML = '');
                        tbody.querySelectorAll('td .checkbox-custom').forEach(cb => {
                            cb.dataset.checked = "false";
                            cb.setAttribute('aria-checked', "false");
                        });
                    }
                } else if (contentType === 'html') {
                    contentElement.innerHTML = '';
                }
            }
            ['top', 'left', 'width', 'height'].forEach(prop => {
                blocDiv.style[prop] = '';
            });
        });

        const rectoFooter = document.querySelector(`#${DOM_ELEMENT_IDS.pageRecto} .classification-footer`);
        const versoFooter = document.querySelector(`#${DOM_ELEMENT_IDS.pageVerso} .classification-footer`);
        if (rectoFooter) rectoFooter.innerHTML = "CLASSIFICATION :";
        if (versoFooter) versoFooter.innerHTML = "CLASSIFICATION :";

        showNotification("Datacard vidée et styles des blocs réinitialisés.");
        saveToLocalStorage();
    }
}