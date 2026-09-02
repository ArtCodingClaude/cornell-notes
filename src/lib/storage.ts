import type { Note, Settings } from '../types'

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
  bulletStyle: 'dot',
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
  // Notes written before subjects existed have no `subject` field.
  return notes.filter(isNote).map((note) => ({ ...note, subject: note.subject ?? '' }))
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

  return { ...defaultSettings, ...stored, shortcuts }
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
