# Protection des données personnelles

Application **Métiers & Mobilité DCIP** — Journée des Métiers et de la Mobilité, CADAM.
Département des Alpes-Maritimes — Direction de la Construction, de l'Immobilier et du Patrimoine.

*Dernière mise à jour : 4 septembre 2026.*

---

## ⚠️ Point à faire valider par le DPO avant mise en production

Cette application est un site **statique**, sans serveur ni base de données. Elle ne peut donc
pas envoyer de courriel par elle-même : l'envoi est délégué à un service tiers
(**Web3Forms** pour la notification interne, **EmailJS** pour l'accusé au visiteur).

**Conséquence** : l'adresse électronique saisie par le visiteur, ainsi que la liste des offres
qu'il a retenues, **transitent par les serveurs de ces prestataires**, dont l'hébergement peut
se situer **hors Union européenne**.

Ce point doit être **arbitré et validé par le Délégué à la protection des données du
Département avant toute mise en ligne**. Trois issues possibles :

| Option | Ce que ça implique |
|---|---|
| Valider les prestataires actuels | Vérifier les clauses contractuelles types, inscrire le traitement au registre, mentionner le transfert hors UE dans l'information des personnes |
| Choisir un prestataire européen | Remplacer l'implémentation de `js/mailer.js` (l'abstraction à deux fournisseurs est prévue pour ça) |
| Renoncer à l'envoi automatique | Ne conserver que le **plan B** : téléchargement du récapitulatif et lien `mailto:`. Aucune donnée ne quitte alors le navigateur du visiteur. C'est l'option la plus sobre, et elle fonctionne déjà. |

Tant que l'arbitrage n'est pas rendu, l'application fonctionne en **plan B** : les clés ne sont
pas renseignées dans `data/config.json`, donc aucune donnée n'est transmise à qui que ce soit.

---

## 1. Responsable du traitement

**Département des Alpes-Maritimes**
Direction des Ressources Humaines / Direction de la Construction, de l'Immobilier et du Patrimoine
CADAM — 147 boulevard du Mercantour, 06200 Nice

**Délégué à la protection des données** : `À_RENSEIGNER` (voir `data/config.json` → `rgpd.contact_dpo`)

## 2. Finalité

Permettre à un visiteur du stand de recevoir par courriel le récapitulatif des offres d'emploi
qu'il a sélectionnées, et permettre à la DCIP d'assurer le suivi de cette demande.

**Base légale** : consentement de la personne (article 6.1.a du RGPD), recueilli par une case
à cocher **non pré-cochée** avant tout envoi.

## 3. Données collectées

| Donnée | Caractère | Origine |
|---|---|---|
| Adresse électronique | **Obligatoire** | Saisie par le visiteur |
| Prénom, nom | Facultatif | Saisie par le visiteur |
| Direction d'affectation actuelle | Facultatif | Saisie par le visiteur |
| Message libre | Facultatif | Saisie par le visiteur |
| Liste des offres retenues | Déduite | Sélection du visiteur dans l'application |
| Horodatage de la demande | Déduite | Généré à l'envoi |

**Aucune autre donnée n'est collectée.** Pas d'adresse IP conservée par l'application, pas de
profil, pas de données sensibles au sens de l'article 9.

## 4. Destinataires

- Les agents de la DCIP destinataires de la notification interne, listés dans
  `data/config.json` → `emails_internes` ;
- le visiteur lui-même, pour son propre récapitulatif ;
- les prestataires techniques d'envoi (voir l'avertissement en tête de document).

Aucune cession, aucune revente, aucun transfert à un tiers non listé ici.

## 5. Durée de conservation

**12 mois** à compter de la demande, puis suppression
(`data/config.json` → `rgpd.duree_conservation_mois`).

Cette durée couvre la campagne de mobilité interne consécutive à l'événement. La purge est
un **acte d'exploitation à réaliser dans la boîte destinataire** : elle n'est pas automatique,
puisqu'il n'y a pas de base de données. Voir `docs/EXPLOITATION.md`.

## 6. Droits des personnes

Droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de retrait du
consentement à tout moment, en écrivant au DPO du Département.

Le retrait du consentement ne remet pas en cause la licéité de ce qui a été envoyé avant.

## 7. Traceurs et stockage local

**Aucun cookie. Aucun traceur. Aucune mesure d'audience. Aucun service tiers chargé au démarrage.**

L'application utilise le `localStorage` du navigateur — un espace propre à l'appareil du
visiteur, que l'application ne transmet à personne — pour trois choses seulement :

| Clé | Contenu | Pourquoi |
|---|---|---|
| `jdmm.selection` | Les offres retenues | Conserver le panier d'un onglet à l'autre |
| `jdmm.preferences` | Thème, mode haute lisibilité | Ne pas redemander à chaque visite |
| `jdmm.quiz` | Scores des quiz | Afficher sa progression |
| `jdmm.file-envois` | Demande en attente d'envoi | Rejouer l'envoi au retour du réseau |
| `jdmm.horodatages-envois` | Dates des 3 derniers envois | Limiter les abus (3 envois par heure) |

Ces informations restent sur l'appareil et **sont effaçables à tout moment** depuis
l'application (bouton « Effacer mes données ») ou en vidant les données du site dans le navigateur.

Les polices sont chargées depuis Google Fonts, ce qui expose l'adresse IP du visiteur à Google.
Pour l'éviter, les fichiers de police peuvent être hébergés directement dans `assets/` — voir
`docs/EXPLOITATION.md`. **À arbitrer avec le DPO au même moment que les services d'envoi.**

## 8. Sécurité

- Site servi exclusivement en **HTTPS** (GitHub Pages, TLS 1.3).
- Aucune donnée personnelle stockée dans le dépôt, aucune clé privée versionnée.
- La clé Web3Forms est une **clé publique d'accès** : elle n'autorise que le dépôt d'un message
  vers la boîte configurée sur le compte, jamais la lecture des messages reçus.
- Mesures anti-abus : champ leurre, délai minimum avant soumission, plafond de 3 envois par
  navigateur et par heure.
