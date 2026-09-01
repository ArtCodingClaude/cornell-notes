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
}

export type Section = 'cues' | 'notes' | 'summary'

export type ThemeMode = 'light' | 'dark' | 'system'

export type Language = 'en' | 'fr' | 'nl'

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
  | 'print'

export type Settings = {
  themeMode: ThemeMode
  accent: AccentKey
  language: Language
  autoScale: boolean
  baseFontSize: number
  minFontSize: number
  maxFontSize: number
  cuesRatio: number // width of the cue column, in percent
  shortcuts: Record<ActionKey, string>
  /** Timestamp of the last export, used by the backup reminder. 0 = never. */
  lastExportAt: number
  /** Reminder snoozed until this timestamp. */
  backupSnoozedUntil: number
}

export type View = 'home' | 'editor' | 'settings' | 'guide'
