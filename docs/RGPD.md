# Protection des données personnelles

Application **Métiers & Mobilité DCIP** — Journée des Métiers et de la Mobilité, CADAM.
Département des Alpes-Maritimes — Direction de la Construction, de l'Immobilier et du Patrimoine.

*Dernière mise à jour : 4 septembre 2026.*

---

## ⚠️ Point à faire valider par le DPO avant mise en production

L'application est un site **statique**, sans serveur ni base de données. Les demandes des
visiteurs sont donc collectées par un **service externe** : un script Google Apps Script
qui écrit dans une feuille de calcul et envoie un récapitulatif quotidien
(voir `docs/REGISTRE.md`).

**Conséquence** : les coordonnées saisies — prénom, nom, direction, adresse
professionnelle — et le poste qui intéresse la personne **sont conservés dans une feuille
de calcul Google**, dont l'hébergement peut se situer **hors Union européenne**.

Ce point doit être **arbitré et validé par le Délégué à la protection des données du
Département avant toute mise en ligne**. Trois issues possibles :

| Option | Ce que ça implique |
|---|---|
| Valider Google Workspace | Vérifier les clauses contractuelles types, inscrire le traitement au registre, mentionner le transfert hors UE dans l'information des personnes |
| Choisir un service européen ou interne | Le script est le seul point de contact : il suffit d'exposer une adresse qui accepte un `POST` de JSON. Une liste SharePoint via Power Automate ferait l'affaire. Seul `registre.endpoint` change. |
| Renoncer à la collecte en ligne | Les visiteurs se signalent auprès d'un agent, qui note à la main. C'est déjà ce que l'application affiche tant que le registre n'est pas raccordé. |

Un point est en revanche **réglé** : le poste qui intéresse un agent est une information
sensible en contexte de mobilité interne. Elle n'est jamais affichée publiquement, jamais
transmise à un tiers autre que le service de collecte, et **le visiteur ne reçoit aucun
courriel** — rien n'atterrit dans une boîte partagée par erreur.

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
| Horodatage de la demande | Déduite | Généré à l'enregistrement |

**Aucune autre donnée n'est collectée.** Pas d'adresse IP conservée par l'application, pas de
profil, pas de données sensibles au sens de l'article 9.

## 4. Destinataires

- **une seule personne** à la DCIP, destinataire du récapitulatif de fin de journée.
  Cette adresse est fixée **côté serveur**, dans `scripts/apps-script/Code.gs` — pas dans
  un fichier public de l'application ;
- le prestataire hébergeant le tableau (voir l'avertissement en tête de document).

Aucun courriel n'est envoyé au visiteur.

Aucune cession, aucune revente, aucun transfert à un tiers non listé ici.

## 5. Durée de conservation

**12 mois** à compter de la demande, puis suppression
(`data/config.json` → `rgpd.duree_conservation_mois`).

Cette durée couvre la campagne de mobilité interne consécutive à l'événement.

> ⚠️ **La purge n'est pas automatique.** Il faut supprimer les lignes de la feuille de
> calcul — et les récapitulatifs quotidiens dans la boîte du destinataire — à l'échéance.
> Inscrivez cette date dans le registre des traitements. Voir `docs/REGISTRE.md`.

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
- L'adresse du service de collecte est publique, mais ce point d'entrée ne sait **qu'ajouter
  une ligne** : il ne lit rien, ne modifie rien, ne supprime rien. Le pire qu'un tiers puisse
  en faire est d'y écrire des demandes fictives.
- L'adresse qui reçoit le récapitulatif est fixée **côté serveur**, jamais dans un fichier
  servi au navigateur.
- Mesures anti-abus : champ leurre, délai minimum avant soumission, plafond de 3 envois par
  navigateur et par heure.
