import type { Language } from '../types'

/**
 * Autocorrection for the note fields.
 *
 * This is a fixed list of misspellings, not a spell checker: a word is only
 * ever replaced when it appears here, so nothing the app does not recognise
 * can be touched. The lists hold two kinds of entry — spellings that are not
 * words at all in that language (`eleve`, `recieve`, `mischien`) and a few
 * abbreviations worth expanding while taking notes in class (`bcp`).
 *
 * Deliberately absent: anything ambiguous. `a`/`à`, `ou`/`où`, `sur`/`sûr`
 * and `cote`/`côté` are all real words, and only the sentence says which one
 * was meant. Guessing there would corrupt correct notes.
 */

const fr: Record<string, string> = {
  // Missing accents — é
  eleve: 'élève',
  eleves: 'élèves',
  ecole: 'école',
  economie: 'économie',
  ecrire: 'écrire',
  ecrit: 'écrit',
  ecriture: 'écriture',
  education: 'éducation',
  egalement: 'également',
  egalite: 'égalité',
  eglise: 'église',
  electricite: 'électricité',
  electrique: 'électrique',
  electron: 'électron',
  electrons: 'électrons',
  element: 'élément',
  elements: 'éléments',
  energie: 'énergie',
  energies: 'énergies',
  enonce: 'énoncé',
  epoque: 'époque',
  equation: 'équation',
  equations: 'équations',
  equilibre: 'équilibre',
  equipe: 'équipe',
  equivalent: 'équivalent',
  etage: 'étage',
  etape: 'étape',
  etapes: 'étapes',
  etat: 'état',
  etats: 'états',
  ete: 'été',
  etait: 'était',
  etaient: 'étaient',
  etude: 'étude',
  etudes: 'études',
  etudier: 'étudier',
  etudie: 'étudie',
  etudient: 'étudient',
  etudiant: 'étudiant',
  etudiants: 'étudiants',
  etudiante: 'étudiante',
  etudiantes: 'étudiantes',
  energetique: 'énergétique',
  evaluation: 'évaluation',
  evenement: 'événement',
  evenements: 'événements',
  evidence: 'évidence',
  eviter: 'éviter',
  evolution: 'évolution',
  experience: 'expérience',
  experiences: 'expériences',
  general: 'général',
  generale: 'générale',
  generalement: 'généralement',
  generer: 'générer',
  geographie: 'géographie',
  geologie: 'géologie',
  geometrie: 'géométrie',
  hierarchie: 'hiérarchie',
  litterature: 'littérature',
  mathematique: 'mathématique',
  mathematiques: 'mathématiques',
  mecanique: 'mécanique',
  mecanisme: 'mécanisme',
  methode: 'méthode',
  molecule: 'molécule',
  molecules: 'molécules',
  necessaire: 'nécessaire',
  necessite: 'nécessité',
  numero: 'numéro',
  numerique: 'numérique',
  periode: 'période',
  periodes: 'périodes',
  president: 'président',
  reaction: 'réaction',
  reactions: 'réactions',
  realite: 'réalité',
  reduction: 'réduction',
  reference: 'référence',
  references: 'références',
  region: 'région',
  regions: 'régions',
  regime: 'régime',
  repondre: 'répondre',
  reponse: 'réponse',
  reponses: 'réponses',
  republique: 'république',
  reseau: 'réseau',
  reseaux: 'réseaux',
  resoudre: 'résoudre',
  resultat: 'résultat',
  resultats: 'résultats',
  resume: 'résumé',
  resumer: 'résumer',
  reussir: 'réussir',
  reviser: 'réviser',
  revision: 'révision',
  revisions: 'révisions',
  revolution: 'révolution',
  securite: 'sécurité',
  separer: 'séparer',
  sequence: 'séquence',
  societe: 'société',
  specifique: 'spécifique',
  synthese: 'synthèse',
  systematique: 'systématique',
  temperature: 'température',
  theorie: 'théorie',
  theorique: 'théorique',
  universite: 'université',
  verifier: 'vérifier',
  verite: 'vérité',
  democratie: 'démocratie',
  demonstration: 'démonstration',
  deduction: 'déduction',
  deduire: 'déduire',
  definir: 'définir',
  definition: 'définition',
  definitions: 'définitions',
  demontrer: 'démontrer',
  determiner: 'déterminer',
  developper: 'développer',
  difference: 'différence',
  differences: 'différences',
  different: 'différent',
  differents: 'différents',
  differente: 'différente',
  differentes: 'différentes',
  difficulte: 'difficulté',
  difficultes: 'difficultés',
  categorie: 'catégorie',
  categories: 'catégories',
  caracteriser: 'caractériser',
  caracteristique: 'caractéristique',
  caracteristiques: 'caractéristiques',
  celebre: 'célèbre',
  considerer: 'considérer',
  consequence: 'conséquence',
  consequences: 'conséquences',
  creer: 'créer',
  degre: 'degré',
  degres: 'degrés',
  frequence: 'fréquence',
  gravite: 'gravité',
  humanite: 'humanité',
  identite: 'identité',
  liberte: 'liberté',
  majorite: 'majorité',
  minorite: 'minorité',
  operer: 'opérer',
  possibilite: 'possibilité',
  possibilites: 'possibilités',
  preciser: 'préciser',
  preparer: 'préparer',
  presence: 'présence',
  presenter: 'présenter',
  priorite: 'priorité',
  propriete: 'propriété',
  proprietes: 'propriétés',
  proteger: 'protéger',
  qualite: 'qualité',
  qualites: 'qualités',
  quantite: 'quantité',
  quantites: 'quantités',
  reperer: 'repérer',
  repeter: 'répéter',
  unite: 'unité',
  unites: 'unités',
  activite: 'activité',
  activites: 'activités',
  arithmetique: 'arithmétique',
  autorite: 'autorité',
  capacite: 'capacité',
  communaute: 'communauté',
  densite: 'densité',
  ecosysteme: 'écosystème',
  extremite: 'extrémité',
  interet: 'intérêt',
  interets: 'intérêts',

  // Missing accents — è and ê
  algebre: 'algèbre',
  apres: 'après',
  caractere: 'caractère',
  caracteres: 'caractères',
  centimetre: 'centimètre',
  colere: 'colère',
  critere: 'critère',
  criteres: 'critères',
  derniere: 'dernière',
  deuxieme: 'deuxième',
  diametre: 'diamètre',
  espece: 'espèce',
  especes: 'espèces',
  extreme: 'extrême',
  empecher: 'empêcher',
  etre: 'être',
  fenetre: 'fenêtre',
  foret: 'forêt',
  frontiere: 'frontière',
  hypothese: 'hypothèse',
  hypotheses: 'hypothèses',
  kilometre: 'kilomètre',
  lumiere: 'lumière',
  maitre: 'maître',
  maniere: 'manière',
  matiere: 'matière',
  matieres: 'matières',
  meme: 'même',
  memes: 'mêmes',
  metre: 'mètre',
  metres: 'mètres',
  misere: 'misère',
  modele: 'modèle',
  modeles: 'modèles',
  parametre: 'paramètre',
  parametres: 'paramètres',
  parenthese: 'parenthèse',
  parentheses: 'parenthèses',
  perimetre: 'périmètre',
  phenomene: 'phénomène',
  phenomenes: 'phénomènes',
  premiere: 'première',
  pres: 'près',
  probleme: 'problème',
  problemes: 'problèmes',
  quatrieme: 'quatrième',
  cinquieme: 'cinquième',
  regle: 'règle',
  regles: 'règles',
  siecle: 'siècle',
  siecles: 'siècles',
  systeme: 'système',
  systemes: 'systèmes',
  theatre: 'théâtre',
  theoreme: 'théorème',
  these: 'thèse',
  tres: 'très',
  troisieme: 'troisième',

  // Missing accents — à, â, ô
  age: 'âge',
  controle: 'contrôle',
  controler: 'contrôler',
  deja: 'déjà',
  grace: 'grâce',
  hopital: 'hôpital',
  impot: 'impôt',
  plutot: 'plutôt',
  bientot: 'bientôt',
  aussitot: 'aussitôt',
  role: 'rôle',
  voila: 'voilà',

  // Run-together and split words
  aujourdhui: 'aujourd’hui',
  biensur: 'bien sûr',
  ilya: 'il y a',
  parceque: 'parce que',
  peutetre: 'peut-être',
  quelquechose: 'quelque chose',
  malgres: 'malgré',
  toujour: 'toujours',
  beacoup: 'beaucoup',
  beaucoups: 'beaucoup',

  // Doubled or missing letters
  acord: 'accord',
  acorder: 'accorder',
  addresse: 'adresse',
  aparaitre: 'apparaître',
  apeler: 'appeler',
  coment: 'comment',
  developement: 'développement',
  developpement: 'développement',
  diference: 'différence',
  dificile: 'difficile',
  eficace: 'efficace',
  notament: 'notamment',
  occurence: 'occurrence',
  persone: 'personne',
  pouquoi: 'pourquoi',
  pourqoi: 'pourquoi',
  profeseur: 'professeur',
  recomander: 'recommander',

  // False friends borrowed from English
  example: 'exemple',
  exercise: 'exercice',
  language: 'langage',

  // Abbreviations worth expanding while taking notes
  auj: 'aujourd’hui',
  bcp: 'beaucoup',
  cad: 'c’est-à-dire',
  jms: 'jamais',
  ojd: 'aujourd’hui',
  pcq: 'parce que',
  pk: 'pourquoi',
  qd: 'quand',
  qqch: 'quelque chose',
  qqn: 'quelqu’un',
  rdv: 'rendez-vous',
  svp: 's’il vous plaît',
  tjrs: 'toujours',
}

