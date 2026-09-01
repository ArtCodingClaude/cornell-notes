import type { Language, Note } from '../types'
import { makeId, todayIso } from './id'
import { isNote } from './storage'

const headings: Record<Language, { cues: string; notes: string; summary: string }> =
  {
    fr: { cues: 'Mots-clés', notes: 'Notes', summary: 'Résumé' },
    nl: { cues: 'Trefwoorden', notes: 'Notities', summary: 'Samenvatting' },
  }

/** Every heading spelling we accept when reading a Markdown file back in. */
const aliases: Record<'cues' | 'notes' | 'summary', string[]> = {
  cues: ['trefwoorden', 'mots-cles', 'mots cles', 'cues', 'keywords', 'vragen'],
  notes: ['notities', 'notes', 'aantekeningen'],
  summary: ['samenvatting', 'resume', 'summary', 'sammenvatting'],
}

function deaccent(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .trim()
}

function matchHeading(text: string): 'cues' | 'notes' | 'summary' | null {
  const clean = deaccent(text)
  for (const key of ['cues', 'notes', 'summary'] as const) {
    if (aliases[key].some((alias) => clean === alias)) return key
  }
  return null
}

export function noteToMarkdown(note: Note, language: Language): string {
  const h = headings[language]
  return [
    `# ${note.title || 'Cornell'}`,
    '',
    note.subject ? `*${note.subject} — ${note.date}*` : `*${note.date}*`,
    '',
    `## ${h.cues}`,
    '',
    note.cues.trim(),
    '',
    `## ${h.notes}`,
    '',
    note.notes.trim(),
    '',
    `## ${h.summary}`,
    '',
    note.summary.trim(),
    '',
  ].join('\n')
}

export function markdownToNote(text: string): Note | null {
  const lines = text.split(/\r?\n/)
  const buckets: Record<'cues' | 'notes' | 'summary', string[]> = {
    cues: [],
    notes: [],
    summary: [],
  }
  let title = ''
  let date = ''
  let subject = ''
  let current: 'cues' | 'notes' | 'summary' | null = null
  let sawSection = false

  for (const line of lines) {
    const h1 = /^#\s+(.*)$/.exec(line)
    if (h1 && !title) {
      title = h1[1].trim()
      current = null
      continue
    }
    const h2 = /^#{2,3}\s+(.*)$/.exec(line)
    if (h2) {
      const section = matchHeading(h2[1])
      if (section) {
        current = section
        sawSection = true
        continue
      }
    }
    if (!current) {
      const dateLine = /(\d{4}-\d{2}-\d{2})/.exec(line)
      if (dateLine && !date) date = dateLine[1]
      continue
    }
    buckets[current].push(line)
  }

  if (!sawSection) return null

  const trim = (value: string[]) => value.join('\n').trim()
  const now = Date.now()
  return {
    id: makeId(),
    title: title || 'Cornell',
    subject,
    date: date || todayIso(),
    cues: trim(buckets.cues),
    notes: trim(buckets.notes),
    summary: trim(buckets.summary),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Reads either format we export: a .json array (or single object), or a
 * .md file with the three section headings. Returns [] when unreadable.
 */
export function parseImportedFile(filename: string, text: string): Note[] {
  const isJson =
    filename.toLowerCase().endsWith('.json') || text.trimStart().startsWith('[')

  if (isJson) {
    try {
      const parsed: unknown = JSON.parse(text)
      const raw = Array.isArray(parsed) ? parsed : [parsed]
      const notes = raw.filter(isNote).map((note) => normalize(note))
      return notes
    } catch {
      return []
    }
  }

  const note = markdownToNote(text)
  return note ? [note] : []
}

function normalize(note: Note): Note {
  const now = Date.now()
  return {
    id: makeId(), // fresh id, so importing twice never overwrites a note
    title: note.title || 'Cornell',
    subject: note.subject ?? '',
    date: note.date || todayIso(),
    cues: note.cues ?? '',
    notes: note.notes ?? '',
    summary: note.summary ?? '',
    createdAt: note.createdAt ?? now,
    updatedAt: now,
  }
}

export function download(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function safeFilename(value: string): string {
  const clean = deaccent(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return clean || 'cornell'
}
