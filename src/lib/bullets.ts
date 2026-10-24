import type { BulletLevels, Marker } from '../types'

/**
 * Automatic bullets for the cue and note columns.
 *
 * The markers are real characters in the note text, not decoration: what you
 * see in the box is what gets saved, exported and printed. `bulletsToMarkdown`
 * turns them back into a plain "- " list on export.
 *
 * Each nesting level has its own marker, chosen in the settings or per note:
 * numbered main points with lettered sub-points, dots everywhere, and so on.
 * Wherever `levels` is null below, bullets are off.
 */

/** Every marker on offer, in the order the pickers show them. */
export const markerOptions: Marker[] = [
  'number',
  'lower',
  'upper',
  'dot',
  'circle',
  'square',
  'dash',
  'arrow',
]

/** The markers that put the same sign in front of every item. */
const signs: Record<Exclude<Marker, Counted>, string> = {
  dot: '•',
  circle: '◦',
  square: '▪',
  dash: '-',
  arrow: '→',
}

type Counted = 'number' | 'lower' | 'upper'

/** True of a marker that numbers its items rather than repeating a sign. */
export function isCounted(marker: Marker): marker is Counted {
  return marker === 'number' || marker === 'lower' || marker === 'upper'
}

/** 1 → a, 26 → z, 27 → aa: a list long enough to run out of letters goes on. */
function letters(n: number): string {
  let out = ''
  let rest = n
  while (rest > 0) {
    rest -= 1
    out = String.fromCharCode(97 + (rest % 26)) + out
    rest = Math.floor(rest / 26)
  }
  return out
}

/** The marker for the n-th item of a list, counting from 1. */
export function markerText(marker: Marker, n = 1): string {
  if (marker === 'number') return `${n}.`
  if (marker === 'lower') return `${letters(n)})`
  if (marker === 'upper') return `${letters(n).toUpperCase()}.`
  return signs[marker]
}

/** One nesting level of indentation. Two spaces is what Markdown expects. */
export const INDENT = '  '

/** How deep a list can go: the main points and five levels under them. */
export const LEVEL_COUNT = 6

export const MAX_LEVEL = LEVEL_COUNT - 1

/** What each level starts with, until someone chooses otherwise. */
export const defaultLevels: BulletLevels = [
  'dot',
  'circle',
  'square',
  'dash',
  'arrow',
  'dot',
]

/**
 * A style with a marker for every level. Styles saved when there were only
 * three levels keep their three and take the defaults below them.
 */
export function fullLevels(levels: readonly Marker[]): BulletLevels {
  return defaultLevels.map((fallback, level) => levels[level] ?? fallback)
}

// Every marker we recognise when reading a line back, whatever it was
// written with — a note may have been imported, or its style changed.
// Numbers stop at three digits so that a line opening on a year ("1815. La
// bataille…") is left alone rather than swallowed into a list. Letters stop
// at two and must all be the same case, so "Mr. Dupont" is not a list item.
const bulletLine =
  /^([ \t]*)(\d{1,3}[.)]|[a-z]{1,2}\)|[A-Z]{1,2}\.|[•◦▪\-*→]) (.*)$/

/** Which kind of marker a line was written with, as far as counting goes. */
function kindOf(marker: string): Counted | 'sign' {
  if (/^\d/.test(marker)) return 'number'
  if (/^[a-z]/.test(marker)) return 'lower'
  if (/^[A-Z]/.test(marker)) return 'upper'
  return 'sign'
}

type ParsedLine = { indent: string; level: number; marker: string; text: string }

export function parseBullet(line: string): ParsedLine | null {
  const match = bulletLine.exec(line)
  if (!match) return null
  const indent = match[1]
  return {
    indent,
    level: Math.min(Math.floor(indent.length / INDENT.length), MAX_LEVEL),
    marker: match[2],
    text: match[3],
  }
}

function prefixFor(levels: BulletLevels, level: number): string {
  const clamped = Math.min(Math.max(level, 0), MAX_LEVEL)
  return INDENT.repeat(clamped) + markerText(levels[clamped]) + ' '
}

/** A replacement value for the whole field, plus where the caret should land. */
export type Edit = { value: string; caret: number }

function lineAround(value: string, caret: number): { start: number; end: number } {
  const start = value.lastIndexOf('\n', caret - 1) + 1
  const next = value.indexOf('\n', caret)
  return { start, end: next === -1 ? value.length : next }
}

/** True when some level counts its items, so the numbers need keeping up. */
export function counts(levels: BulletLevels | null): boolean {
  return levels !== null && levels.some(isCounted)
}

/**
 * Rewrites every marker in a field, line by line, and says where the caret
 * moved to.
 *
 * `pick` gets each list line and returns the marker it should have, or null
 * to leave it as it is. Lines are rebuilt from the start, so a marker that
 * grows ("9." to "10.") pushes the caret along with it.
 */
