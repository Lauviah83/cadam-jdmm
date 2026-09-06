#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrait le CSS des panneaux de quiz depuis sources/quiz-hub-mobile.html
vers css/quiz.css, en réparant ce qui était cassé.

Le fichier source portait sept sélecteurs annulés par un commentaire placé À
L'INTÉRIEUR du sélecteur (`#qz-feu /* HEADER */ .brand-row`) : la règle entière
était ignorée par le navigateur. Étaient concernés l'écran d'intro, l'en-tête
de question, l'écran de résultats, l'animation d'apparition, la texture de
fond, et TOUT le bloc responsive sous 540 px — c'est-à-dire l'essentiel de la
mise en page sur un téléphone.

Le cahier des charges demandait explicitement de corriger ces sélecteurs.
"""

import re
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / 'sources' / 'quiz-hub-mobile.html'
SORTIE = RACINE / 'css' / 'quiz.css'

# Le quiz « feu » nomme son accent --flame, les deux autres --accent : on
# uniformise pour n'avoir qu'un seul jeu de règles.
RENOMMAGES = {'--flame-2': '--accent-2', '--flame': '--accent', '--gold': '--amber'}

# Les variables du fichier source (--bg, --surface, --text, --line…) portent les
# mêmes noms que celles des thèmes de l'application, où --surface vaut #FFFFFF.
# Sans préfixe, les options d'un quiz héritaient d'un fond blanc sur fond noir.
PREFIXE = 'qz-'
VARIABLES = ('bg', 'bg-2', 'surface', 'surface-2', 'line', 'text', 'text-mute',
             'text-soft', 'accent', 'accent-2', 'amber', 'green', 'red', 'shadow')


def decouper(css):
    """Découpe une feuille en règles de premier niveau, @media compris."""
    regles, i, n = [], 0, len(css)
    while i < n:
        # Sauter les espaces et commentaires de tête, sinon un @media ou un
        # @keyframes précédé d'un retour à la ligne prend le chemin des règles
        # simples : il est alors coupé à sa première accolade fermante, ce qui
        # laisse le reste de la feuille non fermé — donc entièrement ignoré
        # par le navigateur.
        if css[i] in ' \t\r\n':
            i += 1
            continue
        if css.startswith('/*', i):
            fin_c = css.find('*/', i)
            i = (fin_c + 2) if fin_c > 0 else n
            continue
        # Le source préfixe TOUTES les lignes de sélecteur par « #qz-xxx », y
        # compris la ligne de commentaire qui précède un @media :
        #     #qz-feu /* ---------- RESPONSIVE ---------- */
        #     @media (max-width: 540px) {
        # Le bloc ne commence donc pas par « @ ». On regarde ce qu'il y a
        # vraiment avant l'accolade, commentaires retirés.
        prochaine = css.find('{', i)
        tete = re.sub(r'/\*.*?\*/', ' ', css[i:prochaine], flags=re.S) if prochaine > 0 else ''
        if css[i] == '@' or '@media' in tete or '@keyframes' in tete or '@supports' in tete:
            j = css.index('{', i)
            prof, k = 1, j + 1
            while k < n and prof:
                if css[k] == '{':
                    prof += 1
                elif css[k] == '}':
                    prof -= 1
                k += 1
            regles.append(css[i:k])
            i = k
        else:
            j = css.find('{', i)
            if j < 0:
                break
            k = css.find('}', j)
            regles.append(css[i:k + 1])
            i = k + 1
    return regles


def reparer(selecteur):
    """Retire les commentaires internes qui annulaient le sélecteur."""
    selecteur = re.sub(r'/\*.*?\*/', ' ', selecteur, flags=re.S)
    return re.sub(r'\s+', ' ', selecteur).strip().lstrip('}').strip()


def porter(selecteur):
    """Reporte un sélecteur `#qz-feu …` sur la classe `.quiz` de l'application."""
    selecteur = selecteur.replace('#qz-feu::before', '&::before')
    selecteur = re.sub(r'#qz-(feu|gard|surt)', '.quiz', selecteur)
    # Le doublon « .quiz, .quiz » du source, et « .quiz .quiz::before ».
    morceaux = [m.strip() for m in selecteur.split(',')]
    vus, propres = set(), []
    for m in morceaux:
        m = m.replace('.quiz &::before', '.quiz::before').replace('&::before', '.quiz::before')
        m = re.sub(r'^\.quiz \.quiz', '.quiz', m)
        if m and m not in vus:
            vus.add(m)
            propres.append(m)
    return ', '.join(propres)


def renommer(corps):
    for avant, apres in RENOMMAGES.items():
        corps = corps.replace(f'var({avant})', f'var({apres})')
        corps = re.sub(rf'^(\s*){re.escape(avant)}\s*:', rf'\1{apres}:', corps, flags=re.M)
    # Puis on préfixe, du nom le plus long au plus court pour ne pas couper
    # « --text-mute » en traitant « --text ».
    for nom in sorted(VARIABLES, key=len, reverse=True):
        corps = corps.replace(f'var(--{nom})', f'var(--{PREFIXE}{nom})')
        corps = re.sub(rf'(^|\s)--{re.escape(nom)}\s*:', rf'\1--{PREFIXE}{nom}:', corps)
    return corps


