# Métiers & Mobilité DCIP

**En ligne : <https://lauviah83.github.io/cadam-jdmm/>**

Application du stand de la **DCIP** (Direction de la Construction, de l'Immobilier et du
Patrimoine) à la **Journée des Métiers et de la Mobilité** du **CADAM**, Nice —
Département des Alpes-Maritimes.

Trois usages en une seule application, pensée d'abord pour le téléphone du visiteur qui
scanne le QR code du stand :

1. **Découvrir le métier** — la timeline « Vie d'un projet immobilier » : 10 phases,
   3 étapes, 8 services.
2. **Jouer** — trois quiz : prévention incendie, gardiennage, sûreté.
3. **Postuler** — les postes de la DCIP et les offres du Département, à recevoir par
   courriel en ne renseignant que son adresse.

---

## État d'avancement

| Étape | État |
|---|---|
| Socle technique (thèmes, service worker, manifest, modules JS) | ✅ |
| Robot de synchronisation des offres + GitHub Actions | ✅ testé sur les données réelles |
| Chartes graphiques Design A et Design B, 35 planches | ✅ **Design A retenu** |
| Contenu extrait vers `data/*.json` | ✅ y compris le parcours |
| Vues mobile puis PC | ✅ |
| Accessibilité, performance, recette navigateur | ✅ voir ci-dessous |
| QR code et planche A5 | ✅ à régénérer avec l'URL définitive |
| Déploiement GitHub Pages | ✅ en ligne, workflow de synchronisation testé |
| Logo officiel | ⛔ non fourni — icônes provisoires |

## Qualité mesurée

| | Performance | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|
| **Production**, mobile | 98 *(médiane sur 3 passages)* | 100 | 100 | 100 |
| Local, mobile | 95 | 100 | 100 | 100 |
| Local, bureau | 99 | 100 | 100 | 100 |
| Habillage B, mobile | 99 | 100 | 100 | 100 |

axe-core (WCAG 2.1 AA) : **0 violation** sur 10 écrans × 2 formats × 2 habillages,
en local **et** sur le site déployé.

> La performance varie de 86 à 99 selon la latence du réseau et l'état du cache CDN :
> le premier chargement après un déploiement est toujours le plus lent. Le code, lui,
> ne bouge pas — aucune requête ne quitte le domaine au chargement, et le poids initial
> est de 57 ko de polices plus 44 ko de données, servis compressés.

---

## Lancer en local

Les modules JavaScript imposent un vrai serveur : ouvrir `index.html` par double-clic
ne fonctionne pas.

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Contrôles

```bash
node scripts/test-logique.mjs            # 24 assertions sur la logique métier
python3 scripts/sync_offers.py --dry-run # collecte des offres, sans écriture
```

Recette dans un vrai navigateur (parcours, clavier, hors ligne, accessibilité) :
voir `scripts/recette/LISEZMOI.md`.

## Régénérer les offres à la main

Onglet **Actions** du dépôt → « Synchronisation des offres » → **Run workflow**.
Sinon, en local : `python3 scripts/sync_offers.py`.

---

## Organisation du dépôt

```
index.html         coque de l'application
mentions.html      visionneuse des documents de docs/ (RGPD, accessibilité)
b/                 prévisualisation de l'habillage B — à supprimer après arbitrage
data/              contenu éditorial (JSON) — c'est ici qu'on modifie les textes
  offers.json        ⚠️ généré par le robot, ne jamais éditer à la main
  offers-details.json ⚠️ idem — chargé seulement à l'ouverture d'une fiche
themes/            tokens de couleur et de typographie — aucune couleur ailleurs
css/               mise en page et composants
js/                application (ES modules, sans framework ni bundler)
  views/             une vue par onglet
assets/            icônes PWA, QR code, planche A5
scripts/           robot de synchronisation, générateur de QR, recette
design/            générateur des maquettes (hors application)
docs/              RGPD, accessibilité, exploitation, charte
sources/           fichiers de référence d'origine (non publiés en ligne)
```

## Le Design A est retenu

L'habillage B reste livré et fonctionnel (`themes/b.css`, prévisualisation sur `/b/`).
Pour l'effacer définitivement, trois suppressions suffisent — tous les blocs concernés
portent le commentaire `THEME SWITCHER` :

1. le sélecteur en pied de page dans `index.html` et le `<link>` de `themes/b.css` ;
2. la fonction `brancherSelecteurTheme()` dans `js/app.js` et son appel ;
3. les fichiers `themes/b.css` et `b/index.html`.

## Choix techniques

**HTML, CSS et JavaScript natifs. Aucun framework, aucun bundler, aucune étape de build.**

GitHub Pages sert les fichiers tels quels ; la maintenance sera reprise par un agent de la
collectivité ; le projet vivra plus longtemps que n'importe quelle version de framework ;
et l'application tient largement dans ce périmètre.

Seules dépendances externes : Google Fonts, et le SDK EmailJS chargé **à la demande**,
uniquement au moment d'un envoi.

## Points ouverts

- **Logo officiel** — les icônes sont provisoires ; le SVG reste à réclamer
- **Date du 25 septembre 2026** à confirmer (`config.json` → `evenement.date_confirmee`)
- **Clés Web3Forms et EmailJS** à créer (`docs/EXPLOITATION.md` §5) — sans elles, l'application
  fonctionne en plan B : téléchargement du récapitulatif et lien `mailto:`
- **Validation du DPO** sur les prestataires d'envoi (`docs/RGPD.md`)
- **Adresse nominative** dans `config.json`, servie en clair (`docs/EXPLOITATION.md` §5 bis)
- **3 fiches de poste sur 7** sont encore en ligne ; 4 offres DCIP publiées n'ont pas de fiche

## Documentation

- [`docs/EXPLOITATION.md`](docs/EXPLOITATION.md) — mettre à jour le contenu, les clés, le robot
- [`docs/RGPD.md`](docs/RGPD.md) — données personnelles, durée de conservation, arbitrage DPO
- [`docs/ACCESSIBILITE.md`](docs/ACCESSIBILITE.md) — ce qui a été contrôlé, et ce qui ne l'a pas été
- [`docs/CHARTE.md`](docs/CHARTE.md) — les deux chartes, palettes annotées et corrections

---

Réalisé par **CONNECT 3S** — Cagnes-sur-Mer (06) — connect3s.fr
