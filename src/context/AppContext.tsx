import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { AccentKey, Note, Settings } from '../types'
import { dictionaries } from '../i18n/translations'
import type { TranslationKey } from '../i18n/translations'
import {
  clearAll,
  defaultSettings,
  loadNotes,
  loadSettings,
  saveNotes,
  saveSettings,
} from '../lib/storage'
import { makeId, todayIso } from '../lib/id'

export const accents: Record<
  AccentKey,
  { light: string; lightSoft: string; dark: string; darkSoft: string; swatch: string }
> = {
  indigo: {
    light: '#4f46e5',
    lightSoft: '#ebe9fe',
    dark: '#8b8bf7',
    darkSoft: '#262a45',
    swatch: '#4f46e5',
  },
  teal: {
    light: '#0d9488',
    lightSoft: '#dcf5f0',
    dark: '#4fd1c5',
    darkSoft: '#16302e',
    swatch: '#0d9488',
  },
  rose: {
    light: '#e11d48',
    lightSoft: '#ffe4ea',
    dark: '#fb7185',
    darkSoft: '#3a1f28',
    swatch: '#e11d48',
  },
  amber: {
    light: '#b45309',
    lightSoft: '#fdf0d9',
    dark: '#fbbf24',
    darkSoft: '#3a2c14',
    swatch: '#d97706',
  },
  violet: {
    light: '#7c3aed',
    lightSoft: '#f1e9ff',
    dark: '#c4b5fd',
    darkSoft: '#2b2447',
    swatch: '#7c3aed',
  },
  emerald: {
    light: '#047857',
    lightSoft: '#dcf5e8',
    dark: '#6ee7a5',
    darkSoft: '#14301f',
    swatch: '#059669',
  },
}

type SaveState = 'idle' | 'saving' | 'saved'

type AppContextValue = {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  resetShortcuts: () => void
  notes: Note[]
  createNote: () => Note
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  addNotes: (incoming: Note[]) => void
  clearNotes: () => void
  flushSave: () => void
  saveState: SaveState
  isDark: boolean
  t: (key: TranslationKey) => string
}

const AppContext = createContext<AppContextValue | null>(null)

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark)
  const saveTimer = useRef<number | undefined>(undefined)
  const notesRef = useRef(notes)
  notesRef.current = notes

  // Follow the OS theme while the user has "system" selected.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const isDark =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && systemDark)

  // Paint the theme and the chosen accent onto the document.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.lang = settings.language
    const accent = accents[settings.accent] ?? accents.indigo
    root.style.setProperty('--accent', isDark ? accent.dark : accent.light)
    root.style.setProperty(
      '--accent-soft',
      isDark ? accent.darkSoft : accent.lightSoft,
    )
    root.style.setProperty('--accent-text', isDark ? '#10121a' : '#ffffff')
  }, [isDark, settings.accent, settings.language])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // Debounced auto-save. This is deliberately driven from the mutators rather
  // than from an effect on `notes`: an effect would schedule a state update on
  // every keystroke, which React counts as a nested update and cuts off after
  // 50 of them in a row while typing fast.
  const scheduleSave = useCallback(() => {
    setSaveState('saving')
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveNotes(notesRef.current)
      setSaveState('saved')
    }, 500)
  }, [])

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  const resetShortcuts = useCallback(() => {
    setSettings((current) => ({
      ...current,
      shortcuts: { ...defaultSettings.shortcuts },
    }))
  }, [])

  const createNote = useCallback(() => {
    const now = Date.now()
    const note: Note = {
      id: makeId(),
      title: '',
      subject: '',
      date: todayIso(),
      cues: '',
      notes: '',
      summary: '',
      createdAt: now,
      updatedAt: now,
    }
    setNotes((current) => [note, ...current])
    scheduleSave()
    return note
  }, [scheduleSave])

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((current) =>
      current.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note,
      ),
    )
    scheduleSave()
  }, [scheduleSave])

  const deleteNote = useCallback((id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id))
    scheduleSave()
  }, [scheduleSave])

  const addNotes = useCallback((incoming: Note[]) => {
    setNotes((current) => [...incoming, ...current])
    scheduleSave()
  }, [scheduleSave])

  const clearNotes = useCallback(() => {
    clearAll()
    setNotes([])
  }, [])

  // Ctrl/Cmd+S writes immediately instead of waiting for the debounce.
  const flushSave = useCallback(() => {
    window.clearTimeout(saveTimer.current)
    saveNotes(notesRef.current)
    setSaveState('saved')
  }, [])

  const t = useCallback(
    (key: TranslationKey) => dictionaries[settings.language][key] ?? key,
    [settings.language],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      updateSettings,
      resetShortcuts,
      notes,
      createNote,
      updateNote,
      deleteNote,
      addNotes,
      clearNotes,
      flushSave,
      saveState,
      isDark,
      t,
    }),
    [
      settings,
      updateSettings,
      resetShortcuts,
      notes,
      createNote,
      updateNote,
      deleteNote,
      addNotes,
      clearNotes,
      flushSave,
      saveState,
      isDark,
      t,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
