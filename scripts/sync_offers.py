#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Synchronisation des offres d'emploi du Département des Alpes-Maritimes.

Source  : https://www.departement06.fr/offres-demploi (site Drupal, pas de flux RSS ni d'API)
Sortie  : data/offers.json
Cache   : data/.cache/<slug>.json (évite de re-télécharger une fiche inchangée)

Principe de prudence : le script ne remplace `offers.json` QUE s'il a réussi à
collecter un nombre plausible d'offres. En cas d'échec, l'ancien fichier est
conservé intact et le script sort en code 1 (l'Action GitHub ouvre alors une issue).

Usage :
    python3 scripts/sync_offers.py            # synchronisation normale
    python3 scripts/sync_offers.py --dry-run  # n'écrit rien, affiche le résultat
    python3 scripts/sync_offers.py --no-cache # ignore le cache, retélécharge tout
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# --------------------------------------------------------------------------
# Constantes de collecte
# --------------------------------------------------------------------------

RACINE = Path(__file__).resolve().parent.parent
CHEMIN_CONFIG = RACINE / "data" / "config.json"
CHEMIN_POSTES = RACINE / "data" / "postes-dcip.json"
CHEMIN_SORTIE = RACINE / "data" / "offers.json"
CHEMIN_DETAILS = RACINE / "data" / "offers-details.json"
DOSSIER_CACHE = RACINE / "data" / ".cache"

BASE = "https://www.departement06.fr"
URL_LISTE = f"{BASE}/offres-demploi"

# Repo public : le User-Agent doit permettre au Département de nous identifier
# et de nous joindre. Politesse élémentaire, et exigence des CGU de la plupart
# des sites publics.
USER_AGENT = "CD06-JDMM-bot/1.0 (+https://github.com/connect3s/cadam-jdmm)"

DELAI_ENTRE_REQUETES = 1.0   # secondes — on ne martèle pas un site public
TIMEOUT = 20                 # secondes
TENTATIVES = 3               # nombre d'essais par URL
PAGE_MAX = 30                # garde-fou anti-boucle infinie sur la pagination
SEUIL_PLAUSIBILITE = 5       # en dessous, on considère que le scraping a échoué

# Sections attendues sur une fiche détaillée (titres <h2> dans le bloc .rte).
# Si le site en ajoute, elles sont récupérées quand même : la clé est slugifiée.
SECTIONS_CONNUES = [
    "Missions", "Activités", "Profil du candidat", "Prérequis",
    "Conditions de travail", "Lieu de travail", "Rémunération",
    "Modalités de recrutement",
]

MOIS_FR = {
    "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5,
    "juin": 6, "juillet": 7, "août": 8, "aout": 8, "septembre": 9,
    "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
}


# --------------------------------------------------------------------------
# Utilitaires
# --------------------------------------------------------------------------

def log(message: str) -> None:
    """Journalise avec horodatage — lisible dans les logs de GitHub Actions."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


def sans_accents(texte: str) -> str:
    """Retire les accents — utilisé pour la recherche de motifs DCIP."""
    return "".join(
        c for c in unicodedata.normalize("NFD", texte)
        if unicodedata.category(c) != "Mn"
    )


def slugifier(texte: str) -> str:
    """Transforme un titre en identifiant de fichier sûr."""
    base = sans_accents(texte).lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base[:120] or "sans-titre"


def nettoyer(texte: str | None) -> str:
    """Normalise les espaces et les espaces insécables du HTML."""
    if not texte:
        return ""
    return re.sub(r"\s+", " ", texte.replace(" ", " ")).strip()


def charger_json(chemin: Path, defaut):
    """Lecture JSON tolérante : un fichier absent ou corrompu ne fait pas tomber le script."""
    try:
        return json.loads(chemin.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return defaut
    except json.JSONDecodeError as err:
        log(f"AVERTISSEMENT : {chemin.name} illisible ({err}) — valeur par défaut utilisée")
        return defaut


# --------------------------------------------------------------------------
# Couche réseau
# --------------------------------------------------------------------------

class Collecteur:
    """Encapsule la session HTTP, le rythme des requêtes et les réessais."""

    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "fr-FR,fr;q=0.9",
        })
        self._derniere_requete = 0.0

    def _respecter_le_rythme(self) -> None:
        """Garantit au moins DELAI_ENTRE_REQUETES entre deux appels réseau."""
        ecoule = time.monotonic() - self._derniere_requete
        if ecoule < DELAI_ENTRE_REQUETES:
            time.sleep(DELAI_ENTRE_REQUETES - ecoule)
        self._derniere_requete = time.monotonic()

    def recuperer(self, url: str) -> str | None:
        """Télécharge une page. Renvoie None après épuisement des tentatives."""
        for tentative in range(1, TENTATIVES + 1):
            self._respecter_le_rythme()
            try:
                reponse = self.session.get(url, timeout=TIMEOUT)
                if reponse.status_code == 404:
                    log(f"  404 sur {url} — page ignorée")
                    return None
                reponse.raise_for_status()
                reponse.encoding = reponse.apparent_encoding or "utf-8"
                return reponse.text
            except requests.RequestException as err:
                attente = 2 ** tentative  # backoff exponentiel : 2s, 4s, 8s
                log(f"  échec {tentative}/{TENTATIVES} sur {url} ({err.__class__.__name__})")
                if tentative < TENTATIVES:
                    time.sleep(attente)
        log(f"  ABANDON après {TENTATIVES} tentatives : {url}")
        return None


# --------------------------------------------------------------------------
# Extraction — page de liste
# --------------------------------------------------------------------------
# Repères DOM au 2026-09-04 (à réviser ici si le site change de thème) :
#   article.job-item                    → une offre
#   a.job-item__category                → domaine d'activité
#   a.job-item__title-link              → intitulé + URL de la fiche
#   .job-item__infos > p                → "Catégorie(s) : A" / "Filière(s) : FILIERE TECHNIQUE"
#   p.job-item__publication time        → date limite puis date de publication
#   p.job-item__teaser                  → résumé

def extraire_offres_de_la_liste(html: str) -> list[dict]:
    """Extrait les offres d'une page de résultats."""
    soup = BeautifulSoup(html, "html.parser")
    offres: list[dict] = []

    for article in soup.select("article.job-item"):
        lien = article.select_one("a.job-item__title-link")
        if not lien or not lien.get("href"):
            continue

        chemin = lien["href"].split("?")[0]
        titre = nettoyer(lien.get_text())
        domaine = nettoyer(
            article.select_one("a.job-item__category").get_text()
            if article.select_one("a.job-item__category") else ""
        )

        # Catégories et filières : plusieurs valeurs possibles, séparées par des virgules.
        categories: list[str] = []
        filieres: list[str] = []
        for info in article.select(".job-item__infos p"):
            texte = nettoyer(info.get_text())
            valeur = texte.split(":", 1)[1].strip() if ":" in texte else ""
            if not valeur:
                continue
            morceaux = [m.strip() for m in valeur.split(",") if m.strip()]
            if "atégorie" in texte:
                categories = morceaux
            elif "ilière" in texte or "iliere" in texte:
                # "FILIERE ADMINISTRATIVE" → "ADMINISTRATIVE"
                filieres = [re.sub(r"^FILIERE\s+", "", m, flags=re.I) for m in morceaux]

        # Les deux <time> de l'article : date limite (is-large) puis publication (is-primary).
        deadline = deadline_label = publie_le = ""
        for para in article.select("p.job-item__publication"):
            balise_time = para.find("time")
            if not balise_time:
                continue
            iso = balise_time.get("datetime", "")
            libelle = nettoyer(balise_time.get_text())
            if "ostuler" in para.get_text():
                deadline, deadline_label = iso, libelle
            elif "ublié" in para.get_text() or "ublie" in para.get_text():
                publie_le = iso

        teaser = article.select_one("p.job-item__teaser")

        offres.append({
            "id": slugifier(chemin.rsplit("/", 1)[-1]),
            "titre": titre,
            "url": BASE + chemin,
            "chemin": chemin,
            "domaine": domaine,
            "categorie": categories[0] if categories else "",
            "categories": categories,
            "filiere": filieres[0] if filieres else "",
            "filieres": filieres,
            "deadline": deadline,
            "deadline_label": deadline_label,
            "publie_le": publie_le,
            "resume": nettoyer(teaser.get_text()) if teaser else "",
        })

    return offres


# --------------------------------------------------------------------------
# Extraction — fiche détaillée
# --------------------------------------------------------------------------

def extraire_detail(html: str) -> dict:
    """
    Extrait le corps d'une fiche : chaque <h2> du bloc .rte ouvre une section,
    le texte qui suit jusqu'au <h2> suivant en constitue le contenu.
    """
    soup = BeautifulSoup(html, "html.parser")
    detail: dict[str, object] = {}

    bloc = soup.select_one("div.rte")
    if bloc:
        titre_courant = None
        morceaux: list[str] = []

        def cloturer() -> None:
            """Enregistre la section en cours si elle a du contenu."""
            if titre_courant and morceaux:
                contenu = nettoyer(" ".join(morceaux))
                if contenu:
                    detail[slugifier(titre_courant)] = {
                        "titre": titre_courant,
                        "texte": contenu,
                        # Les fiches listent souvent les activités en "- item<br>- item"
                        "items": [
                            nettoyer(x) for x in re.split(r"(?:^|\s)[-–•]\s+", contenu)
                            if len(nettoyer(x)) > 3
                        ][1:] or [],
                    }

        for element in bloc.children:
            nom = getattr(element, "name", None)
            if nom in ("h2", "h3"):
                cloturer()
                titre_courant = nettoyer(element.get_text())
                morceaux = []
            elif nom == "br":
                morceaux.append(" - ")
            else:
                texte = element.get_text() if nom else str(element)
                if nettoyer(texte):
                    morceaux.append(nettoyer(texte))
        cloturer()

    # "Cadre(s) d'emploi(s)" figure dans l'en-tête, pas dans le corps de la fiche.
    for info in soup.select(".infos__item"):
        texte = nettoyer(info.get_text())
        if "adre(s) d" in texte and ":" in texte:
            detail["cadre_emploi"] = texte.split(":", 1)[1].strip()

    # Lien "Postuler en ligne" (redirection Drupal /stratis-external-link/<id>).
    for bouton in soup.select("a.btn"):
        if "ostuler" in bouton.get_text():
            href = bouton.get("href", "")
            if href:
                detail["url_candidature"] = href if href.startswith("http") else BASE + href
            break

    return detail


# --------------------------------------------------------------------------
# Marquage DCIP
# --------------------------------------------------------------------------

def construire_index_dcip(postes: list[dict]) -> dict[str, dict]:
    """Indexe les 7 postes DCIP par dernier segment d'URL, pour un appariement exact."""
    index = {}
    for poste in postes:
        url = (poste.get("url") or "").split("?")[0].rstrip("/")
        if url:
            index[url.rsplit("/", 1)[-1].lower()] = poste
    return index


def marquer_dcip(offre: dict, index_dcip: dict[str, dict],
                 domaines: list[str], motifs: list[str]) -> None:
    """
    Ajoute `dcip`, `service` et `appariement` à une offre.

    Trois voies, par ordre de fiabilité décroissante :
      1. URL identique à l'un des 7 postes de postes-dcip.json → certain, service connu ;
      2. domaine d'activité listé dans `dcip_domaines` (« Patrimoine bâti ») → certain ;
      3. motif de `dcip_patterns` présent dans l'INTITULÉ ou le domaine → heuristique.

    Le résumé est délibérément exclu de la recherche de motifs : testé sur les 46 offres
    en ligne, il produisait 6 faux positifs (« patrimoine » attrapait le patrimoine
    culturel — cinéma, Micro-Folie, médiation ; « collège » attrapait un chef de cuisine).
    Le mot qui DISTINGUE doit primer sur le mot qui ressemble.

    Les deux listes vivent dans data/config.json → ajustables sans toucher au code.
    """
    cle = offre["chemin"].rstrip("/").rsplit("/", 1)[-1].lower()
    poste = index_dcip.get(cle)
    if poste:
        offre.update({
            "dcip": True,
            "service": poste.get("service", ""),
            "poste_dcip_id": poste.get("id", ""),
            "appariement": "url",
        })
        return

    if offre["domaine"] and offre["domaine"] in domaines:
        offre.update({"dcip": True, "service": "", "appariement": "domaine"})
        return

    # Recherche sur l'intitulé et le domaine uniquement, insensible aux accents et à la casse.
    corpus = sans_accents(f"{offre['titre']} {offre['domaine']}").lower()
    for motif in motifs:
        if sans_accents(motif).lower() in corpus:
            offre.update({"dcip": True, "service": "", "appariement": f"motif:{motif}"})
            return

    offre.update({"dcip": False, "service": "", "appariement": ""})


# --------------------------------------------------------------------------
# Cache des fiches détaillées
# --------------------------------------------------------------------------

def detail_depuis_cache(offre: dict, utiliser_cache: bool) -> dict | None:
    """
    Renvoie le détail mis en cache si la fiche n'a pas été republiée depuis.
    La date de publication sert de signature : c'est le seul indicateur de
    fraîcheur que le site expose.
    """
    if not utiliser_cache:
        return None
    fichier = DOSSIER_CACHE / f"{offre['id']}.json"
    donnees = charger_json(fichier, None)
    if isinstance(donnees, dict) and donnees.get("publie_le") == offre["publie_le"]:
        return donnees.get("detail", {})
    return None


def ecrire_cache(offre: dict, detail: dict) -> None:
    """Persiste le détail d'une fiche avec sa date de publication."""
    DOSSIER_CACHE.mkdir(parents=True, exist_ok=True)
    (DOSSIER_CACHE / f"{offre['id']}.json").write_text(
        json.dumps({"publie_le": offre["publie_le"], "url": offre["url"], "detail": detail},
                   ensure_ascii=False, indent=1),
        encoding="utf-8",
    )


# --------------------------------------------------------------------------
# Programme principal
# --------------------------------------------------------------------------

def main() -> int:
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument("--dry-run", action="store_true",
                           help="n'écrit pas offers.json, affiche seulement le résultat")
    analyseur.add_argument("--no-cache", action="store_true",
                           help="retélécharge toutes les fiches détaillées")
    analyseur.add_argument("--sans-detail", action="store_true",
                           help="ne visite pas les fiches (collecte rapide de la liste seule)")
    options = analyseur.parse_args()

    config = charger_json(CHEMIN_CONFIG, {})
    bloc_offres = config.get("offres") or {}
    motifs = bloc_offres.get("dcip_patterns", [])
    domaines = bloc_offres.get("dcip_domaines", [])
    postes = charger_json(CHEMIN_POSTES, [])
    if isinstance(postes, dict):            # tolère {"postes": [...]} comme [...]
        postes = postes.get("postes", [])
    index_dcip = construire_index_dcip(postes)
    log(f"{len(index_dcip)} poste(s) DCIP de référence, {len(domaines)} domaine(s) "
        f"et {len(motifs)} motif(s) de rattachement")

    collecteur = Collecteur()
    offres: list[dict] = []
    vues: set[str] = set()

    # --- 1. Parcours de la pagination -------------------------------------
    for numero in range(PAGE_MAX):
        url = URL_LISTE if numero == 0 else f"{URL_LISTE}?page={numero}"
        html = collecteur.recuperer(url)
        if html is None:
            if numero == 0:
                log("ERREUR : la première page est inaccessible")
                return 1
            break

        lot = extraire_offres_de_la_liste(html)
        if not lot:
            log(f"page {numero} : vide — fin de la pagination")
            break

        # Un site mal paginé peut renvoyer indéfiniment la même page :
        # on s'arrête dès qu'un lot n'apporte aucune offre nouvelle.
        nouvelles = [o for o in lot if o["url"] not in vues]
        if not nouvelles:
            log(f"page {numero} : aucune offre nouvelle — fin de la pagination")
            break

        vues.update(o["url"] for o in nouvelles)
        offres.extend(nouvelles)
        log(f"page {numero} : {len(nouvelles)} offre(s) — total {len(offres)}")

    # --- 2. Garde-fou de plausibilité -------------------------------------
    # Si le site change de structure, `extraire_offres_de_la_liste` renverra peu
    # ou pas d'offres. On refuse alors d'écraser une bonne version d'offers.json.
    if len(offres) < SEUIL_PLAUSIBILITE:
        log(f"ERREUR : {len(offres)} offre(s) collectée(s), seuil minimum {SEUIL_PLAUSIBILITE}.")
        log("Le fichier offers.json existant est CONSERVÉ. Structure du site probablement modifiée :")
        log("  → réviser les sélecteurs CSS dans extraire_offres_de_la_liste() (repères DOM en commentaire).")
        return 1

    # --- 3. Fiches détaillées (avec cache) --------------------------------
    if not options.sans_detail:
        depuis_cache = telecharges = 0
        for offre in offres:
            detail = detail_depuis_cache(offre, not options.no_cache)
            if detail is not None:
                depuis_cache += 1
            else:
                html = collecteur.recuperer(offre["url"])
                detail = extraire_detail(html) if html else {}
                if detail:
                    ecrire_cache(offre, detail)
                telecharges += 1
            offre["detail"] = detail
        log(f"détails : {depuis_cache} depuis le cache, {telecharges} téléchargé(s)")

    # --- 4. Marquage DCIP --------------------------------------------------
    for offre in offres:
        marquer_dcip(offre, index_dcip, domaines, motifs)
        offre.pop("chemin", None)  # champ de travail, inutile côté application
        # Absence de date limite = recrutement permanent (constaté sur 9 offres :
        # médecin, sage-femme, infirmier, TOS…). Ce n'est pas une extraction ratée.
        offre["candidature_permanente"] = not offre["deadline"]
        if offre["candidature_permanente"]:
            offre["deadline_label"] = "Candidature permanente"
    nb_dcip = sum(1 for o in offres if o["dcip"])
    log(f"{nb_dcip} offre(s) rattachée(s) à la DCIP sur {len(offres)}")

    # --- 5. Séparation de la liste et des détails --------------------------
    # Le corps des fiches (missions, activités, profil…) pèse l'essentiel du
    # poids : 342 ko contre 40 ko pour la liste seule. L'écran d'accueil et la
    # liste n'en ont pas besoin — seule l'ouverture d'une fiche l'exige. On
    # écrit donc deux fichiers, et l'application ne charge le second qu'à la
    # demande. Sans cela, un visiteur téléchargeait 342 ko pour lire « 52 offres ».
    details = {}
    liste = []
    for offre in offres:
        detail = offre.pop("detail", None)
        if detail:
            details[offre["id"]] = detail
        liste.append(offre)

    horodatage = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    charge_utile = {
        "generated_at": horodatage,
        "source": URL_LISTE,
        "count": len(liste),
        "count_dcip": nb_dcip,
        "offers": liste,
    }
    charge_details = {"generated_at": horodatage, "details": details}

    if options.dry_run:
        log(f"--dry-run : rien n'est écrit ({len(details)} détail(s) mis de côté)")
        print(json.dumps(charge_utile, ensure_ascii=False, indent=2)[:2000])
        return 0

    # `generated_at` change à chaque exécution : on compare tout SAUF ce champ,
    # sinon la GitHub Action produirait un commit quotidien sans changement réel.
    ancien = charger_json(CHEMIN_SORTIE, None)
    if isinstance(ancien, dict):
        comparable_ancien = {k: v for k, v in ancien.items() if k != "generated_at"}
        comparable_neuf = {k: v for k, v in charge_utile.items() if k != "generated_at"}
        if comparable_ancien == comparable_neuf:
            log("aucun changement dans les offres — offers.json laissé intact")
            return 0

    CHEMIN_SORTIE.parent.mkdir(parents=True, exist_ok=True)
    CHEMIN_SORTIE.write_text(
        json.dumps(charge_utile, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    CHEMIN_DETAILS.write_text(
        json.dumps(charge_details, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    poids = lambda c: c.stat().st_size // 1024
    log(f"offers.json écrit : {len(liste)} offre(s), {nb_dcip} DCIP ({poids(CHEMIN_SORTIE)} ko)")
    log(f"offers-details.json écrit : {len(details)} fiche(s) ({poids(CHEMIN_DETAILS)} ko)")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log("interrompu")
        sys.exit(130)
