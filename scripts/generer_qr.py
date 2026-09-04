#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère le QR code de l'application et la planche A5 à imprimer pour le stand.

Le QR est produit en SVG (vectoriel) : il reste net quel que soit le format
d'impression, du roll-up 60×160 cm à la carte de poche.

Usage :
    python3 scripts/generer_qr.py                      # URL par défaut du dépôt
    python3 scripts/generer_qr.py https://exemple.fr/  # autre URL
"""

import re
import sys
from pathlib import Path

import qrcode
import qrcode.image.svg

RACINE = Path(__file__).resolve().parent.parent
URL_DEFAUT = "https://departement06.github.io/cadam-jdmm/"


def generer_qr(url: str, chemin: Path) -> None:
    """
    Correction d'erreur au niveau Q (25 %) : un QR imprimé sur un roll-up de
    stand est touché, corné et photographié de biais. Le niveau L, plus dense,
    serait plus fin à imprimer mais moins tolérant.
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=10,
        border=4,      # marge de silence obligatoire : 4 modules minimum
    )
    qr.add_data(url)
    qr.make(fit=True)

    image = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
    image.save(str(chemin))
    print(f"  {chemin.relative_to(RACINE)} — version {qr.version}, "
          f"{qr.modules_count}×{qr.modules_count} modules")


def generer_planche(url: str, qr_svg: str, chemin: Path) -> None:
    """Planche A5 portrait (559 × 794 px à 96 ppp), prête à imprimer."""
    # On réutilise le tracé du QR en l'incrustant : la planche reste un seul
    # fichier, imprimable sans dépendance.
    tracé = qr_svg.split('<svg', 1)[1].split('>', 1)[1].rsplit('</svg>', 1)[0]
    entete = qr_svg.split('<svg', 1)[1].split('>', 1)[0]
    # Le viewBox contient des espaces (« 0 0 41 41 ») : le lire avec une
    # expression régulière, pas en découpant l'en-tête sur les espaces.
    trouve = re.search(r'viewBox="([^"]+)"', entete)
    if not trouve:
        raise SystemExit("viewBox introuvable dans le SVG du QR")
    viewbox = trouve.group(1)

    chemin.write_text(f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Planche A5 — Métiers &amp; Mobilité DCIP</title>
<style>
  /* A5 portrait. Composée en unités physiques : ce qui est imprimé fait foi. */
  @page {{ size: A5 portrait; margin: 0; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; font-family: Manrope, "Segoe UI", Helvetica, Arial, sans-serif; }}
  .planche {{
    width: 148mm; height: 210mm; padding: 14mm 13mm;
    background: #FAFAF8; color: #042C53;
    display: flex; flex-direction: column; page-break-after: always;
  }}
  .bandeau {{
    margin: -14mm -13mm 9mm; padding: 9mm 13mm 8mm;
    background: #042C53; color: #fff; border-bottom: 3mm solid #EF9F27;
  }}
  .surtitre {{
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 8pt; letter-spacing: .16em; text-transform: uppercase; color: #EF9F27;
  }}
  h1 {{
    margin: 3mm 0 0; font-family: Fraunces, Georgia, serif; font-weight: 400;
    font-size: 26pt; line-height: 1.1; letter-spacing: -.02em;
  }}
  h1 em {{ font-style: italic; color: #EF9F27; }}
  .accroche {{ margin: 4mm 0 0; font-size: 11pt; line-height: 1.5; color: #455465; }}
  .qr-zone {{
    margin: 8mm auto; padding: 6mm; background: #fff;
    border: .4mm solid #D9DFE7; border-radius: 3mm; width: 74mm;
  }}
  .qr-zone svg {{ width: 100%; height: auto; display: block; }}
  .consigne {{ text-align: center; font-size: 12pt; font-weight: 700; margin-top: 2mm; }}
  .url {{
    text-align: center; font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 8.5pt; color: #616D82; margin-top: 2mm; word-break: break-all;
  }}
  ul {{ margin: 6mm 0 0; padding: 0; list-style: none; }}
  li {{
    display: flex; gap: 3mm; align-items: baseline;
    font-size: 10.5pt; line-height: 1.5; margin-bottom: 2.5mm;
  }}
  li b {{ color: #042C53; }}
  .puce {{
    flex: 0 0 auto; width: 2mm; height: 2mm; border-radius: 50%;
    background: #EF9F27; transform: translateY(-.5mm);
  }}
  footer {{
    margin-top: auto; padding-top: 5mm; border-top: .3mm solid #D9DFE7;
    font-size: 8.5pt; color: #616D82; line-height: 1.5;
  }}
  @media screen {{
    body {{ background: #E8E6E1; padding: 10mm; }}
    .planche {{ margin: 0 auto; box-shadow: 0 2mm 8mm rgba(0,0,0,.15); }}
  }}
</style></head>
<body>
<div class="planche">
  <div class="bandeau">
    <p class="surtitre">Journée des métiers et de la mobilité · CADAM</p>
    <h1>Métiers &amp; mobilité<br><em>à la DCIP</em></h1>
  </div>

  <p class="accroche">Construire, entretenir et sécuriser les bâtiments du Département :
    8&nbsp;services, 10&nbsp;phases, des métiers qu'on ne soupçonne pas.</p>

  <div class="qr-zone">
    <svg viewBox="{viewbox}" xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="QR code vers l'application Métiers et mobilité DCIP">{tracé}</svg>
  </div>
  <p class="consigne">Scannez, jouez, repartez avec les offres</p>
  <p class="url">{url}</p>

  <ul>
    <li><span class="puce"></span><span><b>Le parcours d'un projet</b> — de l'intention à l'exploitation</span></li>
    <li><span class="puce"></span><span><b>Trois quiz</b> — prévention incendie, gardiennage, sûreté</span></li>
    <li><span class="puce"></span><span><b>Les postes ouverts</b> — reçus par courriel, en une adresse</span></li>
  </ul>

  <footer>
    Département des Alpes-Maritimes — Direction de la Construction, de l'Immobilier
    et du Patrimoine. Aucun traceur, aucune inscription.
  </footer>
</div>
</body></html>
''', encoding='utf-8')
    print(f"  {chemin.relative_to(RACINE)} — A5 portrait, prête à imprimer")


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else URL_DEFAUT
    if url == URL_DEFAUT:
        print("AVERTISSEMENT : URL par défaut utilisée. Passez l'URL de production "
              "en argument une fois GitHub Pages activé.")

    (RACINE / "assets").mkdir(exist_ok=True)
    chemin_qr = RACINE / "assets" / "qr-application.svg"
    generer_qr(url, chemin_qr)
    generer_planche(url, chemin_qr.read_text(encoding="utf-8"),
                    RACINE / "assets" / "planche-a5.html")
    print(f"\nURL encodée : {url}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
