document.addEventListener('DOMContentLoaded', () => {
    renderAllBlocs();
    initializeGlobalEventListeners();
    initializeBlocInteractions();
    loadFromLocalStorage();
    setupPageToggle();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered.', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
});

const LOCAL_STORAGE_KEY = 'cietDatacardFull_v4'; // Incrémenter la version si la structure des données change
const MIN_BLOC_WIDTH_MM = 20;
const MIN_BLOC_HEIGHT_MM = 10;
const ESPACE_ENTRE_BLOCS_MM = 1; // Espace fixe souhaité en mm

// Configuration des blocs : quel template va dans quel volet de quelle page
const blocConfiguration = [
    // --- RECTO ---
    { templateId: 'templateMsnObjectiveR', targetVoletId: 'voletGaucheRecto' },
    { templateId: 'templateDomesticsR', targetVoletId: 'voletGaucheRecto' },
    { templateId: 'templateSupportR', targetVoletId: 'voletGaucheRecto' },
    { templateId: 'templateComladderR', targetVoletId: 'voletGaucheRecto' },
    { templateId: 'templateTimelineR', targetVoletId: 'voletGaucheRecto' },
    { templateId: 'templateExternalContractsR', targetVoletId: 'voletGaucheRecto' },
    { templateId: 'templateElementPackageContractsR', targetVoletId: 'voletGaucheRecto' },
    { templateId: 'templateTacticsHeaderR', targetVoletId: 'voletDroitRecto' },
    { templateId: 'templateTacticsHold1R', targetVoletId: 'voletDroitRecto' },
    { templateId: 'templateTacticsHold2R', targetVoletId: 'voletDroitRecto' },
    { templateId: 'templateTacticsJoinPackageR', targetVoletId: 'voletDroitRecto' },
    { templateId: 'templateTacticsIngressR', targetVoletId: 'voletDroitRecto' },
    { templateId: 'templateTargetsDzOneR', targetVoletId: 'voletDroitRecto' },
    // { templateId: 'templateTargetsDzVannesR', targetVoletId: 'voletDroitRecto' },
    // { templateId: 'templateTargetsLzRennesR', targetVoletId: 'voletDroitRecto' },
    // { templateId: 'templateTargetsDzLfoeR', targetVoletId: 'voletDroitRecto' },
    { templateId: 'templateWhatIfsSafetyR', targetVoletId: 'voletDroitRecto' },
    // --- VERSO ---
    { templateId: 'templateMissionCodewordsV', targetVoletId: 'voletGaucheVerso' },
    { templateId: 'templateGeneralCodewordsV', targetVoletId: 'voletGaucheVerso' },
];

function renderAllBlocs() {
    blocConfiguration.forEach(config => {
        const template = document.getElementById(config.templateId);
        const targetVolet = document.getElementById(config.targetVoletId);
        if (template && targetVolet) {
            const clone = template.content.cloneNode(true);
            targetVolet.appendChild(clone);
        } else {
            console.warn(`Template ${config.templateId} ou Volet ${config.targetVoletId} non trouvé.`);
        }
    });
}

function setupPageToggle() {
    const rectoPage = document.getElementById('pageRecto');
    const versoPage = document.getElementById('pageVerso');
    const showRectoBtn = document.getElementById('showRectoBtn');
    const showVersoBtn = document.getElementById('showVersoBtn');
    const showBothBtn = document.getElementById('showBothBtn');

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
    setActiveButton(showRectoBtn);
}

function initializeGlobalEventListeners() {
    document.getElementById('printDatacardBtn').addEventListener('click', () => window.print());
    document.getElementById('exportAllBtn').addEventListener('click', exportAllData);
    document.getElementById('importAllInput').addEventListener('change', importAllData);
    document.getElementById('clearAllBtn').addEventListener('click', confirmClearAllData);
    document.getElementById('saveLocallyBtn').addEventListener('click', () => {
        saveToLocalStorage();
        showNotification("Données sauvegardées manuellement.");
    });
    document.getElementById('loadLocalBtn').addEventListener('click', () => {
        if (confirm("Charger les données locales ? Les modifications non sauvegardées seront perdues.")) {
            loadFromLocalStorage();
        }
    });
}

