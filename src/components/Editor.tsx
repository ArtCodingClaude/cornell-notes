import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, RefObject } from 'react'
import { useApp } from '../context/AppContext'
import { useFitFontSize } from '../hooks/useAutoFontSize'
import { onEnter, onIndent } from '../lib/bullets'
import { download, noteToMarkdown, safeFilename } from '../lib/noteFile'
import type { Note, Section } from '../types'
import {
  BackIcon,
  CheckIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
} from './Icons'
import { buttonGhost, cx } from './ui'

export type FocusRequest = { section: Section; nonce: number }

type Props = {
  note: Note
  focusRequest: FocusRequest | null
  reviewRequest: number
  onBack: () => void
}

const order: Section[] = ['cues', 'notes', 'summary']

export function Editor({ note, focusRequest, reviewRequest, onBack }: Props) {
  const { updateNote, deleteNote, settings, saveState, t } = useApp()
  const [active, setActive] = useState<Section>('notes')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [revealed, setRevealed] = useState({ notes: false, summary: false })

  const refs = {
    cues: useRef<HTMLTextAreaElement>(null),
    notes: useRef<HTMLTextAreaElement>(null),
    summary: useRef<HTMLTextAreaElement>(null),
  }

  // A shortcut elsewhere in the app asked us to jump to a section.
  useEffect(() => {
    if (!focusRequest) return
    refs[focusRequest.section].current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest])

  function toggleReview() {
    setReviewing((current) => !current)
    setRevealed({ notes: false, summary: false })
  }

  // The review shortcut lives in App, which only bumps a counter. Comparing
  // against the last one we handled keeps this from firing on mount.
  const lastReviewRequest = useRef(reviewRequest)
  useEffect(() => {
    if (reviewRequest === lastReviewRequest.current) return
    lastReviewRequest.current = reviewRequest
    toggleReview()
  }, [reviewRequest])

  // Opening another note should not leave you half way through a review.
  useEffect(() => {
    setReviewing(false)
    setRevealed({ notes: false, summary: false })
  }, [note.id])

  function isMasked(section: Section): boolean {
    if (!reviewing) return false
    if (section === 'cues') return false
    return !revealed[section as 'notes' | 'summary']
  }

  function move(from: Section, direction: 1 | -1) {
    // Tabbing into a covered section would put the caret somewhere invisible.
    let index = order.indexOf(from)
    for (let step = 0; step < order.length; step += 1) {
      index = (index + direction + order.length) % order.length
      if (!isMasked(order[index])) break
    }
    const next = order[index]
    refs[next].current?.focus()
    refs[next].current?.setSelectionRange(
      refs[next].current.value.length,
      refs[next].current.value.length,
    )
  }

  function onSectionKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    section: Section,
  ) {
    if (event.key === 'Tab') {
      event.preventDefault()
      move(section, event.shiftKey ? -1 : 1)
    }
  }

  function exportMarkdown() {
    download(
      `${safeFilename(note.title || 'cornell')}.md`,
      noteToMarkdown(note, settings.language),
      'text/markdown',
    )
  }

  const cuesWidth = `${settings.cuesRatio}%`

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-16 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className={cx(buttonGhost, 'px-3 py-2')}>
          <BackIcon className="h-5 w-5" />
          <span className="hidden sm:inline">{t('nav.back')}</span>
        </button>

        <span
          className={cx(
            'ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
            saveState === 'saved'
              ? 'bg-[var(--surface-2)] text-[var(--text-muted)]'
              : 'bg-[var(--accent-soft)] text-[var(--accent)]',
          )}
          aria-live="polite"
        >
          {saveState === 'saving' ? (
            t('editor.saving')
          ) : (
            <>
              <CheckIcon className="h-3.5 w-3.5" />
              {t('editor.saved')}
            </>
          )}
        </span>

        <button
          type="button"
          onClick={toggleReview}
          className={cx(
            buttonGhost,
            'px-3 py-2',
            reviewing && 'border-[var(--accent)] text-[var(--accent)]',
          )}
          title={reviewing ? t('review.exit') : t('review.start')}
          aria-pressed={reviewing}
        >
          {/* Eye-off to cover the answers, eye to bring them all back: the
              same language as the reveal buttons on the sections. */}
          {reviewing ? (
            <EyeIcon className="h-5 w-5" />
          ) : (
            <EyeOffIcon className="h-5 w-5" />
          )}
          <span className="hidden sm:inline">
            {reviewing ? t('review.exit') : t('review.start')}
          </span>
        </button>

        <button
          type="button"
          onClick={exportMarkdown}
          className={cx(buttonGhost, 'px-3 py-2')}
          title={t('editor.export')}
        >
          <DownloadIcon className="h-5 w-5" />
          <span className="hidden sm:inline">{t('editor.export')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirmDelete) {
              deleteNote(note.id)
              onBack()
            } else {
              setConfirmDelete(true)
              window.setTimeout(() => setConfirmDelete(false), 4000)
            }
          }}
          className={cx(
            buttonGhost,
            'px-3 py-2',
            confirmDelete && 'border-red-500 text-red-500',
          )}
          title={t('editor.delete')}
        >
          <TrashIcon className="h-5 w-5" />
          <span className="hidden sm:inline">
            {confirmDelete ? t('editor.deleteConfirm') : t('editor.delete')}
          </span>
        </button>
      </div>

      {reviewing && (
        <div
          className="fade-up flex flex-wrap items-center gap-3 rounded-2xl border-2 px-4 py-3"
          style={{
            borderColor: 'var(--accent)',
            background: 'var(--accent-soft)',
          }}
          role="status"
        >
          <span className="shrink-0" style={{ color: 'var(--accent)' }}>
            <EyeOffIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              {t('review.title')}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {note.cues.trim() ? t('review.intro') : t('review.emptyCues')}
            </p>
          </div>
          {(revealed.notes || revealed.summary) && (
            <button
              type="button"
              onClick={() => setRevealed({ notes: false, summary: false })}
              className={cx(buttonGhost, 'px-3 py-2 text-sm')}
            >
              <EyeOffIcon className="h-4 w-4" />
              {t('review.hideAgain')}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:flex-row sm:items-center">
        <input
          value={note.title}
          onChange={(event) => updateNote(note.id, { title: event.target.value })}
          placeholder={t('editor.titlePlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
        />
        <input
          type="date"
          value={note.date}
          onChange={(event) => updateNote(note.id, { date: event.target.value })}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <SectionBox
          section="cues"
          value={note.cues}
          active={active === 'cues'}
          placeholder={t('editor.cuesPlaceholder')}
          title={t('diagram.cues')}
          textareaRef={refs.cues}
          bullets
          readOnly={reviewing}
          style={{ flexBasis: cuesWidth }}
          onChange={(value) => updateNote(note.id, { cues: value })}
          onFocus={() => setActive('cues')}
          onKeyDown={(event) => onSectionKeyDown(event, 'cues')}
        />
        <SectionBox
          section="notes"
          value={note.notes}
          active={active === 'notes'}
          placeholder={t('editor.notesPlaceholder')}
          title={t('diagram.notes')}
          textareaRef={refs.notes}
          bullets
          readOnly={reviewing}
          masked={isMasked('notes')}
          revealLabel={t('review.revealNotes')}
          onReveal={() => setRevealed((current) => ({ ...current, notes: true }))}
          style={{ flexGrow: 1, flexBasis: 0 }}
          onChange={(value) => updateNote(note.id, { notes: value })}
          onFocus={() => setActive('notes')}
          onKeyDown={(event) => onSectionKeyDown(event, 'notes')}
        />
      </div>

      <SectionBox
        section="summary"
        value={note.summary}
        active={active === 'summary'}
        placeholder={t('editor.summaryPlaceholder')}
        title={t('diagram.summary')}
        textareaRef={refs.summary}
        readOnly={reviewing}
        masked={isMasked('summary')}
        revealLabel={t('review.revealSummary')}
        onReveal={() => setRevealed((current) => ({ ...current, summary: true }))}
        onChange={(value) => updateNote(note.id, { summary: value })}
        onFocus={() => setActive('summary')}
        onKeyDown={(event) => onSectionKeyDown(event, 'summary')}
      />
    </div>
  )
}

const palette: Record<Section, { color: string; soft: string; min: string }> = {
  cues: { color: 'var(--cue)', soft: 'var(--cue-soft)', min: '16rem' },
  notes: { color: 'var(--note)', soft: 'var(--note-soft)', min: '24rem' },
  summary: { color: 'var(--sum)', soft: 'var(--sum-soft)', min: '9rem' },
}

function SectionBox({
  section,
  value,
  active,
  title,
  placeholder,
  textareaRef,
  bullets = false,
  readOnly = false,
  masked = false,
  revealLabel,
  onReveal,
  style,
  onChange,
  onFocus,
  onKeyDown,
}: {
  section: Section
  value: string
  active: boolean
  title: string
  placeholder: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  bullets?: boolean
  readOnly?: boolean
  masked?: boolean
  revealLabel?: string
  onReveal?: () => void
  style?: CSSProperties
  onChange: (value: string) => void
  onFocus: () => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}) {
  const { settings, t } = useApp()
  const fontSize = useFitFontSize(textareaRef, value, settings)
  const tone = palette[section]

  // A bullet edit rewrites the whole field, so the caret has to be put back
  // once React has rendered the new value.
  const pendingCaret = useRef<number | null>(null)
  useLayoutEffect(() => {
    const caret = pendingCaret.current
    if (caret === null) return
    pendingCaret.current = null
    textareaRef.current?.setSelectionRange(caret, caret)
  }, [value, textareaRef])

  const bulletsOn = bullets && settings.bulletStyle !== 'off' && !readOnly

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (bulletsOn) {
      const el = event.currentTarget
      const { value: text, selectionStart, selectionEnd } = el

      // Shift+Enter stays a plain newline, so there is always a way out.
      const plainEnter =
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey

      const edit = plainEnter
        ? onEnter(text, selectionStart, selectionEnd, settings.bulletStyle)
        : event.altKey &&
            (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
          ? onIndent(
              text,
              selectionStart,
              selectionEnd,
              settings.bulletStyle,
              event.key === 'ArrowRight' ? 1 : -1,
            )
          : null

      if (edit) {
        event.preventDefault()
        pendingCaret.current = edit.caret
        onChange(edit.value)
        return
      }
    }

    onKeyDown(event)
  }

  return (
    <section
      className={cx(
        'relative flex min-w-0 flex-col rounded-2xl border-2 bg-[var(--surface)] transition-[border-color,box-shadow] duration-200',
      )}
      style={{
        ...style,
        borderColor: masked ? tone.color : active ? tone.color : 'var(--border)',
        boxShadow: active
          ? `0 0 0 3px color-mix(in srgb, ${tone.color} 22%, transparent), var(--shadow)`
          : 'var(--shadow)',
      }}
    >
      <div
        className="flex items-center justify-between gap-2 rounded-t-[0.9rem] px-4 py-2"
        style={{ background: tone.soft }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: tone.color }}
        >
          {title}
        </h2>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: tone.color, opacity: 0.75 }}
        >
          {/* The character count would give away how much is behind the
              cover, which is half the answer. */}
          {masked
            ? t('review.hidden')
            : `${value.length} ${t('common.characters')}`}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={!readOnly}
        readOnly={readOnly}
        aria-hidden={masked}
        className="section-area thin-scroll w-full flex-1 resize-none bg-transparent px-4 py-3 leading-relaxed outline-none placeholder:text-[var(--text-muted)]"
        style={
          {
            fontSize: `${fontSize}px`,
            '--section-min-h': tone.min,
            transition: 'font-size 220ms ease',
            // Kept in the layout while hidden, so the box does not resize
            // when the answer is revealed.
            visibility: masked ? 'hidden' : 'visible',
            // No hanging indent for wrapped bullets: a textarea is a single
            // block, so `text-indent` would only pull back the very first
            // line and push every later one to the right. Wrapped text lines
            // up under the marker instead.
          } as CSSProperties
        }
      />

      {masked && (
        <button
          type="button"
          onClick={onReveal}
          className="group absolute inset-x-0 bottom-0 top-[2.4rem] flex cursor-pointer flex-col items-center justify-center gap-2 rounded-b-[0.9rem] transition"
          style={{ background: tone.soft }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full transition group-hover:scale-110"
            style={{ background: 'var(--surface)', color: tone.color }}
          >
            <EyeIcon className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold" style={{ color: tone.color }}>
            {revealLabel}
          </span>
        </button>
      )}
    </section>
  )
}
