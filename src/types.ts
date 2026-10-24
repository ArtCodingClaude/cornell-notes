export type Note = {
  id: string
  title: string
  subject: string // school subject, e.g. Biologie. Empty when unset.
  date: string // ISO yyyy-mm-dd
  cues: string
  notes: string
  summary: string
  createdAt: number
  updatedAt: number
  /** This note's own bullets. Null follows the general setting. */
  bullets: BulletLevels | null
}

export type Section = 'cues' | 'notes' | 'summary'

export type ThemeMode = 'light' | 'dark' | 'system'

export type Language = 'en' | 'fr' | 'nl'

/**
 * What a list item starts with. The first three count their items — 1. 2.,
 * a) b), A. B. — the rest put the same sign in front of every one.
 */
export type Marker =
  | 'number'
  | 'lower'
  | 'upper'
  | 'dot'
  | 'circle'
  | 'square'
  | 'dash'
  | 'arrow'

/** One marker per nesting level: main points, sub-points, sub-sub-points. */
export type BulletLevels = [Marker, Marker, Marker]

export type AccentKey =
  | 'indigo'
  | 'teal'
  | 'rose'
  | 'amber'
  | 'violet'
  | 'emerald'

export type ActionKey =
  | 'gotoCues'
  | 'gotoNotes'
  | 'gotoSummary'
  | 'newNote'
  | 'save'
  | 'home'
  | 'help'
  | 'review'
  | 'fullscreen'
  | 'print'
  | 'undo'
  | 'redo'

export type Settings = {
  themeMode: ThemeMode
  accent: AccentKey
  language: Language
  autoScale: boolean
  baseFontSize: number
  minFontSize: number
  maxFontSize: number
  cuesRatio: number // width of the cue column, in percent
  /** Automatic bullets in the cue and note columns. */
  bulletsOn: boolean
  /** The markers used by every note that has no style of its own. */
  bulletLevels: BulletLevels
  /** The list of notes beside the open one, on a wide screen. */
  noteListOpen: boolean
  /** Fix common misspellings as a word is finished. */
  autocorrect: boolean
  shortcuts: Record<ActionKey, string>
  /** Timestamp of the last export, used by the backup reminder. 0 = never. */
  lastExportAt: number
  /** Reminder snoozed until this timestamp. */
  backupSnoozedUntil: number
}

export type View = 'home' | 'editor' | 'settings' | 'guide'
