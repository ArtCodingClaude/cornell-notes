import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { dateLocales } from './Home'
import { SearchIcon } from './Icons'
import { cx, inputBase, muted, sectionTitle } from './ui'

/**
 * Every note, beside the one being written, to jump to another and back —
 * to check what was said last lesson without going home first.
 *
 * Newest first by creation date rather than by last edit: sorting by edit
 * would move the open note to the top on every keystroke, and the list would
 * shuffle under the pointer just as you reach for it.
 */
export function NoteList({
  currentId,
  onOpen,
  autoFocus = false,
}: {
  currentId: string
  onOpen: (id: string) => void
  /** Put the caret in the search box, for the list that slides open. */
  autoFocus?: boolean
}) {
  const { notes, settings, t } = useApp()
  const [query, setQuery] = useState('')

  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.createdAt - a.createdAt),
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

  return (
    <nav aria-label={t('noteList.title')} className="flex min-h-0 flex-1 flex-col gap-3">
      <h2 className={cx(sectionTitle, 'px-1')}>{t('noteList.title')}</h2>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('home.search')}
          autoFocus={autoFocus}
          className={cx(inputBase, 'py-1.5 pl-9 text-sm')}
        />
      </div>

      {filtered.length === 0 ? (
        <p className={cx(muted, 'px-1')}>{t('home.noResults')}</p>
      ) : (
        <ul className="thin-scroll -mr-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {filtered.map((note) => {
            const current = note.id === currentId
            const date = new Date(note.date + 'T00:00:00').toLocaleDateString(
              dateLocales[settings.language],
              { day: 'numeric', month: 'short' },
            )
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => onOpen(note.id)}
                  aria-current={current ? 'page' : undefined}
                  className={cx(
                    'flex w-full cursor-pointer flex-col rounded-xl border px-3 py-2 text-left transition',
                    current
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-transparent hover:bg-[var(--surface-2)]',
                  )}
                >
                  <span
                    className={cx(
                      'line-clamp-2 text-sm font-medium leading-snug',
                      current && 'text-[var(--accent)]',
                    )}
                  >
                    {note.title.trim() || t('editor.untitled')}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{date}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