def main():
    html = SOURCE.read_text(encoding='utf-8')
    css = re.findall(r'<style>(.*?)</style>', html, re.S)[0]
    regles = decouper(css)

    # Les trois quiz portent les mêmes règles, à leurs variables près : le
    # source les répète donc trois fois. On conserve l'ORDRE d'origine — la
    # cascade en dépend — et on écarte seulement les répétitions à l'identique.
    # Regrouper par sélecteur serait faux : « #qz-feu » porte successivement
    # ses variables, puis son fond, puis sa hauteur ; ce sont trois règles
    # distinctes, pas trois variantes d'une même règle.
    palettes, medias = {}, []
    composants = []        # [(sélecteur porté, corps)]
    deja_vues = set()
    repares = 0

    # Le hub a son propre design, sur fond clair : ses règles sont reprises
    # telles quelles, en portant #hub sur .hub.
    hub = []
    for regle in regles:
        if re.match(r'^\s*(#hub|\.hub-|\.quiz-grid|\.quiz-card|\.card-|\.dot\b|@keyframes blink)', regle):
            sel, corps = regle.split('{', 1)
            sel = reparer(sel).replace('#hub', '.hub')
            if sel.startswith('@keyframes'):
                hub.append(regle.strip())
            else:
                hub.append(f'{sel} {{{corps.rstrip().rstrip("}")}}}')
            continue
        if '#qz-' not in regle:
            continue

        entete_brute = re.sub(r'/\*.*?\*/', ' ', regle.split('{', 1)[0], flags=re.S)
        if '@media' in entete_brute or '@keyframes' in entete_brute or '@supports' in entete_brute:
            entete, corps = regle.split('{', 1)
            entete = reparer(entete)
            # On jette ce qui précède le @ : c'est le préfixe parasite du source.
            if not entete.startswith('@'):
                entete = '@' + entete.split('@', 1)[1]
                repares += 1
            interieur = corps.rsplit('}', 1)[0]
            interieur = renommer(re.sub(r'#qz-(feu|gard|surt)', '.quiz', interieur))
            medias.append(f'{entete} {{{interieur}}}')
            continue

        selecteur, corps = regle.split('{', 1)
        casse = '/*' in selecteur
        selecteur = reparer(selecteur)
        if casse:
            repares += 1
        corps = renommer(corps.rstrip().rstrip('}'))

        # Les blocs de variables restent attachés à leur quiz.
        quiz = re.match(r'^#qz-(feu|gard|surt)$', selecteur)
        # Une palette se reconnaît à une DÉCLARATION de variable (« --qz-bg: »),
        # pas à son usage (« var(--qz-bg) ») : le bloc de fond dégradé utilise
        # la variable sans la définir, et passait pour une palette.
        if quiz and re.search(rf'--{PREFIXE}bg\s*:', corps):
            palettes[quiz.group(1)] = corps
            continue

        cle = porter(selecteur)
        normalise = re.sub(r'\s+', ' ', corps).strip()
        if (cle, normalise) in deja_vues:
            continue
        deja_vues.add((cle, normalise))
        composants.append((cle, normalise))

    sortie_composants = [f'{sel} {{ {corps} }}' for sel, corps in composants]

    sortie_palettes = [f'.quiz[data-quiz="{q}"] {{{c}}}' for q, c in palettes.items()]

    # Les @media sont identiques d'un quiz à l'autre : un seul suffit.
    medias = list(dict.fromkeys(medias))

    SORTIE.write_text(f"""/* ==========================================================================
   quiz.css — GÉNÉRÉ par scripts/extraire_css_quiz.py, ne pas éditer à la main
   --------------------------------------------------------------------------
   Design repris tel quel de sources/quiz-hub-mobile.html, porté de
   « #qz-feu … » sur « .quiz[data-quiz] » pour que les trois quiz partagent
   un seul jeu de règles.

   {repares} sélecteurs du fichier source étaient annulés par un commentaire placé à
   l'intérieur du sélecteur — ils sont réparés ici. Sans cela, l'écran d'intro,
   l'en-tête de question, l'écran de résultats, l'animation d'apparition et
   tout le bloc responsive sous 540 px n'étaient jamais appliqués.

   L'accent du quiz « feu » se nommait --flame, celui des deux autres
   --accent : uniformisé en --accent.
   ========================================================================== */

/* ---------- Le hub, sur fond clair ---------- */
{chr(10).join(hub)}

/* ---------- Palettes, une par quiz ---------- */
{chr(10).join(sortie_palettes)}

/* ---------- Composants ---------- */
{chr(10).join(sortie_composants)}

/* ---------- Adaptations d'écran ---------- */
{chr(10).join(medias)}
""", encoding='utf-8')

    print(f"css/quiz.css : {len(sortie_palettes)} palettes, {len(sortie_composants)} règles, "
          f"{len(medias)} bloc(s) responsive · {repares} sélecteurs réparés "
          f"· {len(hub)} règles de hub")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