const en: Record<string, string> = {
  accomodate: 'accommodate',
  acheive: 'achieve',
  adress: 'address',
  alot: 'a lot',
  arguement: 'argument',
  becuase: 'because',
  beleive: 'believe',
  begining: 'beginning',
  calender: 'calendar',
  cemetary: 'cemetery',
  changable: 'changeable',
  collegue: 'colleague',
  comming: 'coming',
  commited: 'committed',
  couldnt: 'couldn’t',
  definately: 'definitely',
  didnt: 'didn’t',
  doesnt: 'doesn’t',
  dont: 'don’t',
  embarass: 'embarrass',
  enviroment: 'environment',
  equipement: 'equipment',
  excercise: 'exercise',
  existance: 'existence',
  foriegn: 'foreign',
  freind: 'friend',
  goverment: 'government',
  grammer: 'grammar',
  happend: 'happened',
  immediatly: 'immediately',
  independant: 'independent',
  isnt: 'isn’t',
  ive: 'I’ve',
  knowlege: 'knowledge',
  liason: 'liaison',
  maintainance: 'maintenance',
  millenium: 'millennium',
  neccessary: 'necessary',
  noticable: 'noticeable',
  occassion: 'occasion',
  occured: 'occurred',
  occurence: 'occurrence',
  paralel: 'parallel',
  persistant: 'persistent',
  posession: 'possession',
  prefered: 'preferred',
  priviledge: 'privilege',
  publically: 'publicly',
  realy: 'really',
  recieve: 'receive',
  refered: 'referred',
  relevent: 'relevant',
  rythm: 'rhythm',
  seige: 'siege',
  seperate: 'separate',
  shouldnt: 'shouldn’t',
  similiar: 'similar',
  succesful: 'successful',
  supercede: 'supersede',
  suprise: 'surprise',
  teh: 'the',
  theyre: 'they’re',
  thier: 'their',
  threshhold: 'threshold',
  tommorow: 'tomorrow',
  tounge: 'tongue',
  truely: 'truly',
  unfortunatly: 'unfortunately',
  untill: 'until',
  wasnt: 'wasn’t',
  wether: 'whether',
  whcih: 'which',
  wich: 'which',
  wierd: 'weird',
  wiht: 'with',
  wouldnt: 'wouldn’t',
  writting: 'writing',
  yeild: 'yield',
  youre: 'you’re',
}

