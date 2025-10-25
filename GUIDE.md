# Guide : Comment compter les partenaires dans les bandeaux de cookies

## Contexte

Les bandeaux de consentement aux cookies (RGPD/GDPR) sont souvent générés dynamiquement par JavaScript et ne sont pas visibles dans le HTML statique. Cela rend difficile leur analyse automatique sans un navigateur complet.

## Méthode 1 : Inspection manuelle dans le navigateur (la plus fiable)

### Pour igen.fr et les sites utilisant Didomi

1. **Ouvrir le site** dans votre navigateur (ex: https://www.igen.fr/)

2. **Lorsque le bandeau de cookies apparaît**, cherchez le bouton "Personnaliser" ou "En savoir plus"

3. **Cliquer sur ce bouton** pour ouvrir le panneau de configuration

4. **Chercher l'onglet "Nos partenaires"** ou "Partenaires"

5. **Le nombre de partenaires** est généralement affiché en haut de la liste :
   - Format : "94 partenaires" ou "Partenaires (94)"

### Pour d'autres plateformes

- **OneTrust** : Bouton "Cookie Settings" ou "Paramètres des cookies"
- **Quantcast** : Lien "Show purposes" ou "Voir les finalités"
- **Cookiebot** : Bouton "Détails" ou "Details"

## Méthode 2 : Utiliser la console du navigateur

1. Ouvrir le site dans un navigateur
2. Appuyer sur `F12` pour ouvrir les outils de développement
3. Aller dans l'onglet "Console"
4. Essayer ces commandes selon la plateforme :

### Pour Didomi

```javascript
// Obtenir la liste des vendors/partenaires
window.Didomi?.getUserConsentStatusForAll()?.vendors || "Non disponible"

// Compter le nombre de vendors
Object.keys(window.Didomi?.getUserConsentStatusForAll()?.vendors || {}).length
```

### Pour OneTrust

```javascript
// Liste des vendors
window.OneTrust?.GetDomainData()?.VendorsSummary?.length
```

### Pour Quantcast (TCF - Transparency & Consent Framework)

```javascript
// Utiliser l'API TCF
__tcfapi('getVendorList', 2, (vendorList, success) => {
  if (success) {
    console.log('Nombre de vendors:', Object.keys(vendorList.vendors).length);
  }
});
```

## Méthode 3 : Extension de navigateur (à venir)

Une extension Chrome/Firefox pourrait être développée pour :
- Détecter automatiquement les bandeaux de cookies
- Extraire le nombre de partenaires
- Générer un rapport pour plusieurs sites

## Exemples de résultats

| Site | Plateforme | Nombre de partenaires |
|------|------------|----------------------|
| igen.fr | Didomi | 94 |
| lemonde.fr | OneTrust | ~300 |
| 20minutes.fr | Didomi | ~200 |

## Pourquoi c'est important

Le nombre de partenaires indique combien d'entreprises tierces peuvent :
- Collecter vos données de navigation
- Vous afficher de la publicité ciblée
- Créer des profils publicitaires
- Partager vos données avec d'autres entités

Plus le nombre est élevé, plus vos données sont potentiellement partagées largement.

## Limitations de l'automatisation

Les scripts automatiques (sans navigateur headless) ne peuvent pas :
- Interagir avec les éléments JavaScript
- Cliquer sur les boutons du bandeau
- Accéder au contenu chargé dynamiquement

Pour une solution complète, il faudrait :
- Utiliser Puppeteer ou Playwright (navigateur headless)
- Disposer d'un environnement avec Chrome/Chromium installé
- Gérer les différences entre plateformes de consentement

## Scripts disponibles dans ce projet

- `cookie-counter.js` : Version avec Puppeteer (nécessite installation de Chrome)
- `cookie-counter-simple.js` : Version simplifiée (limitée au HTML statique)
- Ce guide : Instructions pour inspection manuelle
