/* Les deux chartes. Même jeu de rôles sémantiques, deux habillages :
   c'est ce qui rend les designs interchangeables sans toucher au reste. */

export const A = {
  cle: 'a',
  nom: 'Institutionnel',
  devise: 'La charte des fichiers du projet, systématisée',

  // Polices — Fraunces / Manrope / JetBrains Mono, reprises des sources.
  fontesGoogle: 'family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500',
  titre: "'Fraunces', 'Iowan Old Style', Palatino, Georgia, serif",
  texte: "'Manrope', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
  titreStyle: 'font-weight:400;font-variation-settings:"opsz" 144;letter-spacing:-.02em',
  titreItal: 'font-style:italic',

  // Fonds et texte
  fond: '#FAFAF8',
  fondAlt: '#F6F4EF',
  surface: '#FFFFFF',
  texteFort: '#042C53',
  texteDoux: '#455465',
  texteFaible: '#616D82',
  bordure: '#D9DFE7',
  bordureDouce: 'rgba(0,0,0,.07)',

  // Marque
  encre: '#042C53',
  encre2: '#0C447C',
  lien: '#185FA5',
  clair: '#B5D4F4',
  glace: '#E6F1FB',

  // Accents
  accent: '#EF9F27',          // aplats et filets uniquement (2,1:1 sur clair)
  accentTexte: '#96590A',     // 5,4:1 sur clair
  accentFond: '#FAEEDA',
  succes: '#0F6E56',
  succesFond: '#E1F5EE',
  alerte: '#993C1D',
  alerteFond: '#FAECE7',

  rayon: 16,
  rayonPetit: 10,
  rayonPastille: 999,
  ombre: '0 2px 6px rgba(4,44,83,.07),0 6px 16px rgba(4,44,83,.06)',
  ombreForte: '0 8px 24px rgba(4,44,83,.10),0 16px 48px rgba(4,44,83,.08)',
  entete: 'linear-gradient(150deg,#031F3D 0%,#0C447C 100%)',
  eyebrowEspace: '.14em',
};

export const B = {
  cle: 'b',
  nom: 'Signature',
  devise: 'Héraldique départementale : encre, or, gueules',

  // Polices — grotesque de signalétique en titrage, Plex en lecture.
  // Volontairement éloigné du couple serif/sans du Design A.
  fontesGoogle: 'family=Archivo:wdth,wght@75..100,400..800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500',
  titre: "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  texte: "'IBM Plex Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace",
  titreStyle: 'font-weight:800;font-variation-settings:"wdth" 88;letter-spacing:-.03em;text-transform:none',
  titreItal: 'font-style:normal;color:#8A6410',

  fond: '#FBFAF7',
  fondAlt: '#F2F0EA',
  surface: '#FFFFFF',
  texteFort: '#14293D',        // 14,2:1
  texteDoux: '#4A5B6B',        // 6,7:1
  texteFaible: '#5C6B77',      // 5,3:1
  bordure: '#DAD6CB',
  bordureDouce: 'rgba(11,46,79,.10)',

  encre: '#0B2E4F',            // blanc dessus 13,8:1
  encre2: '#123A5C',
  lien: '#0B2E4F',
  clair: '#AFC4D6',
  glace: '#EAF0F5',

  accent: '#D4A24A',           // or sur encre : 6,0:1
  accentTexte: '#8A6410',      // or foncé sur clair : 5,1:1
  accentFond: '#F7EFDD',
  succes: '#0F5B44',           // 7,7:1
  succesFond: '#E4F0EA',
  alerte: '#B02026',           // gueules, 6,5:1
  alerteFond: '#F9E9E9',

  // Angles plus francs : la signalétique administrative, pas l'application grand public.
  rayon: 4,
  rayonPetit: 3,
  rayonPastille: 3,
  ombre: '0 1px 2px rgba(11,46,79,.08)',
  ombreForte: '0 4px 16px rgba(11,46,79,.14)',
  entete: '#0B2E4F',
  eyebrowEspace: '.18em',
};

/* Ambiances sombres des quiz — conservées des sources dans les deux chartes
   (le fond sombre par thème fait partie du contenu validé), mais réglées
   sur les tokens de chaque charte pour les accents de texte. */
export const QUIZ = {
  feu:  { fond: '#0F0E0C', surface: '#1A1815', accent: '#E94B1F', accentTexte: '#F0703F',
          texte: '#F5F2ED', doux: '#B9B4AC', nom: 'Prévention incendie' },
  gard: { fond: '#0B0E14', surface: '#151A24', accent: '#3B82F6', accentTexte: '#5C97F8',
          texte: '#EEF2F8', doux: '#B9B4AC', nom: 'Gardiennage' },
  surt: { fond: '#0A0D14', surface: '#141A26', accent: '#3D6FE8', accentTexte: '#4C7BEC',
          texte: '#EEF2F8', doux: '#B9B4AC', nom: 'Sûreté' },
};
