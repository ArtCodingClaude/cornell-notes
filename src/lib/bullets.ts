import type { BulletStyle } from '../types'

/**
 * Automatic bullets for the cue and note columns.
 *
 * The markers are real characters in the note text, not decoration: what you
 * see in the box is what gets saved, exported and printed. `bulletsToMarkdown`
 * turns them back into a plain "- " list on export.
 */

/**
 * Markers per nesting level. Level 0 is the outermost.
 *
 * The numbered style only counts its outermost level; what hangs under a
 * numbered point is detail, and reads better as plain bullets than as a
 * second row of numbers. The "1." here is a placeholder — `renumber` gives
 * every item its real number once the edit has been made.
 */
const markers: Record<Exclude<BulletStyle, 'off'>, string[]> = {
  dot: ['•', '◦', '▪'],
  dash: ['-', '-', '-'],
  number: ['1.', '•', '◦'],
}

/** One nesting level of indentation. Two spaces is what Markdown expects. */
export const INDENT = '  '

export const MAX_LEVEL = 2

// Every marker we recognise when reading a line back, whatever the style it
// was written in — a note may have been imported, or the setting changed.
// Numbers stop at three digits so that a line opening on a year ("1815. La
// bataille…") is left alone rather than swallowed into a list.
const bulletLine = /^([ \t]*)(\d{1,3}[.)]|[•◦▪\-*]) (.*)$/

/** True of "7." or "12)" — a marker that carries a number we may rewrite. */
function isNumbered(marker: string): boolean {
  return /^\d/.test(marker)
}

type ParsedLine = { indent: string; level: number; marker: string; text: string }

export function parseBullet(line: string): ParsedLine | null {
  const match = bulletLine.exec(line)
  if (!match) return null
  const indent = match[1]
  return {
    indent,
    level: Math.floor(indent.length / INDENT.length),
    marker: match[2],
    text: match[3],
  }
}

export function markerFor(style: BulletStyle, level: number): string {
  if (style === 'off') return ''
  const set = markers[style]
  return set[Math.min(Math.max(level, 0), set.length - 1)]
}

function prefixFor(style: BulletStyle, level: number): string {
  return INDENT.repeat(Math.max(level, 0)) + markerFor(style, level) + ' '
}

/** A replacement value for the whole field, plus where the caret should land. */
export type Edit = { value: string; caret: number }

function lineAround(value: string, caret: number): { start: number; end: number } {
  const start = value.lastIndexOf('\n', caret - 1) + 1
  const next = value.indexOf('\n', caret)
  return { start, end: next === -1 ? value.length : next }
}

/**
 * Puts a numbered list back in order: 1, 2, 3.
 *
 * The numbers are real text, so inserting or deleting a line anywhere leaves
 * everything below it wrong. Rather than patch the lines around each edit,
 * the whole field is renumbered after every change — it is a handful of lines
 * and it cannot drift out of step.
 *
 * The count runs over the whole section and nothing resets it: a blank line,
 * a title or a sub-level in the middle is a pause in the list, not the end of
 * it, so the next numbered line carries on from the last number rather than
 * dropping back to 1.
 *
 * Sub-levels are bullets in this style and are left exactly as they are.
 */
export function renumber(
  value: string,
  caret: number,
  style: BulletStyle,
): Edit {
  if (style !== 'number') return { value, caret }

  let counter = 0
  let start = 0 // where the current line begins in the original value
  let shift = 0 // characters gained or lost above the caret so far
  // Set only when the caret was sitting inside a marker being rewritten.
  let landing: number | null = null

  const lines = value.split('\n').map((line) => {
    const parsed = parseBullet(line)
    let rewritten = line

    if (!parsed) {
      // A line without a marker is skipped over, keeping the count.
    } else if (parsed.level === 0) {
      counter += 1
      rewritten = `${counter}. ${parsed.text}`
    }

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
  style: BulletStyle,
): Edit | null {
  if (style === 'off') return null
  if (start !== end) return null // a selection: leave it to the browser

  const line = lineAround(value, start)
  const text = value.slice(line.start, line.end)
  const parsed = parseBullet(text)

  if (parsed) {
    if (parsed.text.trim() === '') {
      // An empty bullet means "I am done with this list".
      if (parsed.level > 0) {
        const prefix = prefixFor(style, parsed.level - 1)
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

    const prefix = '\n' + parsed.indent + markerFor(style, parsed.level) + ' '
    return {
      value: value.slice(0, start) + prefix + value.slice(start),
      caret: start + prefix.length,
    }
  }

  // Blank line, nothing to turn into a list item.
  if (text.trim() === '') return null

  const prefix = prefixFor(style, 0)
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
  style: BulletStyle,
  direction: 1 | -1,
): Edit | null {
  if (style === 'off') return null
  if (start !== end) return null

  const line = lineAround(value, start)
  const text = value.slice(line.start, line.end)
  const parsed = parseBullet(text)
  if (!parsed) return null

  const level = Math.min(Math.max(parsed.level + direction, 0), MAX_LEVEL)
  if (level === parsed.level) return null

  const replacement = prefixFor(style, level) + parsed.text
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
      // Markdown has ordered lists too, so a numbered item stays numbered.
      const marker = isNumbered(parsed.marker) ? parsed.marker : '-'
      return INDENT.repeat(parsed.level) + marker + ' ' + parsed.text
    })
    .join('\n')
}
