/* ==========================================================================
   views/quiz.js — Moteur de quiz générique
   --------------------------------------------------------------------------
   Un seul moteur pour les trois quiz. Les sources en avaient trois copies
   préfixées (QF_, QG_, QS_), d'où trois occasions de diverger — et une
   divergence réelle : les compteurs affichés (9, 8, 8) ne correspondaient
   pas aux tableaux (8, 6, 6). Ici, TOUT nombre affiché est calculé.

   Le moteur gère :
     · la question à réponse unique   → role="radiogroup"
     · la question à réponses multiples → role="group" + cases à cocher,
       validée sur l'ensemble exact des réponses attendues
     · la correction rédigée (HTML de mise en valeur conservé)
     · la progression, le récapitulatif final et les verdicts par palier
   ========================================================================== */

import { ico } from '../commun/icones.js';
import { enregistrerResultatQuiz, obtenirResultatsQuiz } from '../commun/store.js';
import { annoncer } from '../commun/interface.js';

const ICONE_QUIZ = { feu: 'flamme', gard: 'bouclier', surt: 'camera' };

let catalogue = null;

async function charger() {
  if (catalogue) return catalogue;
  try {
    const reponse = await fetch(new URL('../../data/quiz.json', import.meta.url), { cache: 'no-cache' });
    catalogue = await reponse.json();
  } catch (err) {
    console.error('[quiz] quiz.json illisible', err);
    catalogue = [];
  }
  return catalogue;
}

/* =========================================================================
   Hub
   ========================================================================= */

export async function rendreHub(section) {
  const quiz = await charger();
  const resultats = obtenirResultatsQuiz();

  if (!quiz.length) {
    section.innerHTML = `<div class="section"><div class="bandeau bandeau--alerte">
      ${ico('alerte', 16)}<span>Les quiz ne sont pas disponibles pour le moment.</span></div></div>`;
    return;
  }

  const total = quiz.reduce((n, q) => n + q.questions.length, 0);

  section.innerHTML = `
    <div class="hero">
      <div class="hero__interieur">
        <div>
          <p class="hero-pill">Jouez et remportez des goodies</p>
          <h1 id="titre-quiz">Trois <em>quiz</em></h1>
          <p class="sous">${total} questions · ${quiz.length} métiers · aucune inscription</p>
        </div>
      </div>
    </div>
    <div class="section pile">
      ${quiz.map((q) => carteQuiz(q, resultats[q.id])).join('')}
    </div>`;
}

function carteQuiz(q, resultat) {
  const fait = resultat
    ? `<span class="badge badge--succes">${ico('coche', 12)} ${resultat.meilleur}/${q.questions.length}</span>`
    : '';
  return `
    <a class="quiz" data-quiz="${q.id}" href="#/${q.id}"
       style="display:block;min-height:0;border-radius:var(--rayon-lg);overflow:hidden;text-decoration:none">
      <div style="padding:var(--pas-4)">
        <div class="rangee" style="align-items:flex-start">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;
            flex:0 0 38px;border-radius:50%;background:color-mix(in srgb, var(--q-accent) 14%, transparent);
            color:var(--q-accent)" aria-hidden="true">${ico(ICONE_QUIZ[q.id] || 'quiz', 20)}</span>
          <span style="flex:1">
            <span class="surtitre" style="color:var(--q-accent-texte);display:block">${q.categorie}</span>
            <span style="display:block;font-size:var(--txt-base);font-weight:var(--graisse-demi);
              color:var(--q-texte);margin-top:2px;line-height:1.25">${q.titre}</span>
          </span>
          ${fait}
        </div>
        <p style="margin-top:var(--pas-3);font-size:var(--txt-sm);line-height:1.5;color:var(--q-doux)">${q.accroche}</p>
        <div class="rangee" style="margin-top:var(--pas-3);gap:var(--pas-2)">
          <span class="mono" style="font-size:var(--txt-xs);color:var(--q-doux)">${q.questions.length} questions</span>
          <span class="mono" style="font-size:var(--txt-xs);color:var(--q-doux)">· ${q.meta.duree}</span>
          <span class="bouton bouton--quiz bouton--compact rangee-fin">Commencer ${ico('chevron', 14)}</span>
        </div>
      </div>
    </a>`;
}

/* =========================================================================
   Une partie
   ========================================================================= */

/** État de la partie en cours. Remis à zéro à chaque entrée dans la vue. */
let partie = null;

export async function rendrePartie(section, idQuiz) {
  const quiz = (await charger()).find((q) => q.id === idQuiz);
  if (!quiz) { window.location.hash = '#/quiz'; return; }

  partie = {
    quiz,
    index: 0,
    score: 0,
    choix: new Set(),
    validee: false,
    reponses: [],
  };

  section.className = 'vue-quiz quiz';
  section.dataset.quiz = quiz.id;
  afficherQuestion(section);

  // Raccourcis clavier : 1-9 pour choisir, Entrée pour valider (§3.2, PC).
  // Un seul écouteur pour toute la partie, retiré à la sortie de la vue.
  document.addEventListener('keydown', auClavier);
}

