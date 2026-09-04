# PROMPT POUR CLAUDE CODE — Application « Métiers & Mobilité DCIP » (CADAM / Département des Alpes-Maritimes)

> Copier-coller l'intégralité de ce document dans Claude Code, dans un dossier de travail vide.
> Avant de lancer : déposer dans `sources/` les 4 fichiers de référence (voir §2) et le logo du Département.

---

## 0. TON RÔLE

Tu es l'architecte et le développeur de cette application. Tu travailles en autonomie mais tu produis **deux propositions de design distinctes**, et tu utilises **Claude Design** (skill `design`) pour concevoir visuellement avant de coder.

Règle absolue : **on conçoit d'abord, on code ensuite.** Aucune ligne de HTML applicatif avant que les maquettes Claude Design ne soient produites et validées.

---

## 1. CONTEXTE

Le **Département des Alpes-Maritimes** tient un stand à la **Journée des Métiers et de la Mobilité (JDMM)** au **CADAM** (Centre Administratif Départemental, Nice). Le stand est porté par la **DCIP — Direction de la Construction, de l'Immobilier et du Patrimoine**.

Sur ce stand, trois choses se passent :

1. On **présente le métier** de la DCIP via une timeline « Vie d'un projet immobilier » (10 phases, 3 grandes étapes, 8 services) — déjà produite en roll-up 60×160 cm.
2. On **joue** : trois quiz interactifs (prévention incendie, gardiennage, sûreté) — « jouez et remportez des goodies ».
3. On **recrute** : les agents en mobilité interne et les visiteurs découvrent les postes vacants et repartent avec les infos.

**Aujourd'hui**, ces trois briques sont trois fichiers HTML séparés, non reliés, non hébergés, avec des données codées en dur.

**Objectif** : en faire **une seule application web**, hébergée sur **GitHub Pages**, accessible depuis n'importe où via URL/QR code, **utilisable en priorité sur mobile** (les visiteurs scannent le QR du stand avec leur téléphone), avec une version PC pour l'écran/borne du stand et pour la consultation bureau.

**Fonction clé** : un visiteur intéressé par un ou plusieurs postes doit pouvoir, **en renseignant simplement son adresse email**, recevoir par mail le récapitulatif des offres qu'il a sélectionnées.

---

## 2. SOURCES FOURNIES (dossier `sources/`)

| Fichier | Ce qu'il contient | Statut |
|---|---|---|
| `dcip_postes.html` | 7 fiches de postes DCIP complètes (titre, service, catégorie, filière, missions, profil, lieu, deadline, URL départementale), navigation liste → fiche → formulaire, envoi EmailJS, charte graphique institutionnelle | **Référence contenu + charte** |
| `quiz-hub-mobile.html` | Hub 3 quiz + les 3 quiz complets (questions, options, corrections rédigées, verdicts par palier), version mobile | **Référence contenu quiz** |
| `quiz-hub-pc.html` | Même contenu, mise en page PC | Référence layout PC |
| `quiz-hub.html` | Version initiale | Historique — ne pas reprendre |
| `timeline_rollup_60x160cm.pdf` | Le roll-up : 10 phases, 3 étapes (Conception / Réalisation / Exploitation), les 8 services intervenants par phase | **Référence contenu timeline** |
| `logo-cd06.png` | Logo officiel du Département des Alpes-Maritimes (blason + bloc « 06 ») | **Base de la charte Design B** |

**Consigne** : lis intégralement ces fichiers avant toute chose. **Tout le contenu rédactionnel existant est validé — tu le reprends tel quel, tu ne le réécris pas.** Tu l'extrais et tu le structures en données (`data/*.json`).

