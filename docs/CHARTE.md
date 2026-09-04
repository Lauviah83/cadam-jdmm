# Charte graphique

Application **Métiers & Mobilité DCIP** — Journée des Métiers et de la Mobilité, CADAM.

Deux directions ont été produites et sont livrées ensemble, pour arbitrage.
Canvas de conception : 35 planches, dont 11 écrans mobile et 4 écrans PC par direction.

*Établie le 4 septembre 2026.*

---

## Le principe qui gouverne tout le reste

**Aucune couleur, aucune police n'est écrite en dur dans le code applicatif.**
Tout passe par des variables CSS définies dans `themes/`. Concrètement :

```
themes/tokens.css   grandeurs communes (espacements, échelle typo, durées) — sans couleur
themes/a.css        Design A — palette et polices
themes/b.css        Design B — palette et polices
```

Les deux thèmes définissent **les mêmes noms de rôles** (`--fond`, `--texte`, `--accent`,
`--alerte`…). Changer de direction revient à charger l'autre fichier : aucune ligne de HTML
ni de JavaScript n'est touchée, y compris après la mise en production.

C'est pour cette raison que les maquettes des deux designs ont été produites par **un même
générateur** à partir des **mêmes données** : la démonstration que les designs sont
réellement interchangeables, et pas seulement deux dessins qui se ressemblent.

---

## Design A — « Institutionnel »

> La charte des fichiers du projet, systématisée.

| | |
|---|---|
| **Titres** | Fraunces (serif variable, `opsz 144`, graisse 400, `letter-spacing -.02em`) |
| **Texte** | Manrope |
| **Chiffres et surtitres** | JetBrains Mono, capitales, interlettrage `.14em` |
| **Géométrie** | Rayons généreux (16 px sur les cartes), ombres portées teintées de bleu |
| **Ton** | Éditorial. L'italique de Fraunces adoucit un sujet administratif. |

### Palette

| Jeton | Valeur | Rôle | Contraste sur papier | Verdict |
|---|---|---|---|---|
| `--b9` | `#042C53` | Texte principal, aplats | 13,5:1 | AAA |
| `--b8` | `#0C447C` | Titres, en-têtes | 9,4:1 | AAA |
| `--b6` | `#185FA5` | Liens | 6,2:1 | AA |
| `--b4` | `#378ADD` | Bordures, icônes | 3,4:1 | **composants seulement** |
| `--b1` | `#B5D4F4` | Fonds de badges | — | fond |
| `--b0` | `#E6F1FB` | Blocs informatifs | — | fond |
| `--a2` | `#EF9F27` | Ambre : aplats et filets | 2,1:1 | **jamais en texte sur clair** |
| `--a2-texte` | `#96590A` | Ambre lisible en texte | 5,4:1 | AA |
| `--t6` | `#0F6E56` | Validation | 5,9:1 | AA |
| `--c6` | `#993C1D` | Alerte, échéance dépassée | 6,7:1 | AA |
| `--texte-doux` | `#455465` | Métadonnées | 7,4:1 | AAA |
| `--texte-faible` | `#616D82` | Mentions discrètes | 5,0:1 | AA |

### Trois corrections apportées à la palette d'origine

Les valeurs de la charte ont été reprises **sans les modifier**. Mais un usage naïf de
certaines d'entre elles échouerait au RGAA. Trois ajouts, aucun retrait :

1. **L'ambre `#EF9F27` plafonne à 2,1:1** sur fond clair — il échoue même au seuil du grand
   texte (3:1). Il reste tel quel pour les aplats, les filets et les pastilles, et pour le
   texte posé sur bleu nuit (6,5:1, conforme) ; une variante foncée `#96590A` (5,4:1) a été
   dérivée pour tous les usages en texte sur fond clair.
2. **Le bleu `#378ADD` est à 3,4:1** : conforme pour les composants d'interface et le grand
   texte, insuffisant pour du texte courant. Réservé aux bordures et aux icônes.
3. **L'accent sûreté `#3D6FE8` est à 4,29:1** sur son fond sombre — sous le seuil AA de 4,5,
   de peu. Conservé pour les surfaces et bordures, éclairci en `#4C7BEC` (5,0:1) pour le texte.

---

## Design B — « Signature »

> Héraldique départementale : encre, or, gueules.

| | |
|---|---|
| **Titres** | Archivo (grotesque variable, graisse 800, `wdth 88`, `letter-spacing -.03em`) |
| **Texte** | IBM Plex Sans |
| **Chiffres et surtitres** | IBM Plex Mono, capitales, interlettrage `.18em` |
| **Géométrie** | Angles francs, 4 px. Ombres sèches : la hiérarchie passe par le trait et l'aplat. |
| **Ton** | Signalétique publique. Assumé administratif, mais contemporain. |

### Palette

