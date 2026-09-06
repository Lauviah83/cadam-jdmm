# Le registre des demandes

Comment les demandes des visiteurs sont collectées, et comment le récapitulatif
de fin de journée est envoyé.

*Rédigé le 6 septembre 2026 — événement du mercredi 23 septembre 2026.*

---

## Ce qui se passe, vu du visiteur

Il ouvre une fiche de poste, clique **« Je suis intéressé(e) par ce poste »**, renseigne
**prénom, nom, direction et adresse** — tous obligatoires — accepte d'être recontacté,
puis clique sur **« Enregistrer ma demande »**.

L'écran confirme : *« Votre demande est enregistrée. La DCIP vous recontacte dans les
meilleurs délais. »* Aucun courriel ne lui est envoyé.

## Ce qui se passe derrière

1. La demande part vers un **script de collecte**, qui l'ajoute à une ligne d'un
   **tableau** (une feuille de calcul Google).
2. Chaque soir à 18 h, ce même script envoie **un récapitulatif des demandes du jour**
   à **une seule adresse**.

> **Pourquoi un service externe.** L'application est un site statique : elle n'a ni base
> de données ni tâche planifiée. Or les visiteurs scannent le QR avec **leur** téléphone —
> une trace gardée dans le navigateur resterait sur leur appareil, et la DCIP ne verrait
> rien. Il faut donc un point de collecte commun. C'est ce que prévoyait déjà le fichier
> source du projet (`SHEETS_URL`).

---

## Installation, une fois

### 1. Créer le tableau

Sur <https://drive.google.com>, créez une **feuille de calcul** nommée par exemple
« Registre JDMM 2026 ». L'onglet et les en-têtes sont créés automatiquement à la première
demande — il n'y a rien à préparer.

### 2. Coller le script

Dans la feuille : menu **Extensions → Apps Script**. Effacez le contenu par défaut et
collez l'intégralité de `scripts/apps-script/Code.gs`.

En haut du fichier, vérifiez la seule valeur à régler :

```js
var DESTINATAIRE = 'mickael@connect3s.fr';
```

> C'est **ici**, côté serveur, que se décide qui reçoit le récapitulatif — pas dans
> `data/config.json`, qui est public et modifiable par n'importe qui.

Enregistrez (icône disquette).

### 3. Déployer en application web

**Déployer → Nouveau déploiement** → type **Application Web** :

| Réglage | Valeur |
|---|---|
| Description | Registre JDMM |
| Exécuter en tant que | **Moi** |
| Qui a accès | **Tout le monde** |

Google demande une autorisation : acceptez (le script écrit dans *votre* feuille et envoie
depuis *votre* adresse). Un avertissement « application non validée » peut apparaître —
c'est normal pour un script personnel : **Paramètres avancés → Accéder au projet**.

Copiez l'**URL de l'application web** (elle se termine par `/exec`).

> ⚠️ **À chaque modification du script, refaites un déploiement** (« Gérer les
> déploiements → Modifier → Nouvelle version »), sinon l'ancienne version continue de
> répondre.

### 4. Poser le déclencheur quotidien

Toujours dans Apps Script, sélectionnez la fonction **`installerDeclencheur`** dans la
liste déroulante, puis **Exécuter**. Elle programme l'envoi tous les jours entre 18 h et
19 h. Vérifiez ensuite dans **Déclencheurs** (icône réveil) qu'il est bien là.

Pour changer l'heure, modifiez `.atHour(18)` puis relancez `installerDeclencheur`.

### 5. Raccorder l'application

Dans `data/config.json` :

```json
"registre": {
  "endpoint": "https://script.google.com/macros/s/……/exec",
  "destinataire_recapitulatif": "mickael@connect3s.fr"
}
```

Poussez. Comptez une à deux minutes de déploiement, puis **dix minutes** de cache GitHub.

---

## Vérifier

1. Dans Apps Script, lancez **`testerEnvoi`** : un récapitulatif d'exemple part vers
   l'adresse configurée, sans rien écrire dans le tableau.
2. Sur le site, enregistrez une vraie demande avec vos coordonnées.
   L'écran doit dire *« Votre demande est enregistrée »* — et non *« Le registre n'est pas
   encore raccordé »*, qui signale un `endpoint` manquant.
3. Vérifiez qu'une ligne est apparue dans la feuille de calcul.
4. Lancez **`envoyerRecapitulatif`** à la main : vous devez recevoir le récapitulatif du
   jour, et la colonne « Récapitulatif envoyé » se remplir.

**Faites ce test au moins deux jours avant l'événement** : si les courriels partent en
indésirables, il faut le temps de le corriger.

---

## Si le registre n'est pas raccordé le jour J

L'application ne fait pas semblant. L'écran affiche :

> *Le registre des demandes n'est pas encore raccordé sur ce stand. Signalez-vous auprès
> d'un agent : votre demande sera notée à la main.*

C'est volontaire : mieux vaut renvoyer le visiteur vers un agent que lui laisser croire à
un enregistrement qui n'a pas eu lieu.

## Si le réseau tombe pendant l'événement

La demande est **conservée sur le téléphone du visiteur** et repart automatiquement dès
que la connexion revient — tant qu'il n'a pas fermé son navigateur. L'écran le dit :
*« Votre demande est conservée et sera transmise dès le retour du réseau. »*

---

## Ce que le récapitulatif contient

- le **nombre de demandes** du jour, en objet du courriel ;
- le **classement des postes** par nombre de demandes — le chiffre utile pour la DCIP ;
- le **détail** de chaque demande : nom, direction, adresse cliquable, heure, projet de
  mobilité, poste concerné et message éventuel.

Les demandes déjà incluses dans un récapitulatif sont marquées : une relance manuelle ne
les renverra pas. Le marquage a lieu **après** l'envoi, pour qu'un courriel en échec ne
fasse pas disparaître les demandes du prochain récapitulatif.

---

## Données personnelles

Le tableau contient des **données personnelles d'agents** : nom, prénom, direction,
adresse professionnelle, et l'intérêt porté à un poste — une information sensible dans un
contexte de mobilité interne.

| Obligation | Ce qu'il faut faire |
|---|---|
| Accès restreint | Ne partagez la feuille qu'avec les personnes qui en ont besoin |
| Conservation 12 mois | **Supprimez les lignes** à l'échéance : rien ne le fait tout seul |
| Registre des traitements | Inscrivez ce traitement, et l'échéance de purge |
| Hébergement | Google Workspace, hors UE selon la configuration — **à valider par le DPO** |

Voir `docs/RGPD.md`.

## Remplacer Google par autre chose

Le script est le seul point de contact. Pour utiliser un autre service — une liste
SharePoint via Power Automate, par exemple — il suffit d'exposer une adresse qui accepte
un `POST` de JSON et renvoie `{"ok": true}`. Rien d'autre ne change dans l'application :
seul `registre.endpoint` est à modifier.

Les champs transmis sont : `horodatage`, `prenom`, `nom`, `direction`, `email`, `projet`,
`message`, `poste_titre`, `poste_service`, `poste_categorie`, `poste_url`, `poste_statut`.
