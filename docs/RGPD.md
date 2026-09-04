# Protection des données personnelles

Application **Métiers & Mobilité DCIP** — Journée des Métiers et de la Mobilité, CADAM.
Département des Alpes-Maritimes — Direction de la Construction, de l'Immobilier et du Patrimoine.

*Dernière mise à jour : 4 septembre 2026.*

---

## ⚠️ Point à faire valider par le DPO avant mise en production

Cette application est un site **statique**, sans serveur ni base de données. Elle ne peut donc
pas envoyer de courriel par elle-même : l'envoi est délégué à un service tiers, **EmailJS**,
seul à savoir écrire à une adresse arbitraire — celle que le visiteur vient de saisir.

**Conséquence** : les coordonnées saisies par le visiteur — prénom, nom, direction, adresse —
et la fiche demandée **transitent par les serveurs de ce prestataire**, dont l'hébergement peut
se situer **hors Union européenne**.

Ce point doit être **arbitré et validé par le Délégué à la protection des données du
Département avant toute mise en ligne**. Trois issues possibles :

| Option | Ce que ça implique |
|---|---|
| Valider le prestataire | Vérifier les clauses contractuelles types, inscrire le traitement au registre, mentionner le transfert hors UE dans l'information des personnes |
| Choisir un prestataire européen | Remplacer la fonction `envoyerParEmailJS` de `js/commun/mailer.js` — c'est le seul point de contact avec le service |
| Renoncer à l'envoi automatique | Ne conserver que le **plan B** : téléchargement de la fiche et lien `mailto:`. Aucune donnée ne quitte alors le navigateur du visiteur. C'est l'option la plus sobre, et elle fonctionne déjà. |

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
| Prénom | **Obligatoire** | Saisi par le visiteur |
| Nom | **Obligatoire** | Saisi par le visiteur |
| Direction d'affectation actuelle | **Obligatoire** | Saisie par le visiteur |
| Projet de mobilité | Facultatif | Choisi par le visiteur |
| Message libre | Facultatif | Saisi par le visiteur |
| Poste concerné | Déduite | La fiche ouverte au moment de la demande |
| Horodatage de la demande | Déduite | Généré à l'envoi |

**Aucune autre donnée n'est collectée.** Pas d'adresse IP conservée par l'application, pas de
profil, pas de données sensibles au sens de l'article 9.

## 4. Destinataires

- le visiteur lui-même, destinataire principal de la fiche qu'il demande ;
- la DCIP, en **copie** de chaque envoi, à l'adresse de `data/config.json` → `emails_copie` ;
- le prestataire technique d'envoi (voir l'avertissement en tête de document).

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
| `jdmm.preferences` | Thème, mode haute lisibilité | Ne pas redemander à chaque visite |
| `jdmm.quiz` | Scores des quiz | Afficher sa progression |
| `jdmm.file-envois` | Demande en attente d'envoi | Rejouer l'envoi au retour du réseau |
| `jdmm.horodatages-envois` | Dates des 3 derniers envois | Limiter les abus (3 envois par heure) |

Ces informations restent sur l'appareil et **sont effaçables à tout moment** depuis
l'application (bouton « Effacer mes données ») ou en vidant les données du site dans le navigateur.

**Les polices sont servies par l'application elle-même** (`assets/fonts/`, sous licence SIL
Open Font License). Aucun appel à Google Fonts, donc aucune exposition de l'adresse IP du
visiteur à un tiers. Au chargement d'une page, **aucune requête ne quitte le domaine de
l'application** : pas de CDN, pas de police distante, pas de mesure d'audience.

La seule requête externe possible est l'envoi du formulaire, vers le prestataire de courriel,
et uniquement au moment où le visiteur clique — c'est l'objet de l'avertissement en tête de
document.

## 8. Sécurité

- Site servi exclusivement en **HTTPS** (GitHub Pages, TLS 1.3).
- Aucune donnée personnelle stockée dans le dépôt, aucune clé privée versionnée.
- La **Public Key** d'EmailJS est publique par conception : elle n'autorise que l'envoi via
  les gabarits du compte, jamais la lecture de quoi que ce soit.
- Mesures anti-abus : champ leurre, délai minimum avant soumission, plafond de 3 envois par
  navigateur et par heure.
