/* Mesure la hauteur RÉELLE du contenu d'un écran à cadre fixe.
   Les coques mobile ont height:844px + overflow:hidden : un dépassement y est
   coupé silencieusement, donc invisible pour un contrôle qui regarde seulement
   si le cadre grandit. On neutralise la contrainte le temps de la mesure. */
import fs from 'node:fs';
const [, , src, dest] = process.argv;
let h = fs.readFileSync(src, 'utf8');
const helmet = (h.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1];
let corps = h.split('</helmet>')[1].split('</x-dc>')[0];
corps = corps
  .replace(/height:844px/g, 'min-height:844px')
  .replace(/height:900px/g, 'min-height:900px')
  .replace(/overflow:hidden/g, 'overflow:visible')
  // height:100% sur un conteneur interne le fige à la hauteur du parent :
  // son contenu déborde alors sans agrandir la page, et la mesure ne voit rien.
  .replace(/height:100%/g, 'min-height:100%')
  .replace(/flex:1;min-height:0/g, 'flex:1 0 auto');
fs.writeFileSync(dest, `<!doctype html><html lang="fr"><head><meta charset="utf-8">${helmet}
<style>body{margin:0;background:#FF00FF}</style></head><body>${corps}</body></html>`, 'utf8');
