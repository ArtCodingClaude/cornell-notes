export type Note = {
  id: string
  title: string
  date: string // ISO yyyy-mm-dd
  cues: string
  notes: string
  summary: string
  createdAt: number
  updatedAt: number
}

export type Section = 'cues' | 'notes' | 'summary'

export type ThemeMode = 'light' | 'dark' | 'system'

export type Language = 'fr' | 'nl'

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
}

export type View = 'home' | 'editor' | 'settings' | 'guide'
