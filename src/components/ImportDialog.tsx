import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { useApp } from '../context/AppContext'
import { parseImportedFile } from '../lib/noteFile'
import type { Note } from '../types'
import { CloseIcon, UploadIcon } from './Icons'
import { buttonGhost, buttonPrimary, card, cx, muted } from './ui'

type Props = { onClose: () => void; onImported: (notes: Note[]) => void }

export function ImportDialog({ onClose, onImported }: Props) {
  const { t } = useApp()
  const [pending, setPending] = useState<Note[] | null>(null)
  const [error, setError] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function readFile(file: File) {
    setError(false)
    const text = await file.text()
    const notes = parseImportedFile(file.name, text)
    if (notes.length === 0) {
      setPending(null)
      setError(true)
      return
    }
    setPending(notes)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void readFile(file)
  }

  const countLabel =
    pending && pending.length === 1
      ? t('import.countReadyOne')
      : t('import.countReadyOther')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('import.title')}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={cx(
          card,
          'fade-up flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-b-none p-5 sm:rounded-2xl',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t('import.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
            aria-label={t('common.close')}
          >
            <CloseIcon />
          </button>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
            dragging
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
              : 'border-[var(--border-strong)]',
          )}
        >
          <UploadIcon className="h-7 w-7 text-[var(--text-muted)]" />
          <p className={muted}>{t('import.drop')}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cx(buttonGhost, 'px-3.5 py-2 text-sm')}
          >
            {t('import.choose')}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.md,.markdown,.txt"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void readFile(file)
              event.target.value = ''
            }}
          />
          <p className="text-xs text-[var(--text-muted)]">
            {t('import.formats')}
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
            {t('import.invalid')}
          </p>
        )}

        {pending && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              {t('import.preview')} — {pending.length} {countLabel}
            </p>
            <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
              {pending.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <p className="truncate text-sm font-semibold">
                    {note.title || t('editor.untitled')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{note.date}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                    {note.notes || note.summary || note.cues || t('common.empty')}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={cx(buttonGhost, 'px-3.5 py-2 text-sm')}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => onImported(pending)}
                className={cx(buttonPrimary, 'px-3.5 py-2 text-sm')}
              >
                {t('import.confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
