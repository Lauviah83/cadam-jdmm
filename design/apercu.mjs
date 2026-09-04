/* Convertit un .dc.html en page autonome pour contrôle visuel :
   le contenu de <helmet> passe dans <head>, l'enveloppe <x-dc> disparaît. */
import fs from 'node:fs';
import path from 'node:path';
const src = process.argv[2], dest = process.argv[3];
let h = fs.readFileSync(src, 'utf8');
const helmet = (h.match(/<helmet>([\s\S]*?)<\/helmet>/) || [, ''])[1];
const corps = h.split('</helmet>')[1].split('</x-dc>')[0];
fs.writeFileSync(dest, `<!doctype html><html lang="fr"><head><meta charset="utf-8">${helmet}
<style>body{margin:0}</style></head><body>${corps}</body></html>`, 'utf8');
