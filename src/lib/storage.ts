import { defaultLevels, fullLevels, LEVEL_COUNT, markerOptions } from './bullets'
import type { BulletLevels, Note, Settings } from '../types'

const NOTES_KEY = 'cornell.notes.v1'
const SETTINGS_KEY = 'cornell.settings.v1'

export const defaultSettings: Settings = {
  themeMode: 'system',
  accent: 'indigo',
  language: 'en',
  autoScale: true,
  baseFontSize: 17,
  minFontSize: 12,
  maxFontSize: 22,
  cuesRatio: 30,
  bulletsOn: true,
  bulletLevels: defaultLevels,
  noteListOpen: true,
  autocorrect: true,
  shortcuts: {
    gotoCues: 'mod+1',
    gotoNotes: 'mod+2',
    gotoSummary: 'mod+3',
    newNote: 'mod+b',
    save: 'mod+s',
    home: 'escape',
    help: '?',
    review: 'mod+r',
    fullscreen: 'mod+shift+f',
    print: 'mod+p',
    undo: 'mod+z',
    redo: 'mod+y',
  },
  lastExportAt: 0,
  backupSnoozedUntil: 0,
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadNotes(): Note[] {
  const notes = safeParse<Note[]>(localStorage.getItem(NOTES_KEY), [])
  if (!Array.isArray(notes)) return []
  // Notes written before subjects existed have no `subject` field, and those
  // written before per-note bullets have no `bullets`.
  return notes.filter(isNote).map((note) => ({
    ...note,
    subject: note.subject ?? '',
    bullets: isBulletLevels(note.bullets) ? fullLevels(note.bullets) : null,
  }))
}

/**
 * True of a saved per-level bullet style: known markers, one per level. Up
 * to `LEVEL_COUNT` of them — fewer when it was saved before lists could go
 * that deep, which `fullLevels` then fills up.
 */
export function isBulletLevels(value: unknown): value is BulletLevels {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= LEVEL_COUNT &&
    value.every((marker) => markerOptions.includes(marker))
  )
}

/**
 * What the single bullet choice of earlier versions meant, level by level.
 * Moved over once, so nobody's notes change look after the update.
 */
const fromOldStyle: Record<string, BulletLevels> = {
  dot: fullLevels(['dot', 'circle', 'square']),
  dash: new Array(LEVEL_COUNT).fill('dash'),
  number: fullLevels(['number', 'dot', 'circle']),
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export function loadSettings(): Settings {
  const stored = safeParse<Partial<Settings>>(
    localStorage.getItem(SETTINGS_KEY),
    {},
  )
  const shortcuts = {
    ...defaultSettings.shortcuts,
    ...(stored.shortcuts ?? {}),
  }
  // Redo used to be Ctrl+Shift+Z. Stored settings win over the defaults, so
  // without this the new default would never reach anyone who has already
  // opened the app. Only the old default is moved: a shortcut the user chose
  // themselves is left alone.
  if (shortcuts.redo === 'mod+shift+z') shortcuts.redo = defaultSettings.shortcuts.redo

  // Bullets used to be one choice for every level: off, •, - or 1.
  const { bulletStyle, ...rest } = stored as Partial<Settings> & {
    bulletStyle?: string
  }
  const bullets: Partial<Settings> = {}
  if (bulletStyle !== undefined && rest.bulletLevels === undefined) {
    bullets.bulletsOn = bulletStyle !== 'off'
    bullets.bulletLevels = fromOldStyle[bulletStyle] ?? defaultSettings.bulletLevels
  }
  if (rest.bulletLevels !== undefined) {
    bullets.bulletLevels = isBulletLevels(rest.bulletLevels)
      ? fullLevels(rest.bulletLevels)
      : defaultSettings.bulletLevels
  }

  return { ...defaultSettings, ...rest, ...bullets, shortcuts }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function clearAll(): void {
  localStorage.removeItem(NOTES_KEY)
}

export function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false
  const n = value as Record<string, unknown>
  return (
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.cues === 'string' &&
    typeof n.notes === 'string' &&
    typeof n.summary === 'string'
  )
}