function initializeBlocInteractions() {
    document.querySelectorAll('.bloc').forEach(blocDiv => {
        const exportButton = blocDiv.querySelector('.bloc-actions button[data-action="export"]');
        if (exportButton) exportButton.addEventListener('click', () => exportBlocData(blocDiv));
        const importInput = blocDiv.querySelector('.bloc-actions input[type="file"]');
        if (importInput) importInput.addEventListener('change', (event) => importBlocData(event, blocDiv));

        blocDiv.querySelectorAll('.checkbox-custom').forEach(checkbox => {
            checkbox.addEventListener('click', function() { toggleCheckbox.call(this); });
            checkbox.addEventListener('keydown', function(e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleCheckbox.call(this); }});
        });

        blocDiv.querySelectorAll('.add-row-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tableRef = btn.dataset.tableRef;
                const tableBody = blocDiv.querySelector(`table.${tableRef}-table tbody, table[data-table-id="${tableRef}"] tbody`);
                if (tableBody) addTableRow(tableBody, tableRef);
                else console.warn("Table body non trouvée pour ajout de ligne, ref:", tableRef);
            });
        });
        const tableBody = blocDiv.querySelector('table tbody');
        if (tableBody) {
            tableBody.addEventListener('click', function(e) { if (e.target && e.target.classList.contains('remove-row-btn')) removeTableRow(e.target.closest('tr')); });
        }
        initializeResizeHandles(blocDiv);
    });

    let autoSaveTimeout;
    document.querySelector('.datacard-viewer').addEventListener('input', (event) => {
        if (event.target.isContentEditable || event.target.classList.contains('data-field') || event.target.closest('td[contenteditable="true"]') || event.target.classList.contains('classification-footer')) {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => { saveToLocalStorage(); console.log("Auto-saved via input."); }, 1500);
        }
    });
}

function toggleCheckbox() {
    const isChecked = this.dataset.checked === 'true';
    this.dataset.checked = String(!isChecked);
    this.setAttribute('aria-checked', String(!isChecked));
    saveToLocalStorage();
    console.log("Auto-saved via checkbox toggle.");
}

