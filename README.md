# Cookie Partner Counter

Outil pour compter automatiquement le nombre de partenaires affichés dans les bandeaux de consentement aux cookies (RGPD/GDPR).

## 🚀 Solution recommandée : Bookmarklet

La méthode la plus simple et la plus fiable est d'utiliser le **bookmarklet** fourni. Ouvrez `bookmarklet.html` dans votre navigateur pour l'installer.

### Avantages du bookmarklet :
- ✅ Fonctionne sur tous les sites
- ✅ Pas besoin d'installation de dépendances
- ✅ Détecte automatiquement la plateforme de consentement
- ✅ Résultats instantanés

## Description

Cet outil analyse les sites web et compte le nombre de partenaires publicitaires listés dans les bandeaux de cookies. Il supporte plusieurs plateformes de gestion de consentement :

- **Didomi** (utilisé par iGen.fr et beaucoup de sites français)
- **OneTrust**
- **Quantcast Choice**
- **Cookiebot**
- Autres plateformes (détection générique)

## 📦 Fichiers disponibles

1. **`bookmarklet.html`** - Page web avec le bookmarklet (✨ Recommandé)
2. **`GUIDE.md`** - Guide détaillé pour l'inspection manuelle
3. **`cookie-counter.js`** - Script Node.js avec Puppeteer (nécessite Chrome)
4. **`cookie-counter-simple.js`** - Version simplifiée (limitée)

## Installation (pour les scripts Node.js)

⚠️ **Note** : Les scripts Node.js ont des limitations car les bandeaux de cookies sont chargés par JavaScript. Le bookmarklet est la solution recommandée.

```bash
npm install
```

## Utilisation

### Option 1 : Bookmarklet (Recommandé)

1. Ouvrez `bookmarklet.html` dans votre navigateur
2. Glissez le bouton "🔍 Compter les Partenaires Cookies" dans votre barre de favoris
3. Visitez n'importe quel site avec un bandeau de cookies
4. Cliquez sur le bookmarklet dans vos favoris
5. Le nombre de partenaires s'affiche automatiquement

### Option 2 : Script avec Puppeteer (nécessite Chrome installé)

```bash
node cookie-counter.js https://www.igen.fr/
```

### Option 3 : Script simple (limité au HTML statique)

```bash
node cookie-counter-simple.js https://www.igen.fr/
```

## Exemple de sortie

```
📊 Analyse de: https://www.igen.fr/
============================================================
✓ Bandeau de cookies détecté
📌 Plateforme détectée: didomi
✓ Panneau de personnalisation ouvert
✓ Onglet partenaires ouvert
✓ Nombre de partenaires trouvés: 94

📋 RÉSUMÉ
============================================================
https://www.igen.fr/: ✓ 94 partenaires
```

## Comment ça marche

1. **Chargement de la page** : Le script utilise Puppeteer (navigateur headless) pour charger la page web
2. **Détection du bandeau** : Il recherche les éléments DOM caractéristiques des bandeaux de cookies
3. **Identification de la plateforme** : Le script identifie quelle plateforme de consentement est utilisée
4. **Navigation dans l'interface** : Il clique sur les boutons nécessaires pour accéder à la liste des partenaires
5. **Comptage** : Il extrait le nombre de partenaires soit depuis le texte affiché, soit en comptant les éléments de la liste

## Pourquoi cet outil ?

Les bandeaux de cookies peuvent contenir des dizaines voire des centaines de partenaires publicitaires. Cet outil permet de :

- Comparer rapidement le nombre de partenaires entre différents sites
- Analyser les pratiques en matière de publicité ciblée
- Mieux comprendre l'écosystème publicitaire web
- Sensibiliser sur la quantité de données partagées

## Limitations des scripts automatiques

- ⚠️ Les bandeaux de cookies sont chargés par JavaScript et ne sont pas dans le HTML statique
- ⚠️ Puppeteer nécessite Chrome/Chromium installé
- ⚠️ Certains sites peuvent bloquer les navigateurs headless
- ⚠️ Quelques plateformes moins courantes peuvent ne pas être détectées

👉 **C'est pourquoi le bookmarklet est la solution recommandée !**

## Licence

MIT
