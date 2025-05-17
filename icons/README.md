# Datacard Numérique CIET

Application web progressive (PWA) pour la création, la gestion et l'impression de fiches de données de mission ("datacards") personnalisables, spécifiquement conçue pour le CIET (Centre d'Instruction des Équipages de Transport).

## Objectif

L'application vise à remplacer les datacards papier ou les solutions bureautiques complexes par une interface numérique intuitive, accessible hors-ligne, et facilement partageable. Elle permet aux utilisateurs de :

*   Remplir des informations structurées et du contenu libre dans différents "blocs" prédéfinis.
*   Personnaliser la disposition et la taille des blocs sur des volets A5 (recto/verso d'une page A4 paysage).
*   Sauvegarder et charger les données localement dans le navigateur.
*   Exporter et importer l'ensemble de la datacard ou des blocs individuels au format JSON.
*   Imprimer la datacard au format A4 paysage, prête à être pliée.
*   Utiliser l'application en mode hors-ligne grâce à un Service Worker.

## Structure de l'Application

L'application est structurée de la manière suivante :

*   **`index.html`**: Point d'entrée principal de l'application. Il contient la structure de base de la page (volets recto/verso) et charge les CSS et scripts JavaScript.
*   **`manifest.json`**: Fichier de manifeste pour la PWA, décrivant l'application pour l'installation et l'affichage.
*   **`sw.js`**: Service Worker responsable de la mise en cache des ressources de l'application pour le fonctionnement hors-ligne.
*   **Fichiers `.html` (templates de blocs)**: Situés à la racine (ex: `msnObjectiveR.html`, `comladderR.html`). Chaque fichier contient le fragment HTML d'un bloc spécifique de la datacard. Ces templates sont chargés dynamiquement par JavaScript.
*   **Fichiers `.css`**: Situés à la racine et modularisés par fonctionnalité :
    *   `base.css`: Styles de base et réinitialisation.
    *   `layout.css`: Styles pour la mise en page A4/A5, volets.
    *   `bloc-core.css`: Styles communs à tous les blocs (structure, titre, contenu).
    *   `bloc-positions.css`: Positionnement et dimensions par défaut des blocs.
    *   `bloc-ui.css`: Styles pour les éléments d'interface dans les blocs (champs de données, cases à cocher, actions).
    *   `tables.css`: Styles spécifiques pour les tableaux.
    *   `global-ui.css`: Styles pour les éléments globaux (barre d'actions, notifications).
    *   `resize.css`: Styles pour les poignées de redimensionnement des blocs.
    *   `print.css`: Styles spécifiques pour l'impression.
*   **Fichiers `.js` (modules JavaScript)**: Situés à la racine, chacun gérant une partie spécifique de la logique de l'application :
    *   `app.js`: Script principal, initialise l'application et coordonne les autres modules.
    *   `config.js`: Contient la configuration des blocs (quels templates charger et où les injecter), les constantes (clés de LocalStorage, dimensions minimales, etc.).
    *   `blocManager.js`: Gère le chargement (via `fetch`) et le rendu initial des blocs HTML à partir des fichiers de templates.
    *   `uiInteractions.js`: Gère les interactions utilisateur globales (boutons d'impression, export/import global, sauvegarde/chargement local, vidage, bascule recto/verso) et les interactions spécifiques aux blocs (cases à cocher, ajout/suppression de lignes dans les tableaux). Initialise les écouteurs d'événements pour ces actions.
    *   `resizeManager.js`: Gère la logique de redimensionnement des blocs (détection du mousedown sur les poignées, calcul des nouvelles dimensions, interaction avec les blocs adjacents).
    *   `dataManager.js`: Contient les fonctions pour extraire les données des blocs (`getContentData`), appliquer des données aux blocs (`setContentData`), et collecter/appliquer toutes les données de la datacard.
    *   `storageManager.js`: Gère la sauvegarde et le chargement des données depuis/vers le LocalStorage du navigateur.
    *   `importExport.js`: Gère la logique d'exportation des données en fichiers JSON et d'importation à partir de fichiers JSON.
    *   `utils.js`: Fonctions utilitaires (conversion px/mm, téléchargement de fichiers, affichage de notifications, etc.).
*   **`icons/`**: Dossier contenant les icônes de l'application pour la PWA.
*   **`screenshots/`**: Dossier contenant les captures d'écran pour le manifeste PWA.
*   **`favicon.ico`**: Icône de favori standard.

### Flux de Données et d'Interactions typique :

1.  **Initialisation (`app.js`, `config.js`, `blocManager.js`)**:
    *   `app.js` est chargé.
    *   Les configurations des blocs sont lues depuis `config.js`.
    *   `blocManager.js` charge le contenu HTML de chaque template de bloc (ex: `msnObjectiveR.html`) via `fetch` et l'injecte dans les volets appropriés de `index.html`.
2.  **Interactions Utilisateur (`uiInteractions.js`, `resizeManager.js`)**:
    *   L'utilisateur modifie le contenu d'un champ, coche une case, ajoute une ligne à un tableau. `uiInteractions.js` gère ces événements.
    *   L'utilisateur redimensionne un bloc. `resizeManager.js` prend le relais.
3.  **Gestion des Données (`dataManager.js`, `storageManager.js`, `importExport.js`)**:
    *   Lors d'une modification ou d'une action de sauvegarde, `dataManager.js` collecte les données actuelles des blocs.
    *   `storageManager.js` sauvegarde ces données dans LocalStorage.
    *   Pour l'export/import, `importExport.js` utilise `dataManager.js` pour sérialiser/désérialiser les données et interagir avec le système de fichiers.
4.  **Service Worker (`sw.js`)**:
    *   À la première visite, le Service Worker met en cache les ressources statiques de l'application.
    *   Lors des visites suivantes, il sert les ressources depuis le cache, permettant un chargement rapide et une utilisation hors-ligne.

## Pour Commencer

1.  Clonez le dépôt.
2.  Ouvrez `index.html` dans un navigateur web moderne.
3.  Pour un fonctionnement optimal (PWA, hors-ligne), il est recommandé de servir les fichiers via un serveur web local (même simple, ex: `python -m http.server` ou l'extension Live Server de VSCode).

## Contribution

Les suggestions et contributions sont les bienvenues. Veuillez ouvrir une issue pour discuter des changements majeurs.