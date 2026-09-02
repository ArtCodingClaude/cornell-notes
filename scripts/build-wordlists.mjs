/**
 * Builds the word lists the autocorrection checks against.
 *
 *   node scripts/build-wordlists.mjs
 *
 * Two files come out per language, because the spell check asks two different
 * questions and one list cannot answer both.
 *
 * - `<language>.ts` — **what to suggest.** A frequency list (OpenSubtitles,
 *   via hermitdave/FrequencyWords) crossed with a real dictionary, most
 *   common first. The order is what decides between "were" and "where"; the
 *   crossing is what keeps the misspellings, names and foreign words that
 *   fill subtitle files out of the suggestions.
 *
 * - `<language>-all.ts` — **what counts as a word.** The whole dictionary,
 *   because the frequency list has never heard of `chlorophylle` and would
 *   have us "correct" it. Stored front-coded: the words are sorted, and each
 *   one keeps only the letters it does not share with the one before it. That
 *   turns 3.5 MB into 1.3 MB, and around 180 kB over the wire.
 *
 * Both are fetched only when a note is open, and only for the language in
 * use. The output is committed, so the app itself never needs the network.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'src', 'lib', 'words')

/** Upper bound only: in practice the crossing of the two sources decides. */
const KEEP = 50000

const sources = {
  fr: {
    frequency:
      'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fr/fr_50k.txt',
    dictionary:
      'https://raw.githubusercontent.com/words/an-array-of-french-words/master/index.json',
    parse: (text) => JSON.parse(text),
    credit: 'words/an-array-of-french-words (MIT)',
  },
  en: {
    frequency:
      'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt',
    // Not dwyl/english-words: that one is far larger and full of obscure
    // forms, which costs 300 kB over the wire and, worse, counts real typos
    // as words.
    dictionary:
      'https://raw.githubusercontent.com/words/an-array-of-english-words/master/index.json',
    parse: (text) => JSON.parse(text),
    credit: 'words/an-array-of-english-words (Unlicense)',
  },
  nl: {
    frequency:
      'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/nl/nl_50k.txt',
    dictionary:
      'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt',
    parse: (text) => text.split(/\r?\n/),
    credit: 'OpenTaal/opentaal-wordlist (BSD / CC BY 3.0)',
  },
}

/** Letters only, nothing capitalised, nothing too short or too long. */
function usable(word) {
  return (
    word.length >= 2 &&
    word.length <= 18 &&
    word === word.toLowerCase() &&
    /^\p{L}+$/u.test(word)
  )
}

/** Every way of dropping up to two letters from a word. */
function deletions(word) {
  const one = new Set([word])
  for (let i = 0; i < word.length; i += 1) {
    const shorter = word.slice(0, i) + word.slice(i + 1)
    one.add(shorter)
    for (let j = 0; j < shorter.length; j += 1) {
      one.add(shorter.slice(0, j) + shorter.slice(j + 1))
    }
  }
  return one
}

/**
 * The dictionary words the spell check could get wrong, and only those.
 *
 * Shipping every word in the language is the safe thing, but most of it is
 * dead weight: `chlorophylle` is protected by the fact that nothing
 * suggestible is anywhere near it. Two words are within two edits of each
 * other only if they share a spelling with up to two letters dropped, so
 * collecting those spellings for the suggestible words tells us exactly
 * which dictionary entries are in danger. For Dutch that is a third of the
 * list, and the rest need never be downloaded.
 *
 * This is why the two files are generated together: the short list decides
 * what the long one has to contain.
 */
function atRisk(valid, suggestible) {
  const reachable = new Set()
  for (const word of suggestible) {
    for (const variant of deletions(word)) reachable.add(variant)
  }

  const kept = []
  for (const word of valid) {
    for (const variant of deletions(word)) {
      if (reachable.has(variant)) {
        kept.push(word)
        break
      }
    }
  }
  return kept
}

async function get(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} on ${url}`)
  return response.text()
}

mkdirSync(outDir, { recursive: true })

for (const [language, source] of Object.entries(sources)) {
  const [frequencyText, dictionaryText] = await Promise.all([
    get(source.frequency),
    get(source.dictionary),
  ])

  const valid = new Set(
    source
      .parse(dictionaryText)
      .map((word) => word.trim().toLowerCase())
      .filter(usable),
  )

  const kept = []
  for (const line of frequencyText.split(/\r?\n/)) {
    const word = line.split(' ')[0]?.trim().toLowerCase()
    if (!word || !usable(word) || !valid.has(word)) continue
    kept.push(word)
    if (kept.length === KEEP) break
  }

  // Only the words that need defending, front-coded. Sorted with the plain
  // `<` order, which is what the app binary-searches with — must agree.
  const sorted = atRisk(valid, kept).sort()
  const coded = []
  let previous = ''
  for (const word of sorted) {
    let shared = 0
    while (
      shared < previous.length &&
      shared < word.length &&
      previous[shared] === word[shared] &&
      shared < 60
    ) {
      shared += 1
    }
    // The count rides in front as one character, so a space can separate the
    // records: no letter and no count can ever be a space.
    coded.push(String.fromCharCode(48 + shared) + word.slice(shared))
    previous = word
  }

  writeFileSync(
    join(outDir, `${language}-all.ts`),
    `/**
 * Every ${language} word, for telling a typo from a word nobody says out loud.
 *
 * Generated by scripts/build-wordlists.mjs — do not edit by hand. ${sorted.length}
 * words, sorted, each stored as the number of letters it shares with the one
 * before it followed by the letters that differ: "0abaissa 7i 7t" is
 * abaissa, abaissai, abaissait. \`decodeAll\` in autocorrect.ts unpacks it.
 *
 * Source: ${source.credit}.
 */
export const all =
  '${coded.join(' ')}'
`,
    'utf8',
  )

  const file = join(outDir, `${language}.ts`)
  writeFileSync(
    file,
    `/**
 * The ${kept.length} most common ${language} words, most common first.
 *
 * Generated by scripts/build-wordlists.mjs — do not edit by hand. The order
 * carries the frequency: index 0 is the most common word in the language,
 * which is what \`suggest\` uses to choose between two equally close matches.
 *
 * Sources: hermitdave/FrequencyWords (MIT) for the order,
 * ${source.credit} for the spelling.
 *
 * Loaded on demand — only the language in use is ever downloaded.
 */
export const words =
  '${kept.join(' ')}'
`,
    'utf8',
  )
  console.log(
    `${language}: ${kept.length} words, ${(kept.join(' ').length / 1024).toFixed(0)} kB`,
  )
}
