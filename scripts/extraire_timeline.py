#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extrait le contenu du roll-up 60×160 cm vers data/timeline.json."""
import json, re, subprocess, unicodedata
from pathlib import Path

# Chemin relatif au script : le dépôt doit pouvoir être cloné n'importe où.
RACINE = Path(__file__).resolve().parent.parent
PDF = RACINE / 'sources' / 'timeline_rollup_60x160cm.pdf'

texte = subprocess.run(['pdftotext', '-layout', str(PDF), '-'],
                       capture_output=True, text=True, check=True).stdout

def cle(nom: str) -> str:
    base = ''.join(c for c in unicodedata.normalize('NFD', nom)
                   if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '-', base).strip('-')

# Couleurs relevées au pixel sur le rendu du PDF (150 ppp), recoupées d'une
# phase à l'autre. Les 8 services, puis les 3 autres types d'intervenants.
COULEURS = {
    'etudes-prealables': '#2C5282', 'gestion-immobiliere-fonciere': '#2F855A',
    'etudes-et-travaux': '#2B6CB0', 'energie-et-fluides': '#B7791F',
    'securite-surete-prevention': '#C53030', 'entretien-de-proximite': '#6B46C1',
    'maintenance-des-batiments': '#38A169', 'maintenance-des-colleges': '#319795',
    'politique': '#4C1D95', 'direction': '#1A365D',
    'mission-energies-renouvelables': '#65A30D',
    'tous-les-services-selon-les-besoins': '#B8761A',
}
# Les 8 services de la DCIP. « Politique », « Direction » et la mission
# transverse interviennent aussi, mais ne sont pas des services : c'est ce qui
# fait tomber le compte sur 8, comme l'annonce le pied du roll-up.
SERVICES = ['etudes-prealables', 'gestion-immobiliere-fonciere', 'etudes-et-travaux',
            'energie-et-fluides', 'securite-surete-prevention', 'entretien-de-proximite',
            'maintenance-des-batiments', 'maintenance-des-colleges']

ETAPES = [
    {'id': 'conception',   'num': 1, 'titre': 'Conception',
     'accroche': 'Du besoin au projet',    'couleur': '#1E4D8F'},
    {'id': 'realisation',  'num': 2, 'titre': 'Réalisation',
     'accroche': 'Du projet au bâtiment',  'couleur': '#C2410C'},
    {'id': 'exploitation', 'num': 3, 'titre': 'Exploitation',
     'accroche': 'Le bâtiment prend vie',  'couleur': '#0F766E'},
]

# Le pied du roll-up (« UNE EXPERTISE COMPLÈTE… / 10 phases · 3 grandes
# étapes · 8 services ») suit immédiatement les intervenants de la phase 10 :
# sans cette coupe, il est aspiré comme deux intervenants de plus.
coupe = texte.find('UNE EXPERTISE COMPLÈTE')
if coupe > 0:
    texte = texte[:coupe]

# Découpage par phase. Chaque bloc commence par « PHASE NN · ÉTAPE ».
blocs = re.split(r'PHASE\s+(\d{2})\s*·\s*([A-ZÉÀÊ]+)', texte)[1:]
phases, intervenants_vus = [], {}

for i in range(0, len(blocs), 3):
    num, etape_brute, corps = int(blocs[i]), blocs[i + 1], blocs[i + 2]
    lignes = [l.strip() for l in corps.split('\n') if l.strip()]

    titre = lignes[0]
    citation = ''
    points, noms = [], []
    dans_intervenants = False

    for ligne in lignes[1:]:
        # La citation partage sa ligne avec le numéro de phase, qui figure dans
        # une colonne de gauche (« 01           « Tout commence par une idée » »).
        # On la prend entre ses guillemets, pas en début de ligne.
        entre_guillemets = re.search(r'«\s*(.+?)\s*»', ligne)
        if entre_guillemets:
            citation = entre_guillemets.group(1)
        elif ligne.startswith('•'):
            points.append(ligne.lstrip('• ').strip())
            dans_intervenants = False
        elif ligne.startswith('INTERVENANTS'):
            dans_intervenants = True
            reste = ligne[len('INTERVENANTS'):].strip()
            if reste:
                noms += re.split(r'\s{3,}', reste)
        elif dans_intervenants:
            noms += re.split(r'\s{3,}', ligne)
        elif points and not ligne.startswith(('PHASE', 'INTERVENANTS')):
            # Suite d'un point replié sur la ligne suivante.
            points[-1] += ' ' + ligne

    noms = [n.strip() for n in noms if n.strip()]
    for n in noms:
        intervenants_vus.setdefault(cle(n), n)

    phases.append({
        'num': num,
        'etape': {'CONCEPTION': 'conception', 'RÉALISATION': 'realisation',
                  'EXPLOITATION': 'exploitation'}[etape_brute],
        'titre': titre,
        'citation': citation,
        'points': points,
        'intervenants': [cle(n) for n in noms],
    })

# Un intervenant manquant de la table de couleurs signalerait une extraction
# incomplète : mieux vaut s'en apercevoir ici que sur le stand.
inconnus = [k for k in intervenants_vus if k not in COULEURS]
if inconnus:
    raise SystemExit(f"Intervenants sans couleur relevée : {inconnus}")

# Une extraction muette est pire qu'une extraction en échec : on refuse de
# produire un fichier incomplet.
manquantes = [p['num'] for p in phases if not p['citation']]
if manquantes:
    raise SystemExit(f"Phases sans citation : {manquantes}")
if len(phases) != 10:
    raise SystemExit(f"{len(phases)} phases extraites, 10 attendues")

sortie = {
    'titre': "Vie d'un projet immobilier",
    'sous_titre': "Du besoin premier à l'amélioration continue "
                  "— les 10 étapes d'un projet et leurs intervenants.",
    'source': 'sources/timeline_rollup_60x160cm.pdf (roll-up 60 × 160 cm)',
    '_note_couleurs': (
        "Les couleurs sont celles du roll-up, prélevées au pixel : le visiteur "
        "retrouve le même code entre le panneau et l'écran. Cinq d'entre elles "
        "n'atteignent pas le seuil AA en petit corps (Énergie et fluides 3,5:1, "
        "Maintenance des bâtiments 3,1:1, Maintenance des collèges 3,4:1, Mission "
        "Énergies Renouvelables 3,0:1, Tous les services 3,6:1). Elles ne servent "
        "donc QUE de repère décoratif — pastille et filet — et jamais à porter du "
        "texte : le nom du service est toujours écrit en couleur de texte normale."),
    'etapes': ETAPES,
    'services': [{'id': k, 'nom': intervenants_vus[k], 'couleur': COULEURS[k],
                  'est_service': k in SERVICES}
                 for k in intervenants_vus],
    'phases': phases,
}

(RACINE / 'data' / 'timeline.json').write_text(
    json.dumps(sortie, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

print(f"{len(phases)} phases · {len(ETAPES)} étapes · "
      f"{sum(1 for s in sortie['services'] if s['est_service'])} services "
      f"({len(sortie['services'])} intervenants au total)")
for p in phases:
    print(f"  {p['num']:02d} [{p['etape'][:5]}] {p['titre'][:44]:46} "
          f"{len(p['points'])} pts · {len(p['intervenants'])} interv.")
