import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from './context/AppContext'
import { Editor } from './components/Editor'
import type { EditorCommand, FocusRequest } from './components/Editor'
import { GuideView } from './components/GuideView'
import { Home } from './components/Home'
import { ImportDialog } from './components/ImportDialog'
import { SettingsView } from './components/SettingsView'
import { ShortcutsOverlay } from './components/ShortcutsOverlay'
import { TopBar } from './components/TopBar'
import { eventToCombo, isTypingTarget } from './lib/shortcuts'
import type { ActionKey, Section, View } from './types'

export default function App() {
  const { notes, settings, createNote, addNotes, flushSave } = useApp()

  const [view, setView] = useState<View>('home')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  // Shortcuts that act on the open note. The editor owns the state; these are
  // only requests, carrying a nonce so the same one twice still counts twice.
  const [command, setCommand] = useState<EditorCommand | null>(null)

  const openNote = useMemo(
    () => notes.find((note) => note.id === openId) ?? null,
    [notes, openId],
  )

  // A note that was open and then deleted should not leave a blank editor.
  useEffect(() => {
    if (view === 'editor' && openId && !openNote) {
      setView('home')
      setOpenId(null)
    }
  }, [view, openId, openNote])

  const startNote = useCallback(() => {
    const note = createNote()
    setOpenId(note.id)
    setView('editor')
    setFocusRequest({ section: 'notes', nonce: Date.now() })
  }, [createNote])

  const goHome = useCallback(() => {
    setView('home')
    setOpenId(null)
  }, [])

  const jumpTo = useCallback(
    (section: Section) => {
      if (view !== 'editor') return
      setFocusRequest({ section, nonce: Date.now() })
    },
    [view],
  )

  // Global shortcuts. Single-key bindings are ignored while the user is
  // typing, so pressing "?" inside a note writes a question mark.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const combo = eventToCombo(event)
      if (!combo) return

      const entry = (
        Object.entries(settings.shortcuts) as [ActionKey, string][]
      ).find(([, value]) => value === combo)
      if (!entry) return
      const action = entry[0]

      const hasModifier = combo.includes('mod+') || combo.includes('alt+')
      if (!hasModifier && combo !== 'escape' && isTypingTarget(event.target)) {
        return
      }

      event.preventDefault()

      switch (action) {
        case 'gotoCues':
          jumpTo('cues')
          break
        case 'gotoNotes':
          jumpTo('notes')
          break
        case 'gotoSummary':
          jumpTo('summary')
          break
        case 'newNote':
          startNote()
          break
        case 'save':
          flushSave()
          break
        case 'review':
        case 'undo':
        case 'redo':
          if (view === 'editor') {
            setCommand({ action, nonce: Date.now() + Math.random() })
          }
          break
        case 'home':
          if (showShortcuts) setShowShortcuts(false)
          else if (showImport) setShowImport(false)
          else goHome()
          break
        case 'help':
          setShowShortcuts((current) => !current)
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    settings.shortcuts,
    jumpTo,
    startNote,
    flushSave,
    goHome,
    showShortcuts,
    showImport,
    view,
  ])

  return (
    <div className="min-h-full">
      <TopBar
        view={view}
        onNavigate={(next) => {
          if (next === 'home') goHome()
          else setView(next)
        }}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <main>
        {view === 'home' && (
          <Home
            onOpen={(id) => {
              setOpenId(id)
              setView('editor')
            }}
            onCreate={startNote}
            onImport={() => setShowImport(true)}
            onGuide={() => setView('guide')}
          />
        )}

        {view === 'editor' && openNote && (
          <Editor
            note={openNote}
            focusRequest={focusRequest}
            command={command}
            onBack={goHome}
          />
        )}

        {view === 'settings' && (
          <SettingsView onBack={goHome} onImport={() => setShowImport(true)} />
        )}

        {view === 'guide' && <GuideView onBack={goHome} />}
      </main>

      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImported={(imported) => {
            addNotes(imported)
            setShowImport(false)
            setView('home')
          }}
        />
      )}

      {showShortcuts && (
        <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  )
}
