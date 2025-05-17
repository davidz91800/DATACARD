// --- CONFIGURATION DE L'APPLICATION ---

export const LOCAL_STORAGE_KEY = 'cietDatacardFull_v5-final-complete'; // Incrémentez si la structure des données sauvegardées change

// Dimensions minimales pour le redimensionnement des blocs
export const MIN_BLOC_WIDTH_MM = 20;
export const MIN_BLOC_HEIGHT_MM = 10;
export const ESPACE_ENTRE_BLOCS_MM = 1; // Espace fixe souhaité en mm entre les blocs lors du redimensionnement lié

// Configuration des blocs :
// templateFile correspond au nom du fichier HTML (sans extension) contenant le template du bloc.
// targetVoletId correspond à l'ID du <div class="a5-volet"> où le bloc sera injecté.
export const blocConfiguration = [
    // --- RECTO ---
    { templateFile: 'msnObjectiveR', targetVoletId: 'voletGaucheRecto' },
    { templateFile: 'domesticsR', targetVoletId: 'voletGaucheRecto' },
    { templateFile: 'supportR', targetVoletId: 'voletGaucheRecto' },
    { templateFile: 'comladderR', targetVoletId: 'voletGaucheRecto' },
    { templateFile: 'timelineR', targetVoletId: 'voletGaucheRecto' },
    { templateFile: 'externalContractsR', targetVoletId: 'voletGaucheRecto' },
    { templateFile: 'elementPackageContractsR', targetVoletId: 'voletGaucheRecto' },
    { templateFile: 'tacticsHeaderR', targetVoletId: 'voletDroitRecto' },
    { templateFile: 'tacticsHold1R', targetVoletId: 'voletDroitRecto' },
    { templateFile: 'tacticsHold2R', targetVoletId: 'voletDroitRecto' },
    { templateFile: 'tacticsHold3R', targetVoletId: 'voletDroitRecto' }, // AJOUTÉ
    // { templateFile: 'tacticsJoinPackageR', targetVoletId: 'voletDroitRecto' }, // SUPPRIMÉ
    { templateFile: 'tacticsIngressR', targetVoletId: 'voletDroitRecto' },
    { templateFile: 'targetsDzOneR', targetVoletId: 'voletDroitRecto' },
    // { templateFile: 'targetsDzVannesR', targetVoletId: 'voletDroitRecto' }, // Décommentez et créez le template si besoin
    // { templateFile: 'targetsLzRennesR', targetVoletId: 'voletDroitRecto' },
    // { templateFile: 'targetsDzLfoeR', targetVoletId: 'voletDroitRecto' },
    { templateFile: 'whatIfsSafetyR', targetVoletId: 'voletDroitRecto' },
    // --- VERSO ---
    { templateFile: 'missionCodewordsV', targetVoletId: 'voletGaucheVerso' },
    { templateFile: 'generalCodewordsV', targetVoletId: 'voletGaucheVerso' },
    // Ajoutez d'autres configurations de blocs pour le verso ici
];

// Identifiants des éléments DOM fréquemment utilisés
export const DOM_ELEMENT_IDS = {
    pageRecto: 'pageRecto',
    pageVerso: 'pageVerso',
    showRectoBtn: 'showRectoBtn',
    showVersoBtn: 'showVersoBtn',
    showBothBtn: 'showBothBtn',
    printDatacardBtn: 'printDatacardBtn',
    exportAllBtn: 'exportAllBtn',
    importAllInput: 'importAllInput',
    clearAllBtn: 'clearAllBtn',
    saveLocallyBtn: 'saveLocallyBtn',
    loadLocalBtn: 'loadLocalBtn',
    datacardViewer: '.datacard-viewer', // Sélecteur de classe
    notificationArea: 'notification-area'
};

// Structure des lignes par défaut pour les tableaux dynamiques
export const TABLE_ROW_STRUCTURES = {
    comladder: (numLine) => [
        { type: 'text', value: String(numLine) }, { type: 'text' },
        { type: 'text' }, { type: 'text' }, { type: 'checkbox', key: `b1l${numLine}x` }, { type: 'text' },
        { type: 'text' }, { type: 'text' }, { type: 'checkbox', key: `b2l${numLine}x` }, { type: 'text' },
        { type: 'text' }, { type: 'text' }, { type: 'checkbox', key: `b3l${numLine}x` }, { type: 'text' },
        { type: 'text' }, { type: 'text' }, { type: 'checkbox', key: `b4l${numLine}x` }, { type: 'text' }
    ],
    timeline: () => [
        { type: 'text' }, { type: 'text' }, { type: 'text' }, { type: 'text' },
        { type: 'text' }, { type: 'text' }, { type: 'text' }
    ],
    externalContracts: () => [
        { type: 'text' }, { type: 'text' }, { type: 'text' }, { type: 'text' }
    ],
    elementPackageContracts: () => [
        { type: 'text' }, { type: 'text' }, { type: 'text' }, { type: 'text' }
    ],
    generalCodewords: () => [
        { type: 'text' }, { type: 'text' }
    ],
    default: () => [ // Structure par défaut si l'ID de table n'est pas reconnu
        { type: 'text' }, { type: 'text' }, { type: 'text' }
    ]
};