const nl: Record<string, string> = {
  altjid: 'altijd',
  aparaat: 'apparaat',
  belangijk: 'belangrijk',
  bijv: 'bijvoorbeeld',
  dwz: 'dat wil zeggen',
  econimie: 'economie',
  eigelijk: 'eigenlijk',
  gebeurdt: 'gebeurt',
  gemeenschapelijk: 'gemeenschappelijk',
  geschiednis: 'geschiedenis',
  hoofstuk: 'hoofdstuk',
  hoevaak: 'hoe vaak',
  idd: 'inderdaad',
  iig: 'in ieder geval',
  inplaats: 'in plaats',
  ivm: 'in verband met',
  makelijk: 'makkelijk',
  middeleewen: 'middeleeuwen',
  mischien: 'misschien',
  moelijk: 'moeilijk',
  namenlijk: 'namelijk',
  onmiddelijk: 'onmiddellijk',
  samevatting: 'samenvatting',
  sammenvatting: 'samenvatting',
  verschilende: 'verschillende',
  voorbeel: 'voorbeeld',
  waarschijnelijk: 'waarschijnlijk',
  watvoor: 'wat voor',
}

const dictionaries: Record<Language, Record<string, string>> = { en, fr, nl }

/**
 * What counts as part of a word.
 *
 * Letters and accents only, no apostrophe: that way `l'eleve` offers `élève`
 * rather than looking up `l'eleve` and finding nothing.
 */