function rewriteMarkers(
  value: string,
  caret: number,
  pick: (parsed: ParsedLine) => string | null,
): Edit {
  let start = 0 // where the current line begins in the original value
  let shift = 0 // characters gained or lost above the caret so far
  // Set only when the caret was sitting inside a marker being rewritten.
  let landing: number | null = null

  const lines = value.split('\n').map((line) => {
    const parsed = parseBullet(line)
    const marker = parsed ? pick(parsed) : null
    const rewritten =
      parsed && marker !== null ? `${parsed.indent}${marker} ${parsed.text}` : line

    if (parsed && rewritten !== line) {
      // The marker runs from the start of the line to the start of the text.
      const markerEnd = start + line.length - parsed.text.length
      if (caret >= markerEnd) {
        shift += rewritten.length - line.length
      } else if (caret >= start && landing === null) {
        // Inside the marker itself: put the caret just after the new one.
        landing = start + shift + (rewritten.length - parsed.text.length)
      }
    }

    start += line.length + 1
    return rewritten
  })

  const result = lines.join('\n')
  const next = landing ?? caret + shift
  return { value: result, caret: Math.min(Math.max(next, 0), result.length) }
}

/**
 * Puts the counted levels back in order: 1, 2, 3 — or a, b, c.
 *
 * The numbers are real text, so inserting or deleting a line anywhere leaves
 * everything below it wrong. Rather than patch the lines around each edit,
 * the whole field is renumbered after every change — it is a handful of lines
 * and it cannot drift out of step.
 *
 * The main points count over the whole section and nothing resets them: a
 * blank line or a title in the middle is a pause in the list, not the end of
 * it. A sub-level starts again from the beginning under each new point above
 * it, the way a), b) start again under every number.
 *
 * Only lines already written in the counted kind are touched, so a dash in a
 * lettered level, or a line that only looks like a list, is left alone.
 */
export function renumber(
  value: string,
  caret: number,
  levels: BulletLevels | null,
): Edit {
  if (!levels || !counts(levels)) return { value, caret }

  const counters = new Array<number>(LEVEL_COUNT).fill(0)
  return rewriteMarkers(value, caret, (parsed) => {
    // A point at this level opens a new run for every level below it.
    for (let deeper = parsed.level + 1; deeper <= MAX_LEVEL; deeper += 1) {
      counters[deeper] = 0
    }
    const wanted = levels[parsed.level]
    if (!isCounted(wanted) || kindOf(parsed.marker) !== wanted) return null
    counters[parsed.level] += 1
    return markerText(wanted, counters[parsed.level])
  })
}

/**
 * Gives every list line in a field the marker its level now calls for.
 *
 * Used when a note changes style, so the bullets already written match the
 * new ones instead of leaving the note half in one style and half in another.
 */
export function restyle(value: string, levels: BulletLevels): string {
  const marked = rewriteMarkers(value, 0, (parsed) =>
    markerText(levels[parsed.level]),
  )
  return renumber(marked.value, 0, levels).value
}

/**
 * Enter was pressed. Returns null to let the browser insert a plain newline.
 *
 * Finishing a line turns it into the first item of a list, so the bullet
 * appears in front of the line you just wrote as well as the new one. Enter on
 * an empty bullet steps back out of the list instead of adding another one.
 */
export function onEnter(
  value: string,
  start: number,
  end: number,
  levels: BulletLevels | null,
): Edit | null {
  if (!levels) return null
  if (start !== end) return null // a selection: leave it to the browser

  const line = lineAround(value, start)
  const text = value.slice(line.start, line.end)
  const parsed = parseBullet(text)

  if (parsed) {
    if (parsed.text.trim() === '') {
      // An empty bullet means "I am done with this list".
      if (parsed.level > 0) {
        const prefix = prefixFor(levels, parsed.level - 1)
        return {
          value: value.slice(0, line.start) + prefix + value.slice(line.end),
          caret: line.start + prefix.length,
        }
      }
      return {
        value: value.slice(0, line.start) + value.slice(line.end),
        caret: line.start,
      }
    }

    // The new item takes its level's marker; a counted one gets its real
    // number once `renumber` has run over the field.
    const prefix = '\n' + parsed.indent + markerText(levels[parsed.level]) + ' '
    return {
      value: value.slice(0, start) + prefix + value.slice(start),
      caret: start + prefix.length,
    }
  }

  // Blank line, nothing to turn into a list item.
  if (text.trim() === '') return null

  const prefix = prefixFor(levels, 0)
  const marked = value.slice(0, line.start) + prefix + value.slice(line.start)
  const caret = start + prefix.length
  return {
    value: marked.slice(0, caret) + '\n' + prefix + marked.slice(caret),
    caret: caret + 1 + prefix.length,
  }
}

/** Alt+Right / Alt+Left move the current bullet in or out one level. */
export function onIndent(
  value: string,
  start: number,
  end: number,
  levels: BulletLevels | null,
  direction: 1 | -1,
): Edit | null {
  if (!levels) return null
  if (start !== end) return null

  const line = lineAround(value, start)
  const text = value.slice(line.start, line.end)
  const parsed = parseBullet(text)
  if (!parsed) return null

  const level = Math.min(Math.max(parsed.level + direction, 0), MAX_LEVEL)
  if (level === parsed.level) return null

  const replacement = prefixFor(levels, level) + parsed.text
  return {
    value: value.slice(0, line.start) + replacement + value.slice(line.end),
    caret: Math.max(line.start, start + replacement.length - text.length),
  }
}

/** Turns the on-screen bullets into a plain Markdown list on export. */
export function bulletsToMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const parsed = parseBullet(line)
      if (!parsed) return line
      // Markdown has numbered lists too, so a numbered item stays numbered.
      // It has no lettered ones: those become plain bullets.
      const marker = kindOf(parsed.marker) === 'number' ? parsed.marker : '-'
      return INDENT.repeat(parsed.level) + marker + ' ' + parsed.text
    })
    .join('\n')
}
