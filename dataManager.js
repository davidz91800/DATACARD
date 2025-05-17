// dataManager.js
// Gère la collecte et l'application des données de contenu des blocs.

import { DOM_ELEMENT_IDS, TABLE_ROW_STRUCTURES } from './config.js';
import { toggleCheckboxUI, addTableRowUI, removeTableRowUI } from './uiInteractions.js'; // Pour recréer les listeners sur les éléments chargés

/**
 * Extrait les données de contenu d'un élément .bloc-content.
 * @param {HTMLElement} contentElement - L'élément .bloc-content.
 * @returns {object} Les données extraites.
 */
export function getContentData(contentElement) {
    const contentType = contentElement.dataset.contentType || 'html';
    let data = {};

    if (contentType === 'structured') {
        data.fields = {};
        contentElement.querySelectorAll('.data-field').forEach(field => {
            const key = field.dataset.key;
            if (!key) return;

            if (field.classList.contains('checkbox-custom')) {
                data.fields[key] = field.dataset.checked === 'true';
            } else if (field.tagName === 'SELECT') { // Gérer les éléments SELECT
                data.fields[key] = field.value;
            } else { // Champs contenteditable
                data.fields[key] = field.innerHTML;
            }
        });
        // La gestion spécifique des .lr-selector est supprimée car ils n'existent plus

    } else if (contentType === 'table') {
        // ... (code existant pour les tables, inchangé)
        data.rows = [];
        contentElement.querySelectorAll('tbody tr').forEach(tr => {
            const rowData = [];
            tr.querySelectorAll('td:not(.no-print)').forEach(td => {
                const editableSpan = td.querySelector('span[contenteditable="true"]');
                const checkbox = td.querySelector('.checkbox-custom');
                const directEditableTd = td.hasAttribute('contenteditable') && td.getAttribute('contenteditable') === 'true' && !editableSpan && !checkbox;

                if (checkbox) {
                    rowData.push({ type: 'checkbox', checked: checkbox.dataset.checked === 'true', key: checkbox.dataset.key });
                } else if (editableSpan) {
                    rowData.push({ type: 'text', value: editableSpan.innerHTML });
                } else if (directEditableTd) {
                    rowData.push({ type: 'text', value: td.innerHTML });
                } else {
                    rowData.push({ type: 'html', value: td.innerHTML }); 
                }
            });
            if (rowData.length > 0) {
                data.rows.push(rowData);
            }
        });
    } else if (contentType === 'html') {
        data.html = contentElement.innerHTML;
    }
    return data;
}

export function setContentData(contentElement, blocDataContent) {
    const contentType = contentElement.dataset.contentType || 'html';

    if (contentType === 'structured' && blocDataContent && blocDataContent.fields) {
        contentElement.querySelectorAll('.data-field').forEach(field => {
            const key = field.dataset.key;
            if (!key || blocDataContent.fields[key] === undefined) return;

            if (field.classList.contains('checkbox-custom')) {
                const isChecked = blocDataContent.fields[key] === true;
                field.dataset.checked = String(isChecked);
                field.setAttribute('aria-checked', String(isChecked));
            } else if (field.tagName === 'SELECT') { // Gérer les éléments SELECT
                field.value = blocDataContent.fields[key];
                // Si la valeur sauvegardée n'existe pas comme option, le select reviendra à sa première option par défaut.
                // Pour "L" par défaut si aucune valeur n'est sauvegardée et que "L" est la première option :
                // cela est géré par le HTML du select (<option value="L" selected> implicitement ou explicitement).
                // Si la data-key n'existe pas dans blocDataContent.fields[key], on ne fait rien, il garde sa valeur par défaut.
            } else { // Champs contenteditable
                field.innerHTML = blocDataContent.fields[key];
            }
        });
        // La gestion spécifique des .lr-selector est supprimée

    } else if (contentType === 'table' && blocDataContent && blocDataContent.rows) {
        // ... (code existant pour les tables, inchangé)
        const tbody = contentElement.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = ''; 

        const tableId = tbody.closest('table')?.dataset.tableId ||
                        (tbody.closest('table')?.classList.contains('comladder-table') ? 'comladder' : null) ||
                        (tbody.closest('table')?.classList.contains('timeline-table') ? 'timeline' : null);

        blocDataContent.rows.forEach(rowDataArray => {
            const tr = tbody.insertRow();
            rowDataArray.forEach((cellData) => {
                const td = tr.insertCell();
                if (cellData.type === 'checkbox') {
                    const checkbox = document.createElement('span');
                    Object.assign(checkbox, { className: 'data-field checkbox-custom', tabIndex: 0, role: 'checkbox' });
                    checkbox.dataset.key = cellData.key;
                    const isChecked = cellData.checked === true;
                    checkbox.dataset.checked = String(isChecked);
                    checkbox.setAttribute('aria-checked', String(isChecked));
                    td.appendChild(checkbox);
                } else if (cellData.type === 'text' || typeof cellData === 'string' || (cellData && cellData.value !== undefined)) {
                    const span = document.createElement('span');
                    span.setAttribute('contenteditable', 'true');
                    span.innerHTML = cellData.value !== undefined ? cellData.value : (typeof cellData === 'string' ? cellData : '');
                    td.appendChild(span);
                } else if (cellData.type === 'html') {
                    td.innerHTML = cellData.value || '';
                } else { 
                     const span = document.createElement('span');
                     span.setAttribute('contenteditable', 'true');
                     span.innerHTML = cellData;
                     td.appendChild(span);
                }
            });
            const rowStructureFn = TABLE_ROW_STRUCTURES[tableId] || TABLE_ROW_STRUCTURES.default;
            if (rowStructureFn && (tableId === 'comladder' || tableId === 'timeline' || tableId === 'externalContracts' || tableId === 'elementPackageContracts' || tableId === 'generalCodewords')) {
                 addRemoveButtonCell(tr);
            }
        });
    } else if (contentType === 'html' && blocDataContent && blocDataContent.html !== undefined) {
        contentElement.innerHTML = blocDataContent.html;
    }
}