| Jeton | Valeur | Rôle | Contraste | Verdict |
|---|---|---|---|---|
| `--encre9` | `#0B2E4F` | Aplats, en-têtes | 13,8:1 (blanc dessus) | AAA |
| `--encre7` | `#123A5C` | Survol d'un aplat | 11,8:1 | AAA |
| `--texte` | `#14293D` | Texte principal | 14,2:1 | AAA |
| `--or` | `#D4A24A` | Accent sur fond sombre | 6,0:1 sur l'encre | AA |
| `--or-texte` | `#8A6410` | Accent en texte sur clair | 5,1:1 | AA |
| `--gueules` | `#B02026` | Alerte, uniquement | 6,5:1 | AA |
| `--vert` | `#0F5B44` | Validation | 7,7:1 | AAA |
| `--texte-doux` | `#4A5B6B` | Métadonnées | 6,7:1 | AA |
| `--texte-faible` | `#5C6B77` | Mentions | 5,3:1 | AA |

### Deux partis pris

**L'or existe en deux valeurs, et les confondre casse l'accessibilité.** L'or clair
(`#D4A24A`) est lisible sur l'encre mais tombe à 2,2:1 sur le papier. L'or foncé
(`#8A6410`) fait l'inverse. Le même piège que l'ambre du Design A — traité d'emblée.

**Le rouge de gueules ne décore rien.** Il signale une échéance dépassée, une erreur, une
donnée manquante. Le banaliser en ornement lui ferait perdre sa fonction de signal.

### Ce qui reste à caler

⚠️ Ces valeurs ont été construites à partir des **couleurs héraldiques décrites** — azur,
or, gueules — et **non prélevées sur le fichier du logo officiel**, qui n'a pas été fourni.
Elles sont accessibles et cohérentes en l'état, mais devront être recalées sur les valeurs
exactes du logo dès sa réception. Le fichier à modifier est `themes/b.css` ; les ratios de
contraste devront être recontrôlés après recalage.

---

## Ce que les deux directions partagent

Ces choix ne relèvent pas de la charte : ils s'appliquent quel que soit l'arbitrage.

### Les fonds sombres des quiz

Ils font partie du contenu validé du projet, pas de l'habillage. Ils sont donc identiques
dans les deux thèmes :

| Quiz | Fond | Accent | Contraste de l'accent |
|---|---|---|---|
| Prévention incendie | `#0F0E0C` | `#E94B1F` | 5,0:1 ✔ |
| Gardiennage | `#0B0E14` | `#3B82F6` | 5,3:1 ✔ |
| Sûreté | `#0A0D14` | `#3D6FE8` surfaces / `#4C7BEC` texte | 4,3:1 / 5,0:1 |

### Les icônes sont tracées, pas des émojis

Les fichiers sources utilisaient des émojis comme repères de service (⚡ 🏫 🔒 📐). Ils ont
été remplacés par des **tracés SVG** sur une grille de 24, trait 1,75 : ils se recolorent
avec le thème, restent nets à l'impression de la planche A5, et ne dépendent pas de la
police émoji installée sur le téléphone du visiteur — qui varie d'un appareil à l'autre.

Cela sert aussi l'accessibilité : le cahier des charges demandait de doubler tout émoji
porteur de sens d'un libellé texte. Un tracé décoratif accompagné de son libellé résout
le problème à la source.

### Un badge ne contredit jamais le statut

Défaut repéré pendant la conception : les fiches de postes portent un champ `tag`
(`new`, `urgent`) figé à leur rédaction. Affiché tel quel, il produisait un poste marqué
**« Nouveau »** dont l'annonce était **retirée du site**, et des **« Urgent »** sur des
échéances à 26 jours. Les badges se déduisent désormais du **statut réel** calculé depuis
`data/offers.json` — jamais d'un champ figé dans la fiche.

### Dimensions et gestes

- Cible tactile minimale **48 px** (au-delà des 44 px du RGAA : le public inclut des agents
  de plus de 50 ans, debout, dans le bruit d'un hall).
- Aucune barre d'état factice dans les maquettes mobile : sur un vrai téléphone, la vraie
  se superpose.
- Barre d'onglets basse jusqu'à 1024 px, navigation haute au-delà ; contenu borné à 1100 px.
- Le focus clavier est toujours visible, jamais supprimé (RGAA 10.7).

---

## Le canvas de conception

35 planches réparties en trois pages :

| Page | Contenu |
|---|---|
| **Arbitrage** | Les deux accueils côte à côte, avec les arguments et la contrepartie de chacun |
| **Design A** | Fondations · Composants · 11 écrans mobile (390×844) · 4 écrans PC (1440×900) |
| **Design B** | Les mêmes, à l'identique |

Les 11 écrans mobile : Accueil, Parcours, Détail d'une phase, Hub des quiz, Question,
Résultat, Liste des postes, Fiche de poste, Ma sélection, Formulaire, Confirmation.

Les 4 écrans PC : Accueil et parcours, Quiz en cours, Postes (liste et fiche), Ma sélection.

> Les intitulés des 10 phases du parcours sont des **textes provisoires**, signalés comme
> tels sur les planches : le roll-up 60×160 cm n'a pas été fourni.
