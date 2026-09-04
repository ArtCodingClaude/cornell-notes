import type { Language } from '../types'

/**
 * Autocorrection for the note fields.
 *
 * A word is put through four steps, in this order, and the first one to
 * answer wins.
 *
 * 1. A **fixed table** per language, for what no dictionary can work out:
 *    false friends (`example` → `exemple` in French), words run together
 *    (`parceque`), and the abbreviations worth expanding while taking notes
 *    in class (`bcp` → `beaucoup`).
 *
 * 2. **Is it a word?** Looked up in the language's whole dictionary, not just
 *    the common words, because `chlorophylle` is rare and correct. If it is
 *    in there, nothing happens.
 *
 * 3. **Accents.** Try the plausible accentings of what was typed and see
 *    which one the dictionary knows: `eleve` → `élève`, `gamete` → `gamète`.
 *    If more than one is a word, we say nothing — `cote` could be `côte`,
 *    `coté` or `côté`, and only the sentence knows.
 *
 * 4. **Nearest common word**, one or two edits away, transpositions counted
 *    as one: `wwerhe` → `where`, `probelme` → `problème`. Only common words
 *    are ever suggested, because that is what a typo is a typo of.
 *
 * What keeps this from wrecking a note is step 2 — measured, not assumed: on
 * 109 correctly spelled school terms (photosynthèse, hypoténuse, tectonique)
 * it changes none. With only the common-word list it wrecked ten of them.
 *
 * Also deliberate: names and acronyms are left alone, a word next to an
 * apostrophe or a hyphen is not spell checked on its own (`week-end` must not
 * become `week-en`), and `alsoFine` below holds the borrowed words the
 * dictionaries have not caught up with.
 */

