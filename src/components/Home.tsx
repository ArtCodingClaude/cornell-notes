import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Note } from '../types'
import { CornellDiagram } from './CornellDiagram'
import { PlusIcon, SearchIcon, UploadIcon } from './Icons'
import { buttonGhost, buttonPrimary, card, cx, inputBase, muted } from './ui'

type Props = {
  onOpen: (id: string) => void
  onCreate: () => void
  onImport: () => void
  onGuide: () => void
}

export function Home({ onOpen, onCreate, onImport, onGuide }: Props) {
  const { notes, settings, t } = useApp()
  const [query, setQuery] = useState('')

  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [notes],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return sorted
    return sorted.filter((note) =>
      [note.title, note.cues, note.notes, note.summary]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [sorted, query])

  const countLabel =
    notes.length === 1 ? t('home.noteCountOne') : t('home.noteCountOther')

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      <section className="fade-up grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('app.title')}
          </h1>
          <p className="mt-2 text-lg text-[var(--text-muted)]">
            {t('app.tagline')}
          </p>
          <p className="mt-5 max-w-prose leading-relaxed text-[var(--text)]">
            {t('home.intro')}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={onCreate} className={buttonPrimary}>
              <PlusIcon className="h-5 w-5" />
              {t('home.newNote')}
            </button>
            <button type="button" onClick={onImport} className={buttonGhost}>
              <UploadIcon className="h-5 w-5" />
              {t('home.upload')}
            </button>
            <button
              type="button"
              onClick={onGuide}
              className={cx(
                buttonGhost,
                'border-transparent bg-transparent px-2 underline underline-offset-4',
              )}
            >
              {t('home.readMore')}
            </button>
          </div>
        </div>

        <div className="fade-up">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t('diagram.title')}
          </p>
          <CornellDiagram />
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">{t('home.yourNotes')}</h2>
          {notes.length > 0 && (
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
              {notes.length} {countLabel}
            </span>
          )}
          {notes.length > 3 && (
            <div className="relative ml-auto w-full sm:w-64">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('home.search')}
                className={cx(inputBase, 'pl-9')}
              />
            </div>
          )}
        </div>

        {notes.length === 0 ? (
          <div
            className={cx(
              card,
              'flex flex-col items-center gap-2 px-6 py-14 text-center',
            )}
          >
            <p className="font-medium">{t('home.empty')}</p>
            <p className={muted}>{t('home.emptyHint')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className={cx(muted, 'py-8')}>{t('home.noResults')}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((note) => (
              <li key={note.id}>
                <NoteCard
                  note={note}
                  language={settings.language}
                  untitled={t('editor.untitled')}
                  emptyLabel={t('common.empty')}
                  onOpen={() => onOpen(note.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function NoteCard({
  note,
  language,
  untitled,
  emptyLabel,
  onOpen,
}: {
  note: Note
  language: string
  untitled: string
  emptyLabel: string
  onOpen: () => void
}) {
  const preview = note.summary.trim() || note.notes.trim() || note.cues.trim()
  const formatted = new Date(note.date + 'T00:00:00').toLocaleDateString(
    language === 'nl' ? 'nl-NL' : 'fr-BE',
    { day: 'numeric', month: 'long', year: 'numeric' },
  )

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cx(
        card,
        'flex h-full w-full cursor-pointer flex-col gap-2 p-5 text-left transition',
        'hover:-translate-y-0.5 hover:border-[var(--accent)]',
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ background: 'var(--accent)' }}
          aria-hidden="true"
        />
        <h3 className="line-clamp-2 font-semibold leading-snug">
          {note.title.trim() || untitled}
        </h3>
      </div>
      <p className="text-xs text-[var(--text-muted)]">{formatted}</p>
      <p className="line-clamp-3 text-sm text-[var(--text-muted)]">
        {preview || emptyLabel}
      </p>
    </button>
  )
}