// ... (reste de dataManager.js, addRemoveButtonCell, collectAllData, applyAllData)
function addRemoveButtonCell(tr) {
    const actionCell = tr.insertCell();
    actionCell.classList.add('no-print');
    const button = document.createElement('button');
    button.classList.add('remove-row-btn');
    button.title = "Supprimer cette ligne";
    button.innerHTML = '-';
    actionCell.appendChild(button);
}

export function collectAllData() {
    const allData = { blocs: [] };
    document.querySelectorAll('.bloc').forEach(blocDiv => {
        const blocId = blocDiv.dataset.blocId;
        if (!blocId) {
            console.warn("Bloc trouvé sans data-bloc-id, il ne sera pas sauvegardé.");
            return;
        }
        const titreElement = blocDiv.querySelector('.bloc-titre');
        const contentElement = blocDiv.querySelector('.bloc-content');

        allData.blocs.push({
            blocId: blocId,
            title: titreElement ? titreElement.innerHTML : "",
            content: contentElement ? getContentData(contentElement) : {},
            style: { 
                top: blocDiv.style.top || undefined,
                left: blocDiv.style.left || undefined,
                width: blocDiv.style.width || undefined,
                height: blocDiv.style.height || undefined,
            }
        });
    });
    const rectoFooter = document.querySelector(`#${DOM_ELEMENT_IDS.pageRecto} .classification-footer`);
    const versoFooter = document.querySelector(`#${DOM_ELEMENT_IDS.pageVerso} .classification-footer`);
    
    allData.classificationRecto = rectoFooter ? rectoFooter.innerHTML : "CLASSIFICATION :";
    allData.classificationVerso = versoFooter ? versoFooter.innerHTML : "CLASSIFICATION :";
    return allData;
}

export function applyAllData(dataToApply) {
    if (!dataToApply || !Array.isArray(dataToApply.blocs)) {
        showNotification("Format de données global invalide pour l'application.", 4000);
        console.error("applyAllData: Format de données invalide.", dataToApply);
        return;
    }

    dataToApply.blocs.forEach(blocData => {
        const blocDiv = document.querySelector(`.bloc[data-bloc-id="${blocData.blocId}"]`);
        if (blocDiv) {
            const titreElement = blocDiv.querySelector('.bloc-titre');
            const contentElement = blocDiv.querySelector('.bloc-content');

            if (titreElement && blocData.title !== undefined) {
                titreElement.innerHTML = blocData.title;
            }
            if (contentElement && blocData.content) {
                setContentData(contentElement, blocData.content);
            }
            if (blocData.style) {
                Object.keys(blocData.style).forEach(prop => {
                    if (blocData.style[prop]) {
                        blocDiv.style[prop] = blocData.style[prop];
                    } else {
                         blocDiv.style[prop] = ''; 
                    }
                });
            }
        } else {
            console.warn(`Bloc ${blocData.blocId} non trouvé lors de l'import global.`);
        }
    });

    const rectoFooter = document.querySelector(`#${DOM_ELEMENT_IDS.pageRecto} .classification-footer`);
    const versoFooter = document.querySelector(`#${DOM_ELEMENT_IDS.pageVerso} .classification-footer`);

    if (rectoFooter && dataToApply.classificationRecto !== undefined) {
        rectoFooter.innerHTML = dataToApply.classificationRecto;
    }
    if (versoFooter && dataToApply.classificationVerso !== undefined) {
        versoFooter.innerHTML = dataToApply.classificationVerso;
    }
}