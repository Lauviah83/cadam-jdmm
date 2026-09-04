# Générateur des maquettes

Ces fichiers produisent les 35 planches du canvas de conception. Ils ne font pas partie
de l'application : ils servent à régénérer les maquettes quand le contenu ou la charte bouge.

Un seul générateur produit les DEUX designs, à partir des mêmes `data/*.json` : c'est ce
qui garantit qu'ils restent comparables et interchangeables.

```bash
node design/generer.mjs            # écrit les .dc.html et canvas.json
node design/controler.mjs          # rend chaque planche et détecte les débordements
```

`controler.mjs` a besoin de `chromium` sur la machine. Il capture chaque planche plus haut
que son cadre et signale toute planche dont le contenu dépasse — le seul vrai risque sur un
canvas à cadres fixes.