function auClavier(evenement) {
  // L'écouteur se retire de lui-même dès qu'on quitte une partie.
  if (!partie || !document.getElementById('quiz-options')) {
    document.removeEventListener('keydown', auClavier);
    return;
  }
  // On ne détourne pas les touches quand l'utilisateur écrit quelque part.
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;

  const item = partie.quiz.questions[partie.index];
  if (evenement.key >= '1' && evenement.key <= '9') {
    const n = Number(evenement.key) - 1;
    if (n < item.options.length && !partie.validee) {
      evenement.preventDefault();
      choisir(n);
    }
  } else if (evenement.key === 'Enter') {
    evenement.preventDefault();
    const bouton = document.getElementById('quiz-action');
    if (bouton && !bouton.disabled) bouton.click();
  }
}

function afficherQuestion(section) {
  const { quiz, index } = partie;
  const item = quiz.questions[index];
  const total = quiz.questions.length;
  const multi = item.multi === true;

  section.innerHTML = `
    <div class="entete-detail">
      <a class="bouton-icone" href="#/" aria-label="Quitter le quiz">${ico('retour', 22)}</a>
      <span class="titre">${quiz.categorie}</span>
    </div>
    <div class="section pile">
      <div class="pile-serree">
        <div class="rangee">
          <span class="quiz__compteur">Question <strong>${index + 1}</strong> / ${total}</span>
          <span class="quiz__categorie rangee-fin">${item.cat}</span>
        </div>
        <div class="quiz__progression" role="progressbar" aria-valuemin="1"
             aria-valuemax="${total}" aria-valuenow="${index + 1}"
             aria-label="Progression dans le quiz">
          <div style="width:${((index + 1) / total) * 100}%"></div>
        </div>
      </div>

      <h1 class="quiz__question" id="quiz-question">${item.q}</h1>

      <div class="options" id="quiz-options"
           role="${multi ? 'group' : 'radiogroup'}" aria-labelledby="quiz-question">
        ${item.options.map((texte, i) => optionHTML(texte, i, multi)).join('')}
      </div>

      <p style="font-size:var(--txt-sm);color:var(--q-doux);text-align:center" id="quiz-consigne">
        ${multi ? 'Plusieurs réponses sont attendues' : 'Une seule réponse attendue'}
      </p>

      <div id="quiz-correction" aria-live="polite"></div>

      <button type="button" class="bouton bouton--quiz bouton--large" id="quiz-action" disabled>
        Valider ${multi ? 'mes réponses' : 'ma réponse'}
      </button>
    </div>`;

  section.querySelectorAll('.option').forEach((bouton) => {
    bouton.addEventListener('click', () => choisir(Number(bouton.dataset.index)));
  });
  document.getElementById('quiz-action').addEventListener('click', () => valider(section));
}

function optionHTML(texte, i, multi) {
  return `
    <button type="button" class="option" data-index="${i}" data-multi="${multi}"
            role="${multi ? 'checkbox' : 'radio'}" aria-checked="false">
      <span class="option__marque" aria-hidden="true"></span>
      <span class="option__texte">
        <span class="option__libelle">${texte}</span>
        <span class="option__verdict" hidden></span>
      </span>
    </button>`;
}

function choisir(i) {
  if (partie.validee) return;
  const item = partie.quiz.questions[partie.index];
  const multi = item.multi === true;

  if (multi) {
    if (partie.choix.has(i)) partie.choix.delete(i);
    else partie.choix.add(i);
  } else {
    partie.choix = new Set([i]);
  }

  document.querySelectorAll('.option').forEach((bouton) => {
    const actif = partie.choix.has(Number(bouton.dataset.index));
    bouton.setAttribute('aria-checked', String(actif));
    bouton.querySelector('.option__marque').innerHTML = actif ? ico('coche', 13) : '';
  });

  document.getElementById('quiz-action').disabled = partie.choix.size === 0;
}

function valider(section) {
  if (!partie.validee) {
    corriger(section);
  } else {
    suivant(section);
  }
}

