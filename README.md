# Métiers & Mobilité DCIP

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
| Socle technique (thèmes, service worker, manifest, modules JS) | ✅ fait |
| Robot de synchronisation des offres + GitHub Actions | ✅ fait et testé sur les données réelles |
| Documentation (RGPD, exploitation) | ✅ fait |
| Chartes graphiques Design A / Design B (Claude Design) | ⏳ en attente des fichiers sources |
| Extraction du contenu vers `data/*.json` | ⏳ en attente des fichiers sources |
| Vues mobile puis PC | ⏳ après validation des maquettes |

Les fichiers de référence attendus sont listés dans `sources/A-DEPOSER-ICI.md`.

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

## Régénérer les offres à la main

Onglet **Actions** du dépôt → « Synchronisation des offres » → **Run workflow**.
Sinon, en local : `python3 scripts/sync_offers.py`.

---

## Organisation du dépôt

```
data/          contenu éditorial (JSON) — c'est ici qu'on modifie les textes
  offers.json    ⚠️ généré par le robot, ne jamais éditer à la main
themes/        tokens de couleur et de typographie — aucune couleur ailleurs
css/           mise en page et composants
js/            application (ES modules, sans framework ni bundler)
scripts/       robot de synchronisation des offres + contrôles
docs/          RGPD, exploitation, charte
sources/       fichiers de référence d'origine (non publiés en ligne)
```

## Choix techniques

**HTML, CSS et JavaScript natifs. Aucun framework, aucun bundler, aucune étape de build.**

GitHub Pages sert les fichiers tels quels ; la maintenance sera reprise par un agent de la
collectivité ; le projet vivra plus longtemps que n'importe quelle version de framework ;
et l'application tient largement dans ce périmètre.

Seules dépendances externes : Google Fonts, et le SDK EmailJS chargé **à la demande**,
uniquement au moment d'un envoi.

## Points ouverts

- Date de l'événement à confirmer (`data/config.json` → `evenement.date`)
- Clés Web3Forms et EmailJS à créer (voir `docs/EXPLOITATION.md` §5)
- Validation du DPO sur les prestataires d'envoi (voir `docs/RGPD.md`)
- Logo officiel en SVG à réclamer — les icônes actuelles sont provisoires

## Documentation

- [`docs/EXPLOITATION.md`](docs/EXPLOITATION.md) — mettre à jour le contenu, les clés, le robot
- [`docs/RGPD.md`](docs/RGPD.md) — données personnelles, durée de conservation, arbitrage DPO
- `docs/CHARTE.md` — chartes graphiques (à produire avec les sources)

---

Réalisé par **CONNECT 3S** — Cagnes-sur-Mer (06) — connect3s.fr