// --- FONCTIONS DE REDIMENSIONNEMENT ---
function initializeResizeHandles(blocElement) {
    ['right', 'bottom'].forEach(dir => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${dir}`;
        blocElement.appendChild(handle);
        handle.addEventListener('mousedown', (e) => startResize(e, blocElement, dir));
    });
}

let currentResizing = { element: null, direction: null, startX: 0, startY: 0, startWidthPx: 0, startHeightPx: 0, startLeftPx: 0, startTopPx: 0, adjacentElement: null, adjacentStartWidthPx: 0, adjacentStartLeftPx: 0, adjacentStartHeightPx: 0, adjacentStartTopPx: 0, parentWidthPx: 0, parentHeightPx: 0, };

function mmToPx(mm) { return (mm / 25.4) * 96; }
function pxToMm(px) { return (px / 96) * 25.4; }

function startResize(event, blocElement, direction) {
    event.preventDefault();
    event.stopPropagation();
    document.body.classList.add('is-resizing');
    blocElement.classList.add('is-resizing-element');

    currentResizing.element = blocElement;
    currentResizing.direction = direction;
    currentResizing.startX = event.clientX;
    currentResizing.startY = event.clientY;

    const computedStyle = getComputedStyle(blocElement);
    currentResizing.startWidthPx = parseFloat(computedStyle.width);
    currentResizing.startHeightPx = parseFloat(computedStyle.height);
    currentResizing.startLeftPx = parseFloat(computedStyle.left);
    currentResizing.startTopPx = parseFloat(computedStyle.top);

    const parentStyle = getComputedStyle(blocElement.parentElement);
    currentResizing.parentWidthPx = parseFloat(parentStyle.width) - (parseFloat(parentStyle.paddingLeft) || 0) - (parseFloat(parentStyle.paddingRight) || 0);
    currentResizing.parentHeightPx = parseFloat(parentStyle.height) - (parseFloat(parentStyle.paddingTop) || 0) - (parseFloat(parentStyle.paddingBottom) || 0);

    currentResizing.adjacentElement = findAdjacentElement(blocElement, direction);
    if (currentResizing.adjacentElement) {
        currentResizing.adjacentElement.classList.add('is-resizing-adjacent');
        const adjComputedStyle = getComputedStyle(currentResizing.adjacentElement);
        currentResizing.adjacentStartWidthPx = parseFloat(adjComputedStyle.width);
        currentResizing.adjacentStartLeftPx = parseFloat(adjComputedStyle.left);
        currentResizing.adjacentStartHeightPx = parseFloat(adjComputedStyle.height);
        currentResizing.adjacentStartTopPx = parseFloat(adjComputedStyle.top);
    } else {
        Object.assign(currentResizing, { adjacentElement: null, adjacentStartWidthPx: 0, adjacentStartLeftPx: 0, adjacentStartHeightPx: 0, adjacentStartTopPx: 0 });
    }

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
}

function findAdjacentElement(blocElement, direction) {
    const allBlocsInVolet = Array.from(blocElement.parentElement.children).filter(el => el.classList.contains('bloc') && el !== blocElement);
    const currentRect = blocElement.getBoundingClientRect();
    let closest = null;
    let minDistance = Infinity;
    const tolerance = 15;

    if (direction === 'right') {
        allBlocsInVolet.forEach(otherBloc => {
            const otherRect = otherBloc.getBoundingClientRect();
            if (Math.abs(otherRect.top - currentRect.top) < currentRect.height / 2 &&
                otherRect.left > currentRect.right - tolerance && otherRect.left < currentRect.right + mmToPx(20 + ESPACE_ENTRE_BLOCS_MM)) {
                const distance = otherRect.left - currentRect.right;
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = otherBloc;
                }
            }
        });
    } else if (direction === 'bottom') {
        allBlocsInVolet.forEach(otherBloc => {
            const otherRect = otherBloc.getBoundingClientRect();
            if (Math.abs(otherRect.left - currentRect.left) < currentRect.width / 2 &&
                otherRect.top > currentRect.bottom - tolerance && otherRect.top < currentRect.bottom + mmToPx(20 + ESPACE_ENTRE_BLOCS_MM)) {
                const distance = otherRect.top - currentRect.bottom;
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = otherBloc;
                }
            }
        });
    }
    return closest;
}

function doResize(event) {
    if (!currentResizing.element) return;
    const dx = event.clientX - currentResizing.startX;
    const dy = event.clientY - currentResizing.startY;

    const element = currentResizing.element;
    const adjacent = currentResizing.adjacentElement;
    const minWidthPx = mmToPx(MIN_BLOC_WIDTH_MM);
    const minHeightPx = mmToPx(MIN_BLOC_HEIGHT_MM);
    const spaceBetweenElementsPx = mmToPx(ESPACE_ENTRE_BLOCS_MM);

    if (currentResizing.direction === 'right') {
        let newWidthPx = currentResizing.startWidthPx + dx;
        if (newWidthPx < minWidthPx) newWidthPx = minWidthPx;

        const maxPossibleWidthCurrent = currentResizing.parentWidthPx - currentResizing.startLeftPx;
        if (newWidthPx > maxPossibleWidthCurrent) {
            newWidthPx = maxPossibleWidthCurrent;
        }

        if (adjacent) {
            let newAdjacentLeftPx = currentResizing.startLeftPx + newWidthPx + spaceBetweenElementsPx;
            let newAdjacentWidthPx = (currentResizing.adjacentStartLeftPx + currentResizing.adjacentStartWidthPx) - newAdjacentLeftPx;

            if (newAdjacentWidthPx < minWidthPx) {
                newAdjacentWidthPx = minWidthPx;
                newAdjacentLeftPx = (currentResizing.adjacentStartLeftPx + currentResizing.adjacentStartWidthPx) - newAdjacentWidthPx;
                newWidthPx = newAdjacentLeftPx - spaceBetweenElementsPx - currentResizing.startLeftPx;
                if (newWidthPx < minWidthPx) newWidthPx = minWidthPx;
            }

            if (newAdjacentLeftPx + newAdjacentWidthPx > currentResizing.parentWidthPx) {
                newAdjacentWidthPx = currentResizing.parentWidthPx - newAdjacentLeftPx;
                 if (newAdjacentWidthPx < minWidthPx) {
                    newAdjacentWidthPx = minWidthPx;
                    newAdjacentLeftPx = currentResizing.parentWidthPx - newAdjacentWidthPx;
                    newWidthPx = newAdjacentLeftPx - spaceBetweenElementsPx - currentResizing.startLeftPx;
                    if (newWidthPx < minWidthPx) newWidthPx = minWidthPx;
                }
            }
            element.style.width = `${pxToMm(newWidthPx)}mm`;
            adjacent.style.width = `${pxToMm(newAdjacentWidthPx)}mm`;
            adjacent.style.left = `${pxToMm(newAdjacentLeftPx)}mm`;
        } else {
            element.style.width = `${pxToMm(newWidthPx)}mm`;
        }
    } else if (currentResizing.direction === 'bottom') {
        let newHeightPx = currentResizing.startHeightPx + dy;
        if (newHeightPx < minHeightPx) newHeightPx = minHeightPx;

        const maxPossibleHeightCurrent = currentResizing.parentHeightPx - currentResizing.startTopPx;
         if (newHeightPx > maxPossibleHeightCurrent) {
            newHeightPx = maxPossibleHeightCurrent;
        }

        if (adjacent) {
            let newAdjacentTopPx = currentResizing.startTopPx + newHeightPx + spaceBetweenElementsPx;
            let newAdjacentHeightPx = (currentResizing.adjacentStartTopPx + currentResizing.adjacentStartHeightPx) - newAdjacentTopPx;

            if (newAdjacentHeightPx < minHeightPx) {
                newAdjacentHeightPx = minHeightPx;
                newAdjacentTopPx = (currentResizing.adjacentStartTopPx + currentResizing.adjacentStartHeightPx) - newAdjacentHeightPx;
                newHeightPx = newAdjacentTopPx - spaceBetweenElementsPx - currentResizing.startTopPx;
                if (newHeightPx < minHeightPx) newHeightPx = minHeightPx;
            }

            if (newAdjacentTopPx + newAdjacentHeightPx > currentResizing.parentHeightPx) {
                newAdjacentHeightPx = currentResizing.parentHeightPx - newAdjacentTopPx;
                if (newAdjacentHeightPx < minHeightPx) {
                    newAdjacentHeightPx = minHeightPx;
                    newAdjacentTopPx = currentResizing.parentHeightPx - newAdjacentHeightPx;
                    newHeightPx = newAdjacentTopPx - spaceBetweenElementsPx - currentResizing.startTopPx;
                    if (newHeightPx < minHeightPx) newHeightPx = minHeightPx;
                }
            }
            element.style.height = `${pxToMm(newHeightPx)}mm`;
            adjacent.style.height = `${pxToMm(newAdjacentHeightPx)}mm`;
            adjacent.style.top = `${pxToMm(newAdjacentTopPx)}mm`;
        } else {
            element.style.height = `${pxToMm(newHeightPx)}mm`;
        }
    }
}

function stopResize() {
    if (!currentResizing.element) return;
    document.body.classList.remove('is-resizing');
    currentResizing.element.classList.remove('is-resizing-element');
    if (currentResizing.adjacentElement) {
        currentResizing.adjacentElement.classList.remove('is-resizing-adjacent');
    }
    currentResizing.element = null;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    saveToLocalStorage();
}

// --- GESTION DES DONNÉES (Contenu et Styles) ---
function getContentData(contentElement) {
    const contentType = contentElement.dataset.contentType || 'html';
    let data = {};
    if (contentType === 'structured') {
        data.fields = {};
        contentElement.querySelectorAll('.data-field').forEach(field => {
            const key = field.dataset.key;
            if (!key) return;
            if (field.classList.contains('checkbox-custom')) data.fields[key] = field.dataset.checked === 'true';
            else data.fields[key] = field.innerHTML;
        });
    } else if (contentType === 'table') {
        data.rows = [];
        contentElement.querySelectorAll('tbody tr').forEach(tr => {
            const rowData = [];
            tr.querySelectorAll('td').forEach(td => {
                const editableSpan = td.querySelector('span[contenteditable="true"]');
                const checkbox = td.querySelector('.checkbox-custom');
                const directEditableTd = td.hasAttribute('contenteditable') && td.getAttribute('contenteditable') === 'true' && !editableSpan && !checkbox;
                if (checkbox) rowData.push({ type: 'checkbox', checked: checkbox.dataset.checked === 'true', key: checkbox.dataset.key });
                else if (editableSpan) rowData.push({ type: 'text', value: editableSpan.innerHTML });
                else if (directEditableTd) rowData.push({ type: 'text', value: td.innerHTML });
                else rowData.push({ type: 'html', value: td.innerHTML });
            });
            data.rows.push(rowData);
        });
    } else if (contentType === 'html') data.html = contentElement.innerHTML;
    return data;
}

function setContentData(contentElement, blocDataContent) {
    const contentType = contentElement.dataset.contentType || 'html';
    if (contentType === 'structured' && blocDataContent.fields) {
        contentElement.querySelectorAll('.data-field').forEach(field => {
            const key = field.dataset.key;
            if (!key || blocDataContent.fields[key] === undefined) return;
            if (field.classList.contains('checkbox-custom')) {
                const isChecked = blocDataContent.fields[key] === true;
                field.dataset.checked = String(isChecked);
                field.setAttribute('aria-checked', String(isChecked));
            } else field.innerHTML = blocDataContent.fields[key];
        });
    } else if (contentType === 'table' && blocDataContent.rows) {
        const tbody = contentElement.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        blocDataContent.rows.forEach(rowDataArray => {
            const tr = tbody.insertRow();
            const tableId = tbody.closest('table')?.classList.contains('comladder-table') ? 'comladder' : tbody.closest('table')?.classList.contains('timeline-table') ? 'timeline' : null;
            rowDataArray.forEach((cellData) => {
                const td = tr.insertCell();
                if (cellData.type === 'checkbox') {
                    const checkbox = document.createElement('span');
                    Object.assign(checkbox, { className: 'data-field checkbox-custom', tabIndex: 0, role: 'checkbox' });
                    checkbox.dataset.key = cellData.key;
                    const isChecked = cellData.checked === true;
                    checkbox.dataset.checked = String(isChecked);
                    checkbox.setAttribute('aria-checked', String(isChecked));
                    checkbox.addEventListener('click', function() { toggleCheckbox.call(this); });
                    checkbox.addEventListener('keydown', function(e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleCheckbox.call(this); }});
                    td.appendChild(checkbox);
                } else if (cellData.type === 'text' || typeof cellData === 'string' || (cellData && cellData.value !== undefined) ) { // Vérifier cellData avant d'accéder à .value
                    const span = document.createElement('span');
                    span.setAttribute('contenteditable', 'true');
                    span.innerHTML = cellData.value || (typeof cellData === 'string' ? cellData : '');
                    td.appendChild(span);
                } else if (cellData.type === 'html') td.innerHTML = cellData.value || '';
            });
            if (tableId === 'comladder' || tableId === 'timeline') {
                const actionCell = tr.insertCell();
                actionCell.classList.add('no-print');
                actionCell.innerHTML = '<button class="remove-row-btn" title="Supprimer ligne">-</button>';
            }
        });
    } else if (contentType === 'html' && blocDataContent.html !== undefined) contentElement.innerHTML = blocDataContent.html;
}

function collectAllData() {
    const allData = { blocs: [] };
    document.querySelectorAll('.bloc').forEach(blocDiv => {
        const blocId = blocDiv.dataset.blocId;
        if (!blocId) return;
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
    allData.classificationRecto = document.querySelector('#pageRecto .classification-footer').innerHTML;
    allData.classificationVerso = document.querySelector('#pageVerso .classification-footer').innerHTML;
    return allData;
}

function applyAllData(dataToApply) {
    if (!dataToApply || !dataToApply.blocs) { showNotification("Format de données global invalide.", 4000); return; }
    dataToApply.blocs.forEach(blocData => {
        const blocDiv = document.querySelector(`.bloc[data-bloc-id="${blocData.blocId}"]`);
        if (blocDiv) {
            const titreElement = blocDiv.querySelector('.bloc-titre');
            const contentElement = blocDiv.querySelector('.bloc-content');
            if (titreElement && blocData.title !== undefined) titreElement.innerHTML = blocData.title;
            if (contentElement && blocData.content) setContentData(contentElement, blocData.content);
            if (blocData.style) {
                ['top', 'left', 'width', 'height'].forEach(prop => {
                    if (blocData.style[prop]) blocDiv.style[prop] = blocData.style[prop];
                    // Ne pas réinitialiser ici, car si non défini, on veut garder le style CSS de base
                    // else blocDiv.style[prop] = '';
                });
            }
        } else console.warn(`Bloc ${blocData.blocId} non trouvé lors de l'import global.`);
    });
    if (dataToApply.classificationRecto !== undefined) document.querySelector('#pageRecto .classification-footer').innerHTML = dataToApply.classificationRecto;
    if (dataToApply.classificationVerso !== undefined) document.querySelector('#pageVerso .classification-footer').innerHTML = dataToApply.classificationVerso;
}