const frFixes: Record<string, string> = {
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

const enFixes: Record<string, string> = {
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

const nlFixes: Record<string, string> = {
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

const fixes: Record<Language, Record<string, string>> = {
  en: enFixes,
  fr: frFixes,
  nl: nlFixes,
}

// ---------------------------------------------------------------------------
// The word lists
// ---------------------------------------------------------------------------

const wordFiles: Record<Language, () => Promise<{ words: string }>> = {
  en: () => import('./words/en'),
  fr: () => import('./words/fr'),
  nl: () => import('./words/nl'),
}

const allWordFiles: Record<Language, () => Promise<{ all: string }>> = {
  en: () => import('./words/en-all'),
  fr: () => import('./words/fr-all'),
  nl: () => import('./words/nl-all'),
}

/**
 * Words a dictionary has not caught up with, and must not "correct".
 *
 * Borrowed words are the dangerous ones: `email` is one letter from `mail`
 * and `login` one from `loin`, so without this they get quietly swapped in a
 * note about computers. Add to this freely — a word here is simply left
 * alone, which is the safe direction.
 */
const alsoFine: Record<Language, string> = {
  fr: `email emails mail mails login logout logiciel software hardware meeting
    weekend smartphone smartphones laptop wifi bluetooth podcast podcasts
    streaming selfie selfies influenceur influenceuse influenceurs youtubeur
    youtubeuse business marketing feedback download upload password blog
    blogueur blogueuse startup startups covid pdf url html css javascript
    python google internet online offline replay live buzz cloud data
    hashtag playlist scanner scooter gsm sms app apps mobile web site sites
    smartwatch bug bugs debug script scripts pixel pixels serveur router
    tweet tweets story stories reel reels stream streamer gamer gaming
    allèle allèles homozygote homozygotes eucaryote eucaryotes procaryote
    procaryotes lysosome lysosomes chloroplaste chloroplastes xylème phloème
    covalent covalente covalents covalentes électronégativité stœchiométrie
    molarité alcane alcanes amine amines homothétie homothéties newton
    newtons électrostatique électrostatiques oxymore oxymores périurbain
    périurbaine`,
  en: `email emails login logout smartphone smartphones laptop wifi bluetooth
    podcast podcasts streaming selfie selfies influencer blog blogger
    startup startups covid pdf url html css javascript python google
    internet online offline replay hashtag playlist app apps website
    websites debug pixel pixels server router tweet tweets stream streamer
    gamer gaming dataset datasets workflow workflows`,
  nl: `email emails login logout smartphone smartphones laptop wifi bluetooth
    podcast podcasts streaming selfie selfies influencer blog blogger
    startup covid pdf url html css javascript python google internet online
    offline replay hashtag playlist app apps website websites debuggen
    pixel pixels server router tweet tweets streamer gamer gaming
    orgaanstelsel orgaanstelsels chlorofyl chloroplast chloroplasten
    celmembraan celkernen voedselweb allel allelen fenotype voedingsstof
    voedingsstoffen spijsverteringsstelsel ademhalingsstelsel uitscheiding
    broeikasgas broeikasgassen longblaasje longblaasjes longslagader
    geslachtscel geslachtscellen chromosoomparen ongewervelden plantenrijk
    dierenrijk schimmelrijk fylogenie klimaatzone klimaatzones
    bevolkingsdichtheid verstedelijking sedimentatie estuaria troposfeer
    hoogtelijn hoogtelijnen aardmantel plaattektoniek magmakamer
    vulkaankrater kratermeer waterkringloop koolstofkringloop
    stikstofkringloop wereldkaart aardplaat aardplaten zeespiegelstijging
    fotosynthese celademhaling enzym enzymen koolhydraten vetzuren
    hormoonklier hormoonklieren zenuwstelsel ruggenmerg bloedsomloop
    hartkamer hartkamers slagader slagaders haarvaten alvleesklier
    chromosoom chromosomen genotype ecosysteem ecosystemen voedselketen
    voedselketens biodiversiteit symbiose celdeling stofwisseling
    immuunsysteem antilichaam antilichamen bacterie bacteriën wervelkolom
    wervelkolommen continent continenten oceaan oceanen gebergte gebergten
    aardbeving aardbevingen rivierdelta rivierdeltas stroomgebied
    stroomgebieden moesson moessons erosie verwering tektonische
    breuklijn breuklijnen evenaar poolcirkel poolcirkels breedtegraad
    breedtegraden lengtegraad lengtegraden migratiestroom migratiestromen
    klimaatverandering natuurramp natuurrampen overstroming overstromingen
    droogte`,
}

/**
 * Candidate words of one length, laid out side by side.
 *
 * Three parallel arrays rather than an array of objects: the inner loop of
 * the spell check walks thousands of these per keystroke, and reading a
 * number out of a typed array beats chasing a pointer to an object.
 */
type Bucket = {
  words: string[]
  /**
   * The same words with the accents taken off, which is what the distance is
   * measured against. In French a missing accent is a slip of the keyboard
   * rather than a spelling mistake, and counting it as an edit uses up the
   * budget that should be left for the actual typo: `mathematiqe` is three
   * edits from `mathématique` but only one from `mathematique`.
   */
  plain: string[]
  masks: Int32Array
  ranks: Int32Array
}

type Vocabulary = {
  /** The words worth suggesting, mapped to how common they are. 0 is first. */
  rank: Map<string, number>
  /** The same words, grouped by length, for the spell check to walk. */
  buckets: Map<number, Bucket>
  /** True of any word in the dictionary, however rare. */
  known: (word: string) => boolean
}

const vocabularies = new Map<Language, Vocabulary>()
const pending = new Map<Language, Promise<void>>()

/**
 * Letters as bits, one per letter of the alphabet, accents folded away.
 *
 * Two words within a couple of edits of each other cannot use wildly
 * different letters, so comparing these two numbers throws out the vast
 * majority of candidates before the real distance is ever computed.
 */
const accented = 'àâäáãåçćèéêëìíîïñòóôöõøùúûüýÿœæß'
const plain = 'aaaaaacceeeeiiiinooooooouuuuyyoas'
const letterBit = new Map<string, number>()
for (let code = 97; code <= 122; code += 1) {
  letterBit.set(String.fromCharCode(code), 1 << (code - 97))
}
for (let i = 0; i < accented.length; i += 1) {
  letterBit.set(accented[i], letterBit.get(plain[i]) ?? 0)
}

function maskOf(word: string): number {
  let mask = 0
  for (let i = 0; i < word.length; i += 1) {
    mask |= letterBit.get(word[i]) ?? 0
  }
  return mask
}

const plainLetter = new Map<string, string>()
for (let i = 0; i < accented.length; i += 1) plainLetter.set(accented[i], plain[i])

/** `élève` becomes `eleve`. One letter in, one letter out. */
function strip(word: string): string {
  let out = ''
  for (let i = 0; i < word.length; i += 1) {
    out += plainLetter.get(word[i]) ?? word[i]
  }
  return out
}

function bitCount(value: number): number {
  let v = value - ((value >> 1) & 0x55555555)
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333)
  return (((v + (v >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24
}

/**
 * Unpack the front-coded dictionary into one long sorted string.
 *
 * One string of three and a half megabytes rather than three hundred
 * thousand little ones: a `Set` of every French word costs about 39 MB of
 * memory, which is not a thing to ask of a phone, and this costs about 7.
 * Each word is fenced by newlines so that a search can tell `glucid` from
 * `glucide`.
 */
function decodeAll(coded: string): (word: string) => boolean {
  const pieces = coded.split(' ')
  let previous = ''
  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i]
    previous = previous.slice(0, piece.charCodeAt(0) - 48) + piece.slice(1)
    pieces[i] = previous
  }
  const data = `\n${pieces.join('\n')}\n`
  // `pieces` goes out of scope here, leaving only the one big string.

  return (word: string) => {
    const target = `\n${word}\n`
    let low = 0
    let high = data.length - 1
    while (low <= high) {
      const middle = (low + high) >> 1
      // Land on a word boundary, whatever the halving picked.
      const start = data.lastIndexOf('\n', middle)
      const end = data.indexOf('\n', start + 1)
      const record = data.slice(start, end + 1)
      if (record === target) return true
      if (record < target) low = end + 1
      else high = start - 1
    }
    return false
  }
}

/**
 * Where the words from the fixed table sit in the frequency order.
 *
 * They are school words — `mathématique`, `théorème` — and a frequency list
 * built from film subtitles has barely heard of them, which left `mathematiqe`
 * with nothing to be corrected to. Slotting them in the middle makes them
 * reachable by a typo without letting them win a coin toss against a word
 * people really do say every day.
 */
const TABLE_RANK = 6000

function index(
  text: string,
  extras: string[] = [],
): Omit<Vocabulary, 'known'> {
  const list = text.split(' ')
  const rank = new Map<string, number>()
  const grouped = new Map<number, string[]>()

  const add = (word: string, position: number) => {
    const already = rank.get(word)
    if (already !== undefined) {
      // A word listed twice, or promoted below, keeps its best rank.
      if (position < already) rank.set(word, position)
      return
    }
    rank.set(word, position)
    const group = grouped.get(word.length)
    if (group) group.push(word)
    else grouped.set(word.length, [word])
  }

  list.forEach(add)
  for (const extra of extras) {
    // The table also holds expansions like "parce que", which are not words.
    if (!extra.includes(' ')) add(extra.toLowerCase(), TABLE_RANK)
  }

  const buckets = new Map<number, Bucket>()
  for (const [length, words] of grouped) {
    const masks = new Int32Array(words.length)
    const ranks = new Int32Array(words.length)
    const plainForms = new Array<string>(words.length)
    for (let i = 0; i < words.length; i += 1) {
      masks[i] = maskOf(words[i])
      ranks[i] = rank.get(words[i]) ?? 0
      plainForms[i] = strip(words[i])
    }
    buckets.set(length, { words, plain: plainForms, masks, ranks })
  }

  return { rank, buckets }
}

/**
 * Fetch and index the word list for one language.
 *
 * Safe to call as often as you like: the work happens once. Until it
 * resolves, only the fixed table above is in play — which is why the app
 * never waits on this.
 */
export function loadVocabulary(language: Language): Promise<void> {
  if (vocabularies.has(language)) return Promise.resolve()
  const already = pending.get(language)
  if (already) return already

  const load = Promise.all([wordFiles[language](), allWordFiles[language]()])
    .then(([common, everything]) => {
      const inDictionary = decodeAll(everything.all)
      const borrowed = new Set(alsoFine[language].split(/\s+/).filter(Boolean))
      vocabularies.set(language, {
        ...index(common.words, Object.values(fixes[language])),
        known: (word) => borrowed.has(word) || inDictionary(word),
      })
    })
    .catch(() => {
      // Offline on the very first visit, or the chunk failed to load. The
      // fixed table still works, so there is nothing to report.
    })
    .finally(() => {
      pending.delete(language)
    })

  pending.set(language, load)
  return load
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/** Room for the longest word in the lists, plus the guard column. */
const SCRATCH = 32
const rows = [
  new Int32Array(SCRATCH),
  new Int32Array(SCRATCH),
  new Int32Array(SCRATCH),
]

/**
 * Damerau-Levenshtein distance, giving up as soon as it passes `max`.
 *
 * Transpositions count as one edit rather than two, which matters: swapping
 * two letters is the commonest typo of all, and `hte` should be one step from
 * `the`, not two.
 */
function distanceWithin(a: string, b: string, max: number): number {
  const n = a.length
  const m = b.length
  if (Math.abs(n - m) > max) return max + 1
  if (n === 0) return m
  if (m === 0) return n

  let twoBack = rows[0]
  let previous = rows[1]
  let current = rows[2]

  for (let j = 0; j <= m; j += 1) previous[j] = j

  for (let i = 1; i <= n; i += 1) {
    current[0] = i
    let rowMin = i
    const ai = a[i - 1]
    for (let j = 1; j <= m; j += 1) {
      const cost = ai === b[j - 1] ? 0 : 1
      let value = previous[j - 1] + cost
      const deletion = previous[j] + 1
      if (deletion < value) value = deletion
      const insertion = current[j - 1] + 1
      if (insertion < value) value = insertion
      if (i > 1 && j > 1 && ai === b[j - 2] && a[i - 2] === b[j - 1]) {
        const swap = twoBack[j - 2] + 1
        if (swap < value) value = swap
      }
      current[j] = value
      if (value < rowMin) rowMin = value
    }
    // Every later row can only be worse, so there is no point going on.
    if (rowMin > max) return max + 1

    const spare = twoBack
    twoBack = previous
    previous = current
    current = spare
  }

  return previous[m]
}

// ---------------------------------------------------------------------------
// What to offer
// ---------------------------------------------------------------------------

/**
 * What counts as part of a word.
 *
 * Letters and accents only, no apostrophe: that way `l'eleve` offers `élève`
 * rather than looking up `l'eleve` and finding nothing.
 */
const wordChar = /[\p{L}\p{M}]/u

/**
 * What breaks a word off from the rest of a compound.
 *
 * An apostrophe means an elision — `aujourd’hui`, `qu’il` — and a hyphen a
 * compound — `week-end`, `peut-être`. Either way the letters on this side of
 * it are not a word on their own, and spell checking them is how `week-end`
 * turns into `week-en`.
 */
const joiner = /['’\-–]/

/** A word found in the text, with where it sits. */
export type Found = {
  word: string
  start: number
  end: number
  /**
   * True when an apostrophe follows immediately, which in French means this
   * is the front half of an elision — `aujourd’hui`, `qu’il`, `l’élève`. The
   * fragment before the apostrophe is not a word and must not be spell
   * checked, or `aujourd` gets "corrected".
   */
  clipped: boolean
  /**
   * True when nothing but a line start, a bullet or a full stop comes before
   * it, so a capital first letter is grammar rather than a name.
   */
  opens: boolean
}

/** A word with something better to put in its place. */
export type Correction = Found & {
  to: string
  /**
   * True when the replacement is safe to make on its own, as you finish the
   * word. False means it is only offered, and waits to be accepted.
   */
  sure: boolean
}

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

/**
 * How common a word has to be before we will put it in without being asked.
 *
 * Correcting a typo almost always lands on an everyday word. Requiring that
 * is what keeps a technical term the list has never heard of from being
 * quietly swapped for some obscure near-neighbour.
 */
const COMMON = 12000
const VERY_COMMON = 4000

/** The shortest word worth spell checking. Below this, a guess is a coin toss. */
const MIN_LENGTH = 3

/**
 * True when the word begins a sentence, so its capital says nothing.
 *
 * A capital in the middle of a sentence is usually a name, and no word list
 * knows anybody's name — those get almost nothing offered. At the start of a
 * line or after a full stop the capital is just grammar, and the word is
 * treated like any other. Bullet markers count as a start: `• Probelme` is a
 * sentence beginning, not a surname.
 */
function opensSentence(text: string, start: number): boolean {
  let i = start - 1
  while (i >= 0 && (text[i] === ' ' || text[i] === '\t')) i -= 1
  if (i < 0) return true
  return '\n.!?:•◦▪-–*'.includes(text[i])
}

/**
 * Which accents a letter can be typed without.
 *
 * Typing `eleve` for `élève` is not a spelling mistake so much as a keyboard
 * one, and it is by far the commonest thing to fix in French. Rather than
 * list the words, we put the accents back: try the plausible accentings of
 * what was typed and see which one the dictionary knows.
 */
const accentings: Record<string, string[]> = {
  a: ['à', 'â'],
  c: ['ç'],
  e: ['é', 'è', 'ê', 'ë'],
  i: ['î', 'ï'],
  o: ['ô'],
  u: ['ù', 'û', 'ü'],
  y: ['ÿ'],
}

/** Stop before a word with a dozen vowels turns into thousands of tries. */
const MAX_TRIES = 4096

/**
 * The accented spelling of a word typed without accents.
 *
 * Returns null unless exactly one accenting is a real word: `cote` could be
 * `côte`, `coté` or `côté`, and only the sentence knows which, so we say
 * nothing at all.
 */
function reaccent(
  word: string,
  known: (word: string) => boolean,
): string | null {
  let tries = 1
  for (const letter of word) {
    tries *= (accentings[letter]?.length ?? 0) + 1
    if (tries > MAX_TRIES) return null
  }
  // Nothing in the word can carry an accent, so there is nothing to try.
  if (tries === 1) return null

  let found: string | null = null
  let count = 0

  const walk = (position: number, built: string) => {
    if (count > 1) return
    if (position === word.length) {
      if (built !== word && known(built)) {
        found = built
        count += 1
      }
      return
    }
    const letter = word[position]
    walk(position + 1, built + letter)
    for (const accented of accentings[letter] ?? []) {
      walk(position + 1, built + accented)
    }
  }
  walk(0, '')

  return count === 1 ? found : null
}

/** Nearest known word, or null if the word is spelled fine — or hopeless. */
function nearest(
  word: string,
  vocabulary: Vocabulary,
): { to: string; distance: number; rank: number } | null {
  if (word.length < MIN_LENGTH || word.length >= SCRATCH) return null

  // One edit is plenty for a short word; two would start rewriting it.
  const max = word.length <= 5 ? 1 : 2
  const wanted = maskOf(word)
  const bare = strip(word)
  // An edit can add or drop at most one letter of the alphabet, and swap one
  // for another, so this is a loose bound on purpose: it must never rule out
  // a real match, only cheap-to-reject rubbish.
  const maskLimit = 2 * max + 2

  let best: { to: string; distance: number; rank: number } | null = null

  for (let length = word.length - max; length <= word.length + max; length += 1) {
    const bucket = vocabulary.buckets.get(length)
    if (!bucket) continue
    const { words, plain: bareWords, masks, ranks } = bucket
    for (let i = 0; i < words.length; i += 1) {
      if (bitCount(masks[i] ^ wanted) > maskLimit) continue
      const distance = distanceWithin(bare, bareWords[i], max)
      if (distance > max) continue
      if (
        !best ||
        distance < best.distance ||
        (distance === best.distance && ranks[i] < best.rank)
      ) {
        best = { to: words[i], distance, rank: ranks[i] }
      }
    }
  }

  return best
}

function correctionFor(found: Found | null, language: Language): Correction | null {
  if (!found || !found.word) return null
  const lower = found.word.toLowerCase()

  // 1. The fixed table wins: it knows things a word list cannot.
  const listed = fixes[language]?.[lower]
  if (listed) {
    return { ...found, to: matchCase(found.word, listed), sure: true }
  }

  // 2. Otherwise, spell check — unless this is half of a compound, or the
  // dictionary for this language has not arrived yet.
  if (found.clipped) return null
  const vocabulary = vocabularies.get(language)
  if (!vocabulary) return null

  // An acronym is never a typo, and no dictionary lists them: ADN must not
  // be offered AN. The fixed table above still applies, so SIECLE is still
  // put right.
  const shouted =
    found.word.length > 1 && found.word === found.word.toUpperCase()
  if (shouted) return null

  if (vocabulary.known(lower)) return null

  // 3. Accents first, and on their own: an accenting the dictionary knows is
  // what was meant, not a guess.
  const accented = reaccent(lower, vocabulary.known)
  if (accented) {
    return { ...found, to: matchCase(found.word, accented), sure: true }
  }

  const match = nearest(lower, vocabulary)
  if (!match) return null

  // Distance zero means the letters were all right and only the accents were
  // missing — `hypothese` for `hypothèse`. That is not a guess, so it is not
  // held to any of what follows.
  const accentsOnly = match.distance === 0

  // Otherwise it is only worth mentioning if it lands on a word people
  // actually use: two edits away from something obscure is not a correction,
  // it is a coincidence, which is what stops "Cornell" from being handed
  // "cornes".
  if (!accentsOnly && match.rank >= (match.distance === 1 ? COMMON : VERY_COMMON)) {
    return null
  }

  // A capital could be a name, and no word list has ever heard of anybody.
  // So a capitalised word is only ever offered, never put in on its own:
  // "Cornell" must not quietly become "Corner".
  const capital = found.word[0] !== found.word[0].toLowerCase()
  // Mid-sentence a capital is even more likely to be a name, so there it
  // takes a single letter out of place to be worth mentioning at all.
  if (capital && !accentsOnly && !found.opens && match.distance > 1) return null

  const sure =
    accentsOnly ||
    (!capital &&
      (match.distance === 1
        ? // Three letters leave too little to go on unless the answer is one
          // of the commonest words in the language, like "hte" for "the".
          found.word.length >= 4 || match.rank < VERY_COMMON
        : found.word.length >= 6))

  return { ...found, to: matchCase(found.word, match.to), sure }
}

/** The word that ends exactly at the caret, if the caret sits after a letter. */
export function wordBefore(text: string, caret: number): Found | null {
  if (caret <= 0 || !wordChar.test(text[caret - 1] ?? '')) return null
  let start = caret
  while (start > 0 && wordChar.test(text[start - 1])) start -= 1
  return {
    word: text.slice(start, caret),
    start,
    end: caret,
    clipped:
      joiner.test(text[caret] ?? '') || joiner.test(text[start - 1] ?? ''),
    opens: opensSentence(text, start),
  }
}

/** The whole word the caret sits inside or next to. */
export function wordAround(text: string, caret: number): Found | null {
  let start = caret
  let end = caret
  while (start > 0 && wordChar.test(text[start - 1])) start -= 1
  while (end < text.length && wordChar.test(text[end])) end += 1
  if (start === end) return null
  return {
    word: text.slice(start, end),
    start,
    end,
    clipped: joiner.test(text[end] ?? '') || joiner.test(text[start - 1] ?? ''),
    opens: opensSentence(text, start),
  }
}

/** A correction for the word that has just been finished. */
export function correctionBefore(
  text: string,
  caret: number,
  language: Language,
): Correction | null {
  return correctionFor(wordBefore(text, caret), language)
}

/** A correction to show above the section while the word is being typed. */
export function correctionAround(
  text: string,
  caret: number,
  language: Language,
): Correction | null {
  return correctionFor(wordAround(text, caret), language)
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
 * way out rather than left alone until the next space. Tab is not: it moves
 * to the next section, and the editor handles it separately.
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