const wordChar = /[\p{L}\p{M}]/u

/** A word found in the text, with where it sits. */
export type Found = { word: string; start: number; end: number }

/** A word we have a replacement for. */
export type Correction = Found & { to: string }

/** Give the replacement the capitals the typed word had. */
function matchCase(typed: string, replacement: string): string {
  const upper = typed.toUpperCase()
  const lower = typed.toLowerCase()
  // SIECLE -> SIÈCLE, but not for a single letter, where it is unknowable.
  if (typed === upper && typed !== lower && typed.length > 1) {
    return replacement.toUpperCase()
  }
  if (typed[0] === upper[0] && typed[0] !== lower[0]) {
    return replacement[0].toUpperCase() + replacement.slice(1)
  }
  return replacement
}

function lookup(word: string, language: Language): string | null {
  const replacement = dictionaries[language]?.[word.toLowerCase()]
  return replacement ? matchCase(word, replacement) : null
}

function toCorrection(
  found: Found | null,
  language: Language,
): Correction | null {
  if (!found || !found.word) return null
  const to = lookup(found.word, language)
  return to ? { ...found, to } : null
}

/** The word that ends exactly at the caret, if the caret sits after a letter. */
export function wordBefore(text: string, caret: number): Found | null {
  if (caret <= 0 || !wordChar.test(text[caret - 1] ?? '')) return null
  let start = caret
  while (start > 0 && wordChar.test(text[start - 1])) start -= 1
  return { word: text.slice(start, caret), start, end: caret }
}

/** The whole word the caret sits inside or next to. */
export function wordAround(text: string, caret: number): Found | null {
  let start = caret
  let end = caret
  while (start > 0 && wordChar.test(text[start - 1])) start -= 1
  while (end < text.length && wordChar.test(text[end])) end += 1
  if (start === end) return null
  return { word: text.slice(start, end), start, end }
}

/** A correction to apply now, the word having just been finished. */
export function correctionBefore(
  text: string,
  caret: number,
  language: Language,
): Correction | null {
  return toCorrection(wordBefore(text, caret), language)
}

/** A correction to show above the section while the word is being typed. */
export function correctionAround(
  text: string,
  caret: number,
  language: Language,
): Correction | null {
  return toCorrection(wordAround(text, caret), language)
}

/** Put the replacement in, and say where the caret lands. */
export function applyCorrection(
  text: string,
  correction: Correction,
): { value: string; caret: number } {
  return {
    value:
      text.slice(0, correction.start) + correction.to + text.slice(correction.end),
    caret: correction.start + correction.to.length,
  }
}

/**
 * Keys that finish a word.
 *
 * A closing bracket or quote is in here too, so `(eleve)` is corrected on the
 * way out rather than left alone until the next space. Tab is not: in this
 * app it moves to the next section rather than typing anything.
 */
export const commitKeys = new Set([
  ' ',
  'Enter',
  '.',
  ',',
  ';',
  ':',
  '!',
  '?',
  ')',
  ']',
  '}',
  '"',
  '»',
  '/',
])