function saveToLocalStorage() {
    try {
        const data = collectAllData();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        // console.log("Data saved to localStorage:", data); // Pour débug
    } catch (e) { console.error("Erreur de sauvegarde locale:", e); showNotification("Erreur de sauvegarde locale (quota ?).", 5000); }
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            applyAllData(data);
            showNotification("Données chargées depuis la sauvegarde locale.");
        } catch (e) { console.error("Erreur de chargement local:", e); showNotification("Erreur: Impossible de charger la sauvegarde locale.", 5000); }
    }
}

function exportBlocData(blocDiv) {
    const blocId = blocDiv.dataset.blocId;
    const titreElement = blocDiv.querySelector('.bloc-titre');
    const contentElement = blocDiv.querySelector('.bloc-content');
    if (!blocId || !contentElement) {
        showNotification("Erreur: Exportation de bloc impossible.", 5000); return;
    }
    const blocDataObject = {
        blocId: blocId,
        title: titreElement ? titreElement.innerHTML : "",
        content: getContentData(contentElement),
        style: {
            top: blocDiv.style.top || undefined, left: blocDiv.style.left || undefined,
            width: blocDiv.style.width || undefined, height: blocDiv.style.height || undefined,
        }
    };
    downloadJson(JSON.stringify(blocDataObject, null, 2), `${blocId}_data.json`);
    showNotification(`Bloc "${blocId}" exporté.`);
}