Corrige uniquement les bugs manifestes repérés dans les sources (ex. dans `quiz-hub-mobile.html` : sélecteurs CSS cassés du type `#qz-feu /* commentaire */ .brand-row`, classes `.QF_score-big` incohérentes avec le CSS `.score-big`, compteurs « /8 » codés en dur alors que le tableau contient 6 ou 9 questions, mentions « QF_questions » / « QG_questions » polluées par un renommage automatique dans les textes affichés à l'utilisateur).

---

## 3. LIVRABLES ATTENDUS

### 3.1 Deux propositions de design — À LIVRER LES DEUX

| | **Design A — « Institutionnel »** | **Design B — « Signature »** |
|---|---|---|
| Principe | **Respecte strictement la charte des fichiers du projet.** Tokens, typographies, composants, esprit éditorial repris à l'identique. | **Charte créée par toi avec Claude Design**, dérivée du **logo du Département** (blason bleu / or / rouge, bloc « 06 »). Plus affirmée, plus « produit ». |
| Typos | `Fraunces` (titres, serif variable), `Manrope` (texte), `JetBrains Mono` (labels/eyebrows) | À proposer — 2 familles max, chargées depuis Google Fonts, avec fallback système |
| Couleurs | `--b9:#042C53` `--b8:#0C447C` `--b6:#185FA5` `--b4:#378ADD` `--b1:#B5D4F4` `--b0:#E6F1FB` / accent `--a2:#EF9F27` / teal `--t6:#0F6E56` / rouge `--c6:#993C1D` / fonds `#FAFAF8` `#F6F4EF` | Extraites du logo : bleu institutionnel du bloc « 06 », or héraldique des fleurs de lys, rouge du blason en accent d'alerte. Palette complète claire + sombre. |
| Ambiance quiz | Fonds sombres par thème (feu `#0F0E0C`/`#E94B1F`, gardiennage `#0B0E14`/`#3B82F6`, sûreté `#0A0D14`/`#3D6FE8`) — à conserver | Libre, mais cohérente avec le reste de l'app |
| Contrainte commune | **Aucune** — c'est la version « safe », présentable en interne sans discussion | Doit rester **crédible pour une collectivité territoriale** : pas de dégradé gratuit, pas de néon, sobriété assumée |

Les deux designs partagent **exactement le même contenu, la même structure de données et les mêmes fonctionnalités**. Seule la couche visuelle change : elle doit être isolée dans des **fichiers de tokens CSS** (`themes/a.css`, `themes/b.css`) — donc **aucune couleur ni police en dur** dans le code applicatif, uniquement des `var(--…)`.

Les deux designs sont accessibles simultanément sur le site déployé :
- `/` → Design A (par défaut)
- `/b/` → Design B
- ou bascule via `?theme=a|b` mémorisée en `localStorage`, plus un petit sélecteur discret en pied de page (à retirer facilement une fois le choix fait — commente-le clairement `<!-- THEME SWITCHER — à supprimer après arbitrage -->`).

### 3.2 Deux versions — mobile et PC

| | **Mobile (priorité 1)** | **PC / borne (priorité 2)** |
|---|---|---|
| Cible | Visiteur qui scanne le QR code du stand | Écran de la borne du stand + consultation bureau |
| Sensation | **Ça doit se comporter comme une application native, pas comme un site web** | Application web classique, large, lisible à 2 m sur écran de borne |
| Navigation | **Bottom tab bar fixe** (4 onglets : Métiers · Quiz · Postes · Ma sélection), transitions de vue, pas de scroll horizontal, retour physique géré (`history.pushState`) | Barre de navigation haute + contenu centré `max-width: 1100px` |
| Contraintes | `safe-area-inset-*` (encoche iPhone), cibles tactiles ≥ 48 px, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: contain`, `touch-action` maîtrisé, aucun `:hover` porteur d'information | Hover/focus riches, raccourcis clavier sur les quiz (1-4 pour répondre, Entrée pour valider) |
| PWA | **Oui** : `manifest.webmanifest` (icônes 192/512 + maskable, `display: standalone`, `theme_color`), service worker de cache (app shell + `offers.json`), installable « Ajouter à l'écran d'accueil » | Bénéficie du même SW |
| Mode hors-ligne | Obligatoire pour les quiz et la timeline (le wifi d'un hall d'expo est toujours mauvais). Les offres servies depuis le cache avec bandeau « Données du JJ/MM ». La file d'attente des demandes email est stockée en `localStorage` et rejouée au retour du réseau. | Idem |

**Une seule base de code responsive**, pas deux sites. Le layout mobile est le layout par défaut ; le layout PC est une amélioration progressive au-delà de `1024px`. La bottom tab bar devient une top nav au-delà de ce point de rupture.

### 3.3 Infrastructure

- Dépôt GitHub public, déployé automatiquement sur **GitHub Pages** (workflow `deploy.yml`).
- **GitHub Action de synchronisation quotidienne** des offres d'emploi (§6).
- Aucun backend, aucune base de données, aucun build step obligatoire (voir §4).

---

## 4. ARCHITECTURE TECHNIQUE

**Stack imposée : HTML + CSS + JavaScript vanilla (ES modules), zéro framework, zéro bundler.**

Justification : GitHub Pages sert directement les fichiers, la maintenance sera reprise par un agent de la collectivité, la durée de vie du projet dépasse celle de n'importe quelle version de framework, et l'app tient largement dans ce périmètre. Pas de React, pas de Vite, pas de Tailwind CDN.

```
/
├── index.html                  # shell unique, Design A
├── b/index.html                # shell unique, Design B (même JS, thème différent)
├── manifest.webmanifest
├── sw.js                       # service worker (cache app-shell + offers.json)
├── assets/
│   ├── logo-cd06.svg           # logo vectorisé
│   ├── icons/                  # icônes PWA 192/512 + maskable + favicon
│   └── timeline/               # illustrations/pictos des 10 phases
├── themes/
│   ├── tokens.css              # variables communes (espacements, rayons, ombres, typo scale)
│   ├── a.css                   # Design A — palette institutionnelle
│   └── b.css                   # Design B — palette issue du logo
├── css/
│   ├── base.css                # reset, typo, utilitaires
│   ├── layout.css              # shell, tab bar, top nav, breakpoints
│   └── components.css          # cartes, boutons, champs, badges, feuille modale…
├── js/
│   ├── app.js                  # routeur (hash-based), init, gestion des vues
│   ├── views/
│   │   ├── metiers.js          # timeline + 8 services
│   │   ├── quiz.js             # moteur de quiz générique (voir §5.2)
│   │   ├── postes.js           # liste + filtres + fiche
│   │   └── selection.js        # panier + formulaire email
│   ├── store.js                # état + persistance localStorage
│   ├── mailer.js               # abstraction d'envoi (voir §7)
│   └── offers.js               # chargement offers.json + fallback + fraîcheur
├── data/
│   ├── offers.json             # GÉNÉRÉ par la GitHub Action — ne jamais éditer à la main
│   ├── postes-dcip.json        # les 7 fiches détaillées (source de vérité rédactionnelle)
│   ├── quiz.json               # les 3 quiz
│   ├── timeline.json           # 10 phases + 3 étapes + 8 services
│   └── config.json             # emails destinataires, dates de l'événement, clés publiques
├── scripts/
│   └── sync_offers.py          # scraper (voir §6)
├── .github/workflows/
│   ├── sync-offers.yml
│   └── deploy.yml
├── docs/
│   ├── CHARTE.md               # la charte issue de Claude Design (les 2 variantes)
│   ├── EXPLOITATION.md         # comment mettre à jour, qui contacter, où sont les clés
│   └── RGPD.md                 # mentions, durée de conservation, DPO
└── README.md
```

Un **moteur de quiz unique et générique** remplace les trois blocs de JS dupliqués et préfixés (`QF_`, `QG_`, `QS_`) des sources. Le moteur gère : question à réponse unique, question à réponses multiples (`multi: true`, validation exacte de l'ensemble sélectionné), feedback riche en HTML, barre de progression, récapitulatif final, verdicts par palier de score. Les données viennent de `quiz.json`.

---

## 5. ÉTAPES DE TRAVAIL

### 5.1 Étape 1 — Charte graphique avec Claude Design (AVANT tout code)

Utilise le skill **`design`** pour produire un canvas multi-artboards contenant, **pour chacun des deux designs** :

1. **Planche « Fondations »** : palette complète (avec ratios de contraste annotés), échelle typographique, échelle d'espacement, rayons, ombres, états (par défaut / survol / focus / actif / désactivé).
2. **Planche « Composants »** : bouton primaire/secondaire/danger, carte de poste, carte de quiz, option de quiz (neutre/sélectionnée/juste/fausse), champ de formulaire, badge (Nouveau / Urgent / Cat. A / Cat. B), pastille de service, bandeau hors-ligne, feuille modale mobile, tab bar.
3. **Planche « Écrans mobile »** (format 390×844, l'app doit se lire comme une app) : Accueil / Timeline métiers / Détail d'une phase / Hub quiz / Question de quiz / Résultat / Liste des postes avec filtres / Fiche de poste / Ma sélection / Formulaire email / Confirmation d'envoi.
4. **Planche « Écrans PC »** (1440×900) : les mêmes vues clés, en 4 écrans minimum.

Pour le **Design A**, tu extrais les tokens directement de `dcip_postes.html` et `quiz-hub-mobile.html` (ils sont listés au §3.1) et tu les systématises.

Pour le **Design B**, tu pars du **logo** : tu prélèves les couleurs réelles du blason et du bloc « 06 », tu construis une palette accessible autour (chaque couleur de texte doit passer AA sur son fond, 4.5:1 minimum, 3:1 pour le texte ≥ 24 px), et tu proposes une identité qui puisse s'appliquer au-delà de cette app.

Puis écris `docs/CHARTE.md` et les fichiers `themes/*.css` correspondants.

### 5.2 Étape 2 — Données

Extrais le contenu des sources vers `data/*.json` :

- `postes-dcip.json` : les 7 postes, champs `{ id, titre, service, ico, tag, cat, filiere, deadline, url, desc, missions[], profils[], contrat, lieu }`. **Le texte des missions et profils est repris mot pour mot.**
- `quiz.json` : 3 quiz `{ id, slug, titre, categorie, ico, accent, description, meta:{questions, duree, niveau, cadre}, questions:[{cat, q, multi?, options[], correct, feedback}], verdicts:[{seuil, titre, texte}] }`. **Corrige les incohérences de comptage** (le quiz « feu » contient 8 questions et annonce 9 ; « gardiennage » en contient 6 et annonce 8 ; « sûreté » en contient 6 et annonce 8) : le nombre affiché est toujours calculé depuis le tableau, jamais écrit en dur. **Nettoie les textes visibles** pollués par le renommage (`QF_questions`, `QG_questions`, `QS_Vidéoprotection`, `QS_Badge & Accès`, `QS_Alarme & Intrusion` → libellés propres).
- `timeline.json` : les 10 phases du roll-up avec `{ num, etape, titre, citation, points[], intervenants[] }`, et la liste des 8 services avec leur couleur.
- `config.json` : voir §8.

### 5.3 Étape 3 — Implémentation mobile, puis PC

Dans cet ordre. Le mobile est la cible principale.

---

## 6. SYNCHRONISATION DES OFFRES D'EMPLOI

**Source** : `https://www.departement06.fr/offres-demploi` — ~39 offres, pagination `?page=N` (10 par page), filtres par domaine d'activité / catégorie / filière / mots-clés. **Pas de flux RSS ni d'API JSON**, donc scraping HTML.

Chaque annonce de la liste expose : domaine d'activité, intitulé (lien vers la fiche), catégorie (A/B/C), filière (ADMINISTRATIVE / ANIMATION / CULTURELLE / MEDICO-SOCIALE / TECHNIQUE), date limite de candidature, courte description, date de publication. Les fiches ont des URLs de la forme `/offres-demploi/<titre-slugifie>[-<id>]`.

**`scripts/sync_offers.py`** :

- Python 3 + `requests` + `beautifulsoup4`, dépendances épinglées dans `scripts/requirements.txt`.
- Parcourt toutes les pages jusqu'à épuisement (arrêt sur page vide ou absence de lien « Suivant »), `User-Agent` explicite et honnête (`CD06-JDMM-bot/1.0 (+<url du repo>)`), **délai de 1 s entre requêtes**, timeout 20 s, 3 tentatives avec backoff.
- Visite chaque fiche pour récupérer le détail (mission, profil, conditions) **uniquement si la fiche n'est pas déjà en cache** (`data/.cache/<slug>.json`, comparaison par date de publication) — pour ne pas marteler le site à chaque exécution.
- Produit `data/offers.json` :
  ```json
  {
    "generated_at": "2026-09-04T04:00:00Z",
    "source": "https://www.departement06.fr/offres-demploi",
    "count": 39,
    "offers": [
      { "id":"…", "titre":"…", "url":"…", "domaine":"…", "categorie":"A",
        "filiere":"TECHNIQUE", "deadline":"2026-10-31", "deadline_label":"31 octobre 2026",
        "publie_le":"2026-09-01", "resume":"…", "detail":{...},
        "dcip": true, "service": "Énergie et fluides" }
    ]
  }
  ```
- **Marquage DCIP** : une offre est marquée `dcip: true` et rattachée à un service si son URL correspond à l'un des 7 postes de `postes-dcip.json`, ou si son intitulé/description contient un des motifs de la liste `dcip_patterns` de `config.json` (bâtiment, CVC, GTB/GTC, courants forts/faibles, sûreté, vidéoprotection, maintenance des collèges, conduite d'opérations, énergie…). La liste de motifs est éditable sans toucher au code.
- **Robustesse** : si le scraping échoue ou renvoie moins de 5 offres, le script **sort en erreur sans écraser** `offers.json` (on garde la dernière version bonne) et l'Action ouvre une issue GitHub automatiquement.
- Le script est idempotent : si le JSON produit est identique au précédent, pas de commit.

**`.github/workflows/sync-offers.yml`** : `schedule: cron: "0 4 * * *"` (6 h à Paris) + `workflow_dispatch`. Commit du `offers.json` modifié via `stefanzweifel/git-auto-commit-action` ou un `git commit` natif avec `github-actions[bot]`. Permissions `contents: write`.

**Côté app** : `offers.js` charge `data/offers.json`, affiche la date de dernière mise à jour, et si celle-ci dépasse 72 h affiche un bandeau discret « Offres mises à jour le JJ/MM — consulter le site du Département ». Chaque offre garde toujours son lien vers la fiche officielle : **l'app ne se substitue pas au site du Département, elle y renvoie.**

**Deux niveaux d'affichage** dans l'onglet Postes :
- **« Postes DCIP »** (par défaut) : les fiches détaillées de `postes-dcip.json`, enrichies de leur statut réel (encore en ligne ? date limite dépassée ?) grâce à `offers.json`.
- **« Toutes les offres du Département »** : les ~39 offres, filtrables par catégorie, filière et domaine.

---

## 7. SÉLECTION D'OFFRES ET ENVOI PAR EMAIL

### Parcours utilisateur

1. Sur une fiche de poste (ou une offre), bouton **« Ajouter à ma sélection »** → l'offre entre dans un panier persisté en `localStorage`, un compteur apparaît sur l'onglet « Ma sélection ».
2. Onglet **Ma sélection** : liste des offres retenues, suppression possible, puis **« Recevoir par email »**.
3. Formulaire **minimal** : **email obligatoire**, c'est tout. Prénom / nom / direction actuelle / message = **facultatifs** (l'utilisateur a demandé : « simplement en renseignant son adresse »). Case de consentement RGPD obligatoire.
4. Envoi → écran de confirmation avec récapitulatif de ce qui a été envoyé, et bouton « Continuer à explorer ».

### Contenu du mail envoyé au candidat

**Uniquement les offres qu'il a sélectionnées** (choix validé) :

- Pour chaque offre : **intitulé, service / direction, catégorie et filière, lieu, date limite de candidature, lien direct vers la fiche officielle sur departement06.fr**.
- Un rappel de la marche à suivre pour postuler et le contact du service.
- En-tête aux couleurs du Département, mail **HTML avec version texte alternative**, largeur 600 px, pas d'image de fond, pas de webfont (compatibilité Outlook).

En parallèle, une **notification interne** est envoyée aux adresses de `config.json` (par défaut `dcip_affaires_generales@departement06.fr` et `smonnoyer@departement06.fr`) avec les mêmes informations plus l'horodatage.

### Transport — `js/mailer.js`

Point de vigilance à traiter explicitement, ne pas l'ignorer : **un site statique ne peut pas envoyer d'email lui-même**, et les deux services ne couvrent pas le même besoin.

- **Web3Forms** (choix retenu) : parfait pour la **notification interne** — une clé d'accès publique, envoi vers la boîte configurée sur le compte, protection anti-spam par honeypot, aucun compte utilisateur requis. En revanche, l'envoi d'un mail **au visiteur lui-même** (autoresponder) est une option payante.
- **EmailJS** : déjà utilisé dans `dcip_postes.html`, permet d'envoyer un mail templaté **à une adresse arbitraire** (donc au candidat), gratuit jusqu'à ~200 envois/mois — largement suffisant pour une journée de stand.

Implémente donc `mailer.js` comme une **abstraction à deux fournisseurs** :

```js
// send({ to, offers, contact }) → Promise<{ok, provider}>
// providers: 'web3forms' (notification interne) | 'emailjs' (accusé au candidat)
```

Le comportement par défaut, configurable dans `config.json` :
1. `web3forms` → notification interne (**bloquant** : c'est lui qui garantit que la demande est enregistrée) ;
2. `emailjs` → mail récapitulatif au candidat (**non bloquant** : si ça échoue, la demande interne est déjà partie et l'écran de confirmation précise « la DCIP vous recontacte »).

Si aucune clé EmailJS n'est renseignée, l'app bascule automatiquement sur un plan B **sans dépendance** : bouton **« Télécharger mon récapitulatif (PDF/HTML) »** + **lien `mailto:` pré-rempli**, et une **carte partageable** avec QR code. Ce plan B doit être fonctionnel dès le premier commit, avant même que les clés existent.

**Robustesse réseau** : en cas d'échec d'envoi, la demande est mise en file dans `localStorage` et rejouée automatiquement au retour de la connectivité (`online` event), avec message clair à l'utilisateur (« Votre demande sera envoyée dès le retour du réseau »).

**Anti-abus** : honeypot, délai minimum de 3 s avant soumission, limite de 3 envois par navigateur et par heure, validation d'email côté client (regex raisonnable, pas de sur-validation).

---

## 8. `data/config.json`

Toutes les valeurs modifiables sans toucher au code :

```json
{
  "evenement": {
    "nom": "Journée des Métiers et de la Mobilité",
    "lieu": "CADAM — Nice",
    "date": "À CONFIRMER",
    "organisateur": "DCIP — Direction de la Construction, de l'Immobilier et du Patrimoine"
  },
  "emails_internes": ["dcip_affaires_generales@departement06.fr", "smonnoyer@departement06.fr"],
  "web3forms": { "access_key": "À_RENSEIGNER" },
  "emailjs": { "public_key": "", "service_id": "", "template_candidat": "", "template_interne": "" },
  "offres": { "source": "https://www.departement06.fr/offres-demploi", "dcip_patterns": ["..."] },
  "rgpd": { "duree_conservation_mois": 12, "contact_dpo": "À_RENSEIGNER" }
}
```

⚠️ **Deux dates à faire confirmer par Micka avant mise en ligne** : les sources portent « Forum des Métiers · 10 juin 2026 » et « postuler avant le 31 mai 2026 » — ces dates sont **dépassées**. Ne les recopie pas : mets `"À CONFIRMER"` et affiche les dates limites réelles issues de `offers.json`. Signale-le explicitement dans ton rapport final.

---

## 9. QUALITÉ EXIGÉE

### Accessibilité — RGAA 4.1 (obligation légale pour une collectivité)

- HTML sémantique (`<nav>`, `<main>`, `<section>`, titres hiérarchisés sans saut de niveau).
- Navigation clavier complète, `:focus-visible` toujours visible et contrasté, ordre de tabulation logique, piège de focus dans les modales.
- Contrastes ≥ 4.5:1 (texte courant) / 3:1 (texte large et composants d'interface) — **à vérifier réellement sur les deux thèmes, y compris sur les fonds sombres des quiz**.
- Quiz : `role="radiogroup"` / `role="group"` selon le type, réponses annoncées via `aria-live="polite"`, feedback lisible par lecteur d'écran.
- `prefers-reduced-motion` respecté (les animations de score et de fondu deviennent instantanées).
- Formulaire : `<label>` réels (pas de placeholder seul), erreurs annoncées, `autocomplete="email"`, `inputmode="email"`.
- Pas d'émoji porteur de sens seul : toujours doublé d'un texte (les sources utilisent 🔒 ⚡ 🏫 📐 comme identifiants de service — garde-les en décoratif `aria-hidden="true"` et ajoute le libellé).
- Une **déclaration d'accessibilité** dans `docs/` et un lien en pied de page.

### RGPD

- Mention explicite avant le champ email : finalité, destinataire (DRH / DCIP du Département), durée de conservation (12 mois), droits d'accès et de rectification, contact DPO.
- Consentement **actif** (case décochée par défaut), pas de pré-cochage.
- **Aucun tracker, aucune analytics, aucun cookie tiers.** Le `localStorage` ne sert qu'au panier et aux préférences — le dire dans les mentions.
- Page `docs/RGPD.md` publiée et liée.
- ⚠️ Signale dans `docs/EXPLOITATION.md` que les données du formulaire transitent par un service tiers (Web3Forms / EmailJS, hébergement hors UE possible) et que **ce point doit être validé par le DPO du Département avant mise en production**. Ne masque pas ce point.

### Performance

- Chargement initial < 150 ko hors polices ; polices en `display=swap` avec fallback système décent ; images en SVG ou WebP ; `loading="lazy"` hors du premier écran ; Lighthouse mobile ≥ 90 en Performance, Accessibilité et Bonnes pratiques.
- Aucune dépendance CDN autre que Google Fonts et, le cas échéant, le SDK EmailJS chargé **à la demande** (uniquement au moment de l'envoi, comme dans le fichier source).

### Code

- Commentaires en français, noms de variables explicites, pas de duplication (les trois quiz partagent un seul moteur).
- Fonctionne sans build, ouvrable en double-clic sur `index.html` avec un serveur local simple (`python -m http.server`).
- Testé réellement : Safari iOS et Chrome Android (les deux navigateurs des visiteurs), Firefox et Chrome desktop.

---

## 10. DÉPLOIEMENT

- Dépôt public, Pages activé sur la branche `main` (ou via l'artefact du workflow `deploy.yml`).
- `README.md` : à quoi sert l'app, comment la lancer en local, comment mettre à jour le contenu, comment régénérer les offres à la main (`workflow_dispatch`), où sont les clés.
- Génère un **QR code** (SVG, dans `assets/`) pointant vers l'URL de production, prêt à être imprimé sur le roll-up et sur des cartes de stand — plus une **planche d'impression A5** avec le QR et une accroche courte.
- Vérifie que le service worker n'empêche pas la mise à jour du contenu : stratégie **network-first pour `data/*.json`**, cache-first pour l'app shell, avec un mécanisme de purge de version (`CACHE_VERSION`).

---

## 11. ORDRE D'EXÉCUTION

1. Lire toutes les sources, dresser l'inventaire du contenu.
2. **Claude Design** → les 2 chartes + les planches d'écrans mobile et PC. **Faire une pause ici et présenter les 2 propositions.**
3. Extraire les données vers `data/*.json` (et corriger les bugs des sources).
4. Squelette du repo, thèmes, composants, service worker, manifest.
5. Vues mobile : Métiers (timeline) → Quiz → Postes → Ma sélection → Formulaire.
6. Adaptation PC (breakpoint 1024 px).
7. Scraper + GitHub Actions (sync + deploy).
8. Mailer + plan B hors-ligne.
9. Passe accessibilité + Lighthouse + tests navigateurs.
10. Documentation, QR code, `EXPLOITATION.md`, rapport final.

---

## 12. CRITÈRES D'ACCEPTATION (à vérifier un par un avant de rendre)

- [ ] Les 2 designs sont livrés, complets, et interchangeables sans toucher au JS.
- [ ] Sur iPhone, l'app installée en « écran d'accueil » se comporte comme une app : pas de barre d'URL, pas de rebond de scroll parasite, bottom bar respectant l'encoche.
- [ ] Les 3 quiz fonctionnent, y compris la question à réponses multiples, avec les corrections rédigées d'origine intégralement conservées.
- [ ] Le nombre de questions affiché correspond au nombre réel.
- [ ] Aucun texte visible ne contient de résidu technique (`QF_`, `QG_`, `QS_`).
- [ ] Les 10 phases de la timeline et les 8 services sont présents et navigables au doigt.
- [ ] La liste des offres se charge depuis `offers.json` et affiche sa date de fraîcheur.
- [ ] La GitHub Action tourne à la main (`workflow_dispatch`) et produit un `offers.json` valide sans écraser la version précédente en cas d'échec.
- [ ] On peut sélectionner plusieurs offres et recevoir le récapitulatif par email en ne renseignant **que** son adresse.
- [ ] Le plan B (téléchargement + mailto) fonctionne sans aucune clé configurée.
- [ ] Mode avion : quiz et timeline utilisables, offres servies depuis le cache, demande d'email mise en file et rejouée au retour du réseau.
- [ ] Lighthouse mobile ≥ 90 (Performance / Accessibilité / Bonnes pratiques) sur les deux thèmes.
- [ ] Navigation clavier complète, contrastes vérifiés sur fonds clairs **et** sombres.
- [ ] Aucune donnée personnelle en dur dans le dépôt, aucune clé privée versionnée.
- [ ] `README.md`, `CHARTE.md`, `EXPLOITATION.md`, `RGPD.md` rédigés.

---

## 13. RAPPORT FINAL ATTENDU

À la fin, produis un récapitulatif court comprenant :
- l'URL de production et le QR code ;
- les **écarts et points en attente** : dates de l'événement à confirmer, clés Web3Forms/EmailJS à créer, validation DPO, logo à fournir en vectoriel si seul le PNG était disponible ;
- ce que tu recommandes entre le Design A et le Design B, et pourquoi ;
- les limites connues du scraper (le site du Département peut changer de structure — indiquer où intervenir dans `sync_offers.py`).
