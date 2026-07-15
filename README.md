# Calculateur de prix

Application web pour calculer les prix de vente TTC de variantes d'un produit vendues au poids, à partir du coût d'achat au kg et d'un taux de marque cible.

**App en ligne : https://rycosyl-ctrl.github.io/calculateur-prix/**

## Logique de calcul

1. **Coût d'achat au kg** + marge fixe de 5 % → coût ajusté.
2. **Surpoids par tranche** (paramétrable) : grammes offerts ajoutés au coût de chaque variante (ex : +0,5 g de 3 à 50 g, +1 g à partir de 100 g). N'affecte pas le prix affiché.
3. **Variante de référence** (au choix) : son prix HT est calculé pour respecter le taux de coût sur CA cible (ex : 30 %, soit 70 % de taux de marque), puis converti en TTC avec la TVA (20 % par défaut).
4. **Écart inter-variante** (fixe en €/g ou en %) : les autres variantes sont dérivées de proche en proche — les poids plus petits sont plus chers au gramme, les plus gros moins chers.
5. **Prix avant promo** : un pourcentage global (ex : −70 %) calcule le prix barré correspondant.

Toute la configuration est modifiable dans l'interface et sauvegardée automatiquement dans le navigateur (localStorage). Boutons Exporter / Importer pour sauvegarder la configuration en JSON.

## Développement

```bash
npm install
npm run dev     # serveur de développement
npm test        # tests unitaires du moteur de calcul
npm run build   # build de production
```

## Stack

React · TypeScript · Vite · Tailwind CSS · Vitest · Zod. Déployé sur GitHub Pages via GitHub Actions (les tests bloquent le déploiement).