function importBlocData(event, blocDiv) {
    const file = event.target.files[0];
    if (!file) return;
    const targetBlocId = blocDiv.dataset.blocId;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.blocId !== targetBlocId) {
                alert(`Erreur: Fichier pour bloc "${importedData.blocId}", attente pour "${targetBlocId}".`); return;
            }
            const titreElement = blocDiv.querySelector('.bloc-titre');
            const contentElement = blocDiv.querySelector('.bloc-content');
            if (titreElement && importedData.title !== undefined) titreElement.innerHTML = importedData.title;
            if (contentElement && importedData.content) setContentData(contentElement, importedData.content);
            if (importedData.style) {
                ['top', 'left', 'width', 'height'].forEach(prop => {
                    if (importedData.style[prop]) blocDiv.style[prop] = importedData.style[prop];
                    else blocDiv.style[prop] = ''; // Réinitialiser si non présent
                });
            }
            showNotification(`Bloc "${targetBlocId}" importé.`);
            saveToLocalStorage();
        } catch (err) { alert("Erreur lecture fichier JSON: " + err.message); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportAllData() {
    const allData = collectAllData();
    downloadJson(JSON.stringify(allData, null, 2), 'datacard_CIET_all_data.json');
    showNotification("Toutes les données exportées.");
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            applyAllData(importedData);
            showNotification("Toutes les données importées.");
            saveToLocalStorage();
        } catch (err) { alert("Erreur lecture fichier JSON global: " + err.message); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function confirmClearAllData() {
    if (confirm("Vider toute la datacard et réinitialiser les tailles des blocs ?")) {
        document.querySelectorAll('.bloc').forEach(blocDiv => {
            const contentElement = blocDiv.querySelector('.bloc-content');
            // Réinitialiser le contenu
            if (contentElement) {
                const contentType = contentElement.dataset.contentType || 'html';
                 if (contentType === 'structured') contentElement.querySelectorAll('.data-field').forEach(f => { if (f.classList.contains('checkbox-custom')) { f.dataset.checked = "false"; f.setAttribute('aria-checked', "false");} else f.innerHTML = '';});
                 else if (contentType === 'table') {
                     contentElement.querySelectorAll('tbody td span[contenteditable="true"]').forEach(s => s.innerHTML = '');
                     contentElement.querySelectorAll('tbody td .checkbox-custom').forEach(cb => {cb.dataset.checked = "false"; cb.setAttribute('aria-checked', "false");});
                     // Optionnel: supprimer les lignes sauf la première ou un certain nombre de lignes par défaut
                     const tbody = contentElement.querySelector('tbody');
                     if (tbody) {
                         // Garder un nombre minimal de lignes, par exemple 1
                         // while (tbody.rows.length > 1) { tbody.deleteRow(1); }
                     }
                 }
                 else if (contentType === 'html') contentElement.innerHTML = '';
            }
            // Réinitialiser les styles inline pour revenir aux styles CSS par défaut
            ['top', 'left', 'width', 'height'].forEach(prop => blocDiv.style[prop] = '');
        });
        document.querySelector('#pageRecto .classification-footer').innerHTML = "CLASSIFICATION :";
        document.querySelector('#pageVerso .classification-footer').innerHTML = "CLASSIFICATION :";
        showNotification("Datacard vidée et tailles réinitialisées.");
        saveToLocalStorage();
    }
}

function downloadJson(jsonData, filename) {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function showNotification(message, duration = 2500) {
    const area = document.getElementById('notification-area');
    if (!area) return;
    area.textContent = message; area.classList.add('show');
    setTimeout(() => area.classList.remove('show'), duration);
}

function addTableRow(tbodyElement, tableId) {
    if (!tbodyElement) return;
    const newRow = tbodyElement.insertRow();
    let structureDefinition = [];
    const numLine = tbodyElement.rows.length; // Pour générer des clés uniques si besoin

    // Définir la structure des cellules pour chaque type de table
    if (tableId === 'comladder') structureDefinition = [ { type: 'text', value: String(numLine) }, { type: 'text' }, { type: 'text' }, { type: 'text' }, { type: 'checkbox', key: `b1l${numLine}x` }, { type: 'text' }, { type: 'text' }, { type: 'text' }, { type: 'checkbox', key: `b2l${numLine}x` }, { type: 'text' }, { type: 'text' }, { type: 'text' }, { type: 'checkbox', key: `b3l${numLine}x` }, { type: 'text' }, { type: 'text' }, { type: 'text' }, { type: 'checkbox', key: `b4l${numLine}x` }, { type: 'text' } ];
    else if (tableId === 'timeline') structureDefinition = [ {type:'text'}, {type:'text'}, {type:'text'}, {type:'text'}, {type:'text'}, {type:'text'}, {type:'text'} ];
    else if (tableId === 'externalContracts' || tableId === 'elementPackageContracts') structureDefinition = [ {type:'text'}, {type:'text'}, {type:'text'}, {type:'text'} ];
    else if (tableId === 'generalCodewords') structureDefinition = [ {type:'text'}, {type:'text'}]; // Pour le tableau à 2 colonnes
    else structureDefinition = [{type:'text'},{type:'text'},{type:'text'}]; // Ligne par défaut pour les autres tables

    structureDefinition.forEach(cellDef => {
        const cell = newRow.insertCell();
        if (cellDef.type === 'checkbox') {
            const checkbox = document.createElement('span');
            Object.assign(checkbox, { className: 'data-field checkbox-custom', tabIndex: 0, role: 'checkbox' });
            checkbox.dataset.key = cellDef.key; checkbox.dataset.checked = 'false'; checkbox.setAttribute('aria-checked', 'false');
            checkbox.addEventListener('click', function() { toggleCheckbox.call(this); });
            checkbox.addEventListener('keydown', function(e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleCheckbox.call(this); }});
            cell.appendChild(checkbox);
        } else {
            const span = document.createElement('span');
            span.setAttribute('contenteditable', 'true');
            span.innerHTML = cellDef.value || '';
            cell.appendChild(span);
        }
    });
    const actionCell = newRow.insertCell();
    actionCell.classList.add('no-print');
    actionCell.innerHTML = '<button class="remove-row-btn" title="Supprimer cette ligne">-</button>';
    saveToLocalStorage();
}

function removeTableRow(rowElement) {
    if (!rowElement) return;
    rowElement.remove();
    saveToLocalStorage();
}