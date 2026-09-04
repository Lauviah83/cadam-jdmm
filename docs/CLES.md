# Activer l'envoi de la fiche par courriel

*Rédigé le 4 septembre 2026 — événement du mercredi 23 septembre 2026.*

---

## Pourquoi ce document plutôt que des clés déjà créées

L'inscription à EmailJS demande un mot de passe, une confirmation par courriel, puis
le **branchement d'une boîte d'envoi par OAuth** — une authentification interactive avec
vos identifiants. Je ne peux pas la faire à votre place, et je ne dois pas.

Web3Forms, envisagé un temps pour la notification interne, a été **retiré** : EmailJS envoie
au visiteur *et* met la DCIP en copie. Un seul service, un seul compte à créer, un arbitrage
de moins pour le DPO.

Ce document réduit donc l'opération à une quinzaine de minutes. Le gabarit du courriel,
qui est la partie longue, est prêt à copier-coller.

---

## Avant de commencer : l'adresse d'expédition

> ⚠️ **N'utilisez pas une boîte personnelle.** L'adresse connectée à EmailJS devient
> l'expéditeur de tous les courriels envoyés depuis le stand.

Créez ou faites créer une **adresse dédiée à l'événement**, par exemple
`jdmm@…` ou `stand-dcip@…`. Elle sert à deux choses :

1. **expédier** les fiches aux visiteurs ;
2. **recevoir en copie** chaque demande, ce qui donne à la DCIP la liste des personnes
   intéressées et des postes concernés.

Les deux peuvent être la même adresse.

---

## 1. Le compte EmailJS

1. Créez un compte sur <https://www.emailjs.com> (le plan gratuit couvre ~200 envois par
   mois — largement au-delà d'une journée de stand).
2. **Email Services** → **Add New Service** → choisissez le fournisseur de l'adresse dédiée
   (Outlook, Gmail, ou *Custom SMTP* si le Département fournit un relais).
   Connectez l'adresse. Notez le **Service ID** (de la forme `service_xxxxxxx`).
3. **Account** → **General** → copiez la **Public Key** (de la forme `xxxxxxxxxxxxxxx`).

## 2. Le gabarit du courriel

**Email Templates** → **Create New Template**. Renseignez les champs suivants,
**exactement** comme indiqué.

### En-têtes

| Champ du formulaire EmailJS | Valeur à saisir |
|---|---|
| **To Email** | `{{to_email}}` |
| **To Name** | `{{to_name}}` |
| **Cc** | `{{copie_email}}` |
| **From Name** | `DCIP — Département des Alpes-Maritimes` |
| **Reply To** | l'adresse dédiée de l'événement |
| **Subject** | `Votre fiche de poste : {{poste_titre}}` |

> Le champ **Cc** se trouve sous « Show advanced settings » dans l'éditeur de gabarit.
> C'est lui qui met la DCIP en copie de chaque envoi.

### Contenu

Basculez l'éditeur en mode **Code** (bouton `</>` en haut à droite), effacez ce qui s'y
trouve, et collez exactement ceci :

```html
{{{fiche_html}}}
```

> **Trois accolades, pas deux.** Avec `{{fiche_html}}`, EmailJS échappe le HTML et le
> visiteur reçoit du code source au lieu d'une fiche. C'est l'erreur classique.

L'application envoie un **fragment** HTML, pas un document complet : il s'insère
proprement dans le gabarit d'EmailJS.

Enregistrez, puis notez le **Template ID** (de la forme `template_xxxxxxx`).

---

## 3. Renseigner l'application

Ouvrez `data/config.json` et complétez :

```json
"emails_copie": ["ladresse-dediee@exemple.fr"],
"emailjs": {
  "public_key": "votre_public_key",
  "service_id": "service_xxxxxxx",
  "template_fiche": "template_xxxxxxx"
}
```

Poussez. Le site se redéploie en une à deux minutes, puis GitHub met **dix minutes** à
propager son cache : ne concluez pas trop vite.

> `data/config.json` est servi en clair par GitHub Pages. La **Public Key** d'EmailJS est
> publique par conception : elle n'autorise que l'envoi via vos gabarits, jamais la lecture
> de quoi que ce soit. En revanche, `emails_copie` sera visible : n'y mettez qu'une adresse
> de service, jamais une adresse nominative.

---

## 4. Vérifier

1. Ouvrez `postes/` sur un téléphone, choisissez une fiche,
   « Je suis intéressé(e) — recevoir la fiche ».
2. Renseignez vos vrais prénom, nom, direction et **votre propre adresse**.
3. Envoyez. L'écran doit annoncer *« La fiche part à … »* — et non
   *« l'envoi automatique n'est pas encore activé »*, qui signale une clé manquante.
4. Vérifiez que vous recevez la fiche **et** que l'adresse en copie la reçoit aussi.
5. Regardez les indésirables : un premier envoi depuis une adresse neuve y atterrit souvent.

**Faites ce test au moins deux jours avant l'événement.** Si les courriels partent en
indésirables, il faut le temps de faire configurer SPF et DKIM sur le domaine expéditeur.

---

## Si les clés ne sont pas prêtes le jour J

Ce n'est pas bloquant. Sans clé, l'application bascule seule sur son **plan B** :
le visiteur télécharge la fiche, ou se l'envoie depuis sa propre messagerie par un lien
pré-rempli. Aucune donnée ne quitte alors son navigateur.

Ce que la DCIP perd dans ce cas : la copie, donc la trace de qui s'est intéressé à quoi.
C'est la seule raison d'activer EmailJS — et c'est une bonne raison.

---

## Les valeurs à obtenir, en résumé

| Valeur | Où la trouver | Où la coller |
|---|---|---|
| Public Key | EmailJS → Account → General | `config.json` → `emailjs.public_key` |
| Service ID | EmailJS → Email Services | `config.json` → `emailjs.service_id` |
| Template ID | EmailJS → Email Templates | `config.json` → `emailjs.template_fiche` |
| Adresse en copie | l'adresse dédiée de l'événement | `config.json` → `emails_copie` |
| Contact DPO | auprès du Département | `config.json` → `rgpd.contact_dpo` |
