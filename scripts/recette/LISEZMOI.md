# Recette automatisée

Quatre scripts qui pilotent un vrai navigateur. Ils ne sont pas nécessaires pour faire
tourner l'application : ils servent à vérifier qu'elle marche encore après une modification.

| Script | Ce qu'il vérifie |
|---|---|
| `tester-app.mjs` | Démarrage, navigation, listes, sélection, premier écran de quiz |
| `tester-parcours.mjs` | Un quiz de bout en bout, la question à réponses multiples, le formulaire en plan B, le mode hors ligne, l'affichage PC |
| `tester-clavier.mjs` | Ordre de tabulation, focus visible, piège de focus de la modale, raccourcis des quiz |
| `audit-a11y.mjs` | axe-core (WCAG 2.1 AA) sur 10 écrans × 2 formats |

## Prérequis

`chromium` sur la machine, et `playwright-core` (le pilote seul, sans navigateur embarqué) :

```bash
npm install playwright-core axe-core
```

## Lancer

```bash
python3 -m http.server 8123          # dans un premier terminal, à la racine du dépôt
node scripts/recette/tester-app.mjs  # dans un second
node scripts/recette/tester-parcours.mjs
node scripts/recette/tester-clavier.mjs
node scripts/recette/audit-a11y.mjs
```

L'audit d'accessibilité accepte une autre adresse, pour contrôler le second habillage :

```bash
URL_BASE="http://127.0.0.1:8123/?theme=b" node scripts/recette/audit-a11y.mjs
```

## Lighthouse

```bash
CHROME_PATH=/usr/bin/chromium npx lighthouse@12 http://127.0.0.1:8123/ \
  --form-factor=mobile --screenEmulation.mobile \
  --chrome-flags="--headless --no-sandbox"
```

> Le serveur `python -m http.server` ne compresse rien. Lighthouse signale donc
> « Enable text compression » : cet avertissement disparaît en production, GitHub Pages
> servant les fichiers en gzip. Les scores relevés en local sont donc **pessimistes**.

## Relevé du 4 septembre 2026

| | Performance | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|
| Mobile | 94 | 100 | 100 | 100 |
| Bureau | 99 | 100 | 100 | 100 |
| Habillage B, mobile | 99 | 100 | 100 | 100 |

axe-core : **0 violation** sur 10 écrans × 2 formats, dans les deux habillages.