function corriger(section) {
  const item = partie.quiz.questions[partie.index];
  const attendues = new Set(item.correct);
  const donnees = partie.choix;

  // Réponses multiples : l'ensemble doit être exactement celui attendu.
  // Ni oubli, ni réponse en trop.
  const juste = attendues.size === donnees.size
    && [...attendues].every((i) => donnees.has(i));

  if (juste) partie.score += 1;
  partie.validee = true;
  partie.reponses.push({ question: item.q, juste });

  document.querySelectorAll('.option').forEach((bouton) => {
    const i = Number(bouton.dataset.index);
    const verdict = bouton.querySelector('.option__verdict');
    bouton.disabled = true;

    if (attendues.has(i)) {
      bouton.dataset.etat = 'juste';
      verdict.hidden = false;
      verdict.innerHTML = `${ico('coche', 14)} Bonne réponse`;
    } else if (donnees.has(i)) {
      bouton.dataset.etat = 'fausse';
      verdict.hidden = false;
      verdict.innerHTML = `${ico('croix', 14)} Réponse écartée`;
    }
  });

  // La correction rédigée est du contenu validé : son HTML de mise en valeur
  // (<strong>, <em>) est conservé tel quel.
  document.getElementById('quiz-correction').innerHTML = `
    <div class="correction">
      <p style="font-weight:var(--graisse-demi);color:${juste ? 'var(--quiz-juste)' : 'var(--quiz-faux)'};
        display:flex;align-items:center;gap:6px;margin-bottom:var(--pas-2)">
        ${ico(juste ? 'coche' : 'croix', 16)} ${juste ? 'Bonne réponse' : 'Réponse incomplète'}
      </p>
      ${item.feedback}
    </div>`;

  document.getElementById('quiz-consigne').hidden = true;

  const dernier = partie.index === partie.quiz.questions.length - 1;
  const action = document.getElementById('quiz-action');
  action.innerHTML = dernier ? 'Voir mon résultat' : `Question suivante ${ico('chevron', 16)}`;
  action.disabled = false;
  action.focus();

  annoncer(juste ? 'Bonne réponse.' : 'Réponse incomplète. La correction est affichée.');
}

function suivant(section) {
  if (partie.index === partie.quiz.questions.length - 1) {
    afficherResultat(section);
    return;
  }
  partie.index += 1;
  partie.choix = new Set();
  partie.validee = false;
  afficherQuestion(section);
  document.getElementById('quiz-question').scrollIntoView({ block: 'start' });
}

/* =========================================================================
   Résultat
   ========================================================================= */

function afficherResultat(section) {
  const { quiz, score, reponses } = partie;
  const total = quiz.questions.length;
  const pourcentage = (score / total) * 100;

  // Les verdicts sont triés par seuil décroissant : le premier atteint gagne.
  const verdict = quiz.verdicts.find((v) => pourcentage >= v.seuil) || quiz.verdicts[quiz.verdicts.length - 1];

  enregistrerResultatQuiz(quiz.id, score, total);
  document.removeEventListener('keydown', auClavier);

  section.innerHTML = `
    <div class="entete-detail">
      <a class="bouton-icone" href="#/" aria-label="Retour aux quiz">${ico('retour', 22)}</a>
      <span class="titre">${quiz.categorie}</span>
    </div>
    <div class="section pile">
      <div style="text-align:center">
        <p class="surtitre" style="color:var(--q-doux)">Résultat final</p>
        <p class="score" style="margin-top:var(--pas-2)">
          <span class="score__grand">${score}</span><span class="score__total">/${total}</span>
        </p>
      </div>

      <div class="correction">
        <h1 style="font-size:var(--txt-md);color:var(--q-accent-texte)">${verdict.titre}</h1>
        <p style="margin-top:var(--pas-2)">${verdict.texte}</p>
      </div>

      <section aria-labelledby="titre-detail-quiz">
        <p class="surtitre" id="titre-detail-quiz" style="color:var(--q-doux)">Le détail</p>
        <ul class="pile-serree" style="margin-top:var(--pas-2)">
          ${reponses.map((r) => `
            <li style="display:flex;gap:var(--pas-2);align-items:flex-start;padding:var(--pas-3);
              border:1px solid rgba(255,255,255,.10);border-radius:var(--rayon-sm);
              background:rgba(255,255,255,.03)">
              <span style="color:${r.juste ? 'var(--quiz-juste)' : 'var(--quiz-faux)'};margin-top:2px"
                aria-hidden="true">${ico(r.juste ? 'coche' : 'croix', 15)}</span>
              <span style="flex:1;font-size:var(--txt-sm);line-height:1.45;color:var(--q-doux)">
                <span class="lecteur-seul">${r.juste ? 'Réussie : ' : 'Manquée : '}</span>${r.question}
              </span>
            </li>`).join('')}
        </ul>
      </section>

      <div class="pile-serree">
        <button type="button" class="bouton bouton--quiz bouton--large" id="quiz-rejouer">Refaire ce quiz</button>
        <a class="bouton bouton--quiz-secondaire bouton--large" href="../postes/">Voir les postes de la DCIP</a>
        <a class="bouton bouton--quiz-secondaire bouton--large" href="#/">Choisir un autre quiz</a>
      </div>
    </div>`;

  document.getElementById('quiz-rejouer').addEventListener('click', () => {
    rendrePartie(section, quiz.id);
  });

  annoncer(`Résultat : ${score} sur ${total}. ${verdict.titre}`);
}
