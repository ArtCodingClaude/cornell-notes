import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
  RefObject,
} from 'react'
import { useApp } from '../context/AppContext'
import { useFitFontSize } from '../hooks/useAutoFontSize'
import {
  applyCorrection,
  commitKeys,
  correctionAround,
  correctionBefore,
} from '../lib/autocorrect'
import type { Correction } from '../lib/autocorrect'
import { useUndoHistory } from '../hooks/useUndoHistory'
import type { Snapshot } from '../hooks/useUndoHistory'
import { onEnter, onIndent, renumber } from '../lib/bullets'
import { download, noteToMarkdown, safeFilename } from '../lib/noteFile'
import type { Note, Section } from '../types'
import {
  BackIcon,
  CheckIcon,
  DownloadIcon,
  ExpandIcon,
  EyeIcon,
  EyeOffIcon,
  ShrinkIcon,
  TrashIcon,
} from './Icons'
import { buttonGhost, cx, iconButton } from './ui'

export type FocusRequest = { section: Section; nonce: number }

/** A shortcut asking the open note to do something. */
export type EditorCommand = {
  action: 'review' | 'undo' | 'redo'
  nonce: number
}

type Props = {
  note: Note
  focusRequest: FocusRequest | null
  command: EditorCommand | null
  /** Note alone on the screen, every button hidden but the way out. */
  fullscreen: boolean
  onFullscreen: (next: boolean) => void
  onBack: () => void
}

const order: Section[] = ['cues', 'notes', 'summary']

export function Editor({
  note,
  focusRequest,
  command,
  fullscreen,
  onFullscreen,
  onBack,
}: Props) {
  const { updateNote, deleteNote, settings, saveState, t } = useApp()
  const [active, setActive] = useState<Section>('notes')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [revealed, setRevealed] = useState({ notes: false, summary: false })

  // Words the autocorrection has been told to leave alone, by tapping Alt.
  // Held here rather than per section, because a technical word you refused
  // in the notes is the same word you will type in the summary. Not saved:
  // it lasts as long as this visit, which is as long as the word matters.
  const [kept, setKept] = useState<ReadonlySet<string>>(() => new Set())
  const keepWord = useCallback((word: string) => {
    setKept((current) => new Set(current).add(word))
  }, [])

  const rootRef = useRef<HTMLDivElement>(null)

  const refs = {
    cues: useRef<HTMLTextAreaElement>(null),
    notes: useRef<HTMLTextAreaElement>(null),
    summary: useRef<HTMLTextAreaElement>(null),
  }

  // Ask the browser for real fullscreen on the note element itself. Handing it
  // this element rather than the page is what takes the top bar with it:
  // fullscreen paints one element and its children, and nothing else.
  useEffect(() => {
    const el = rootRef.current
    if (fullscreen) {
      // Refused in an iframe, and unsupported on an iPhone. The layout below
      // still fills the window, which is the point; only the browser's own
      // bars stay.
      if (el?.requestFullscreen && !document.fullscreenElement) {
        void el.requestFullscreen().catch(() => {})
      }
    } else if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {})
    }
  }, [fullscreen])

  // Escape and F11 leave fullscreen behind our back, so follow the browser
  // rather than assume our own state is still true.
  useEffect(() => {
    function onChange() {
      if (!document.fullscreenElement) onFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [onFullscreen])

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

  // Undo history, because a controlled textarea has no usable native one.
  const applySnapshot = useCallback(
    (snapshot: Snapshot, field: keyof Snapshot | null) => {
      updateNote(note.id, snapshot)
      if (field && field !== 'title') {
        const target = refs[field].current
        // Put the caret back where the change was, so the next keystroke
        // carries on from there instead of at the end of another section.
        window.requestAnimationFrame(() => {
          target?.focus()
          const end = snapshot[field].length
          target?.setSelectionRange(end, end)
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [note.id, updateNote],
  )
  const { undo, redo } = useUndoHistory(note, applySnapshot)

  // Shortcuts live in App, which only sends a command with a nonce. Comparing
  // against the last one handled keeps this from firing on mount.
  const lastCommand = useRef(command)
  useEffect(() => {
    if (command === lastCommand.current) return
    lastCommand.current = command
    if (!command) return
    if (command.action === 'review') toggleReview()
    if (command.action === 'undo') undo()
    if (command.action === 'redo') redo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command])

  // Opening another note should not leave you half way through a review.
  useEffect(() => {
    setReviewing(false)
    setRevealed({ notes: false, summary: false })
  }, [note.id])

  // Entering review by clicking the button leaves the focus on it, so Space
  // would press that button again and drop straight back out. Move to the
  // cues instead: it is what you read first anyway.
  useEffect(() => {
    if (!reviewing) return
    refs.cues.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewing])

  // One key drives the whole review loop: reveal the notes, reveal the
  // summary, then cover both again for the next question. The next state is
  // computed from this render's value rather than with an updater, so the
  // same keypress arriving twice cannot skip a step.
  useEffect(() => {
    if (!reviewing) return
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== ' ' && event.key !== 'Enter') return
      // A focused button already answers to Space and Enter on its own.
      if (event.target instanceof HTMLButtonElement) return
      event.preventDefault()
      if (!revealed.notes) setRevealed({ ...revealed, notes: true })
      else if (!revealed.summary) setRevealed({ ...revealed, summary: true })
      else setRevealed({ notes: false, summary: false })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [reviewing, revealed])

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
    <div
      ref={rootRef}
      className={cx(
        'flex flex-col',
        fullscreen
          ? 'note-fullscreen gap-3 p-3 sm:p-4'
          : 'mx-auto max-w-6xl gap-4 px-4 pb-16 pt-6 sm:px-6',
      )}
    >
      {fullscreen && (
        <div className="flex shrink-0 items-center justify-end">
          <button
            type="button"
            onClick={() => onFullscreen(false)}
            className={cx(iconButton, 'h-9 w-9 opacity-50 hover:opacity-100')}
            title={`${t('editor.fullscreenExit')} — ${t('editor.fullscreenHint')}`}
            aria-label={t('editor.fullscreenExit')}
          >
            <ShrinkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Hidden rather than unmounted in fullscreen: `display: none` also takes
          these buttons out of the tab order, and the note keeps its state. */}
      <div
        className={cx(
          'flex flex-wrap items-center gap-2',
          fullscreen && 'hidden',
        )}
      >
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
          onClick={() => onFullscreen(true)}
          className={cx(buttonGhost, 'px-3 py-2')}
          title={`${t('editor.fullscreen')} — ${t('editor.fullscreenHint')}`}
        >
          <ExpandIcon className="h-5 w-5" />
          <span className="hidden sm:inline">{t('editor.fullscreen')}</span>
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
            {note.cues.trim() && (
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-xs">
                  {t('review.spaceKey')}
                </kbd>{' '}
                {t('review.spaceHint')}
              </p>
            )}
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

      <div
        className={cx(
          'flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:flex-row sm:items-center',
          fullscreen && 'hidden',
        )}
      >
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

      <div className="note-row flex flex-col gap-3 lg:flex-row lg:items-stretch">
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
          kept={kept}
          onKeepWord={keepWord}
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
          kept={kept}
          onKeepWord={keepWord}
          onKeyDown={(event) => onSectionKeyDown(event, 'notes')}
        />
      </div>

      <SectionBox
        section="summary"
        className="note-summary"
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
        kept={kept}
        onKeepWord={keepWord}
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
  className,
  style,
  kept,
  onKeepWord,
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
  className?: string
  style?: CSSProperties
  /** Words the autocorrection must leave alone. Lower case. */
  kept: ReadonlySet<string>
  onKeepWord: (word: string) => void
  onChange: (value: string) => void
  onFocus: () => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}) {
  const { settings, t } = useApp()
  const fontSize = useFitFontSize(textareaRef, value, settings)
  const tone = palette[section]

  // The word under the caret, when there is a better spelling on offer. It
  // is shown in the header the whole time it is on offer, so a correction is
  // never a surprise: you see it coming, and Alt turns it down.
  const [hint, setHint] = useState<Correction | null>(null)
  // What was just replaced, held on screen for a moment afterwards so a
  // correction that happened while you were looking at the keyboard is not
  // silent.
  const [done, setDone] = useState<Correction | null>(null)
  const doneTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(doneTimer.current), [])

  const autocorrectOn = settings.autocorrect && !readOnly && !masked

  function offered(candidate: Correction | null): Correction | null {
    if (!candidate) return null
    return kept.has(candidate.word.toLowerCase()) ? null : candidate
  }

  function refreshHint(el: HTMLTextAreaElement) {
    if (!autocorrectOn) {
      setHint(null)
      return
    }
    setHint(
      offered(correctionAround(el.value, el.selectionStart, settings.language)),
    )
  }

  function flashDone(correction: Correction) {
    setHint(null)
    setDone(correction)
    window.clearTimeout(doneTimer.current)
    doneTimer.current = window.setTimeout(() => setDone(null), 1900)
  }

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

  // What the header shows instead of the character count. A live suggestion
  // comes first: the confirmation of the last one is only still there because
  // its couple of seconds have not run out.
  const suggestion = masked || readOnly ? null : (hint ?? done)
  /** The header is confirming a correction rather than offering one. */
  const confirming = suggestion !== null && suggestion === done

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const el = event.currentTarget

    // A tap on Alt keeps the word exactly as typed — and keeps it for the
    // rest of the visit, since a word worth refusing once is usually a
    // technical one you are about to type again.
    if (event.key === 'Alt' && autocorrectOn) {
      // Read the word back rather than trusting the hint in state, which the
      // confirmation of the previous correction may still be sitting on.
      const refused =
        hint ??
        offered(correctionAround(el.value, el.selectionStart, settings.language))
      if (refused) {
        event.preventDefault()
        onKeepWord(refused.word.toLowerCase())
        setHint(null)
        setDone(null)
        return
      }
    }

    // Finishing a word applies its correction. Text and caret are threaded
    // through the rest of this handler so the replacement and the character
    // that triggered it land as a single edit — which is also a single undo.
    let text = el.value
    let caret = el.selectionStart
    let selectionEnd = el.selectionEnd
    let applied: Correction | null = null

    if (
      autocorrectOn &&
      commitKeys.has(event.key) &&
      caret === selectionEnd &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const candidate = offered(
        correctionBefore(text, caret, settings.language),
      )
      if (candidate) {
        const edit = applyCorrection(text, candidate)
        text = edit.value
        caret = edit.caret
        selectionEnd = edit.caret
        applied = candidate
      }
    }

    if (bulletsOn) {
      // Shift+Enter stays a plain newline, so there is always a way out.
      const plainEnter =
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey

      const edit = plainEnter
        ? onEnter(text, caret, selectionEnd, settings.bulletStyle)
        : event.altKey &&
            (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
          ? onIndent(
              text,
              caret,
              selectionEnd,
              settings.bulletStyle,
              event.key === 'ArrowRight' ? 1 : -1,
            )
          : null

      if (edit) {
        event.preventDefault()
        // A new item shifts every number below it along by one.
        const fixed = renumber(edit.value, edit.caret, settings.bulletStyle)
        pendingCaret.current = fixed.caret
        if (applied) flashDone(applied)
        onChange(fixed.value)
        return
      }
    }

    if (applied) {
      // We have taken the keypress over, so the character that finished the
      // word has to be typed in by hand.
      event.preventDefault()
      const typed = event.key === 'Enter' ? '\n' : event.key
      const next = text.slice(0, caret) + typed + text.slice(selectionEnd)
      const fixed = renumber(next, caret + typed.length, settings.bulletStyle)
      pendingCaret.current = fixed.caret
      flashDone(applied)
      onChange(fixed.value)
      return
    }

    onKeyDown(event)
  }

  // Enter is not the only thing that breaks a numbered list: deleting a line,
  // pasting a block or typing over a marker all leave the count wrong. So the
  // numbering is checked on the way through every change, not only on Enter.
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const el = event.currentTarget
    refreshHint(el)
    if (bulletsOn && settings.bulletStyle === 'number') {
      const fixed = renumber(el.value, el.selectionStart, settings.bulletStyle)
      if (fixed.value !== el.value) {
        pendingCaret.current = fixed.caret
        onChange(fixed.value)
        return
      }
    }
    onChange(el.value)
  }

  return (
    <section
      className={cx(
        'relative flex min-w-0 flex-col rounded-2xl border-2 bg-[var(--surface)] transition-[border-color,box-shadow] duration-200',
        className,
      )}
      style={{
        ...style,
        borderColor: masked ? tone.color : active ? tone.color : 'var(--border)',
        boxShadow: active
          ? `0 0 0 3px color-mix(in srgb, ${tone.color} 22%, transparent), var(--shadow)`
          : 'var(--shadow)',
      }}
    >
      {/* A fixed height, so a suggestion appearing cannot nudge the note
          down a couple of pixels while you are writing in it. */}
      <div
        className="flex min-h-[2.15rem] items-center justify-between gap-2 rounded-t-[0.9rem] px-4 py-1"
        style={{ background: tone.soft }}
      >
        <h2
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: tone.color }}
        >
          {title}
        </h2>
        {/* Next to the title rather than off in the far corner: it belongs
            to the word you are in the middle of typing, and that is where
            you are looking. */}
        {suggestion && (
          <span
            className="fade-up mr-auto flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs shadow-[var(--shadow)]"
            style={{ borderColor: tone.color, background: 'var(--surface)' }}
            title={
              confirming ? t('autocorrect.undoHint') : t('autocorrect.keepHint')
            }
            aria-live="polite"
          >
            {confirming && (
              <span className="shrink-0" style={{ color: tone.color }}>
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
            )}
            <span className="truncate text-[var(--text-muted)] line-through">
              {suggestion.word}
            </span>
            <span aria-hidden className="shrink-0 text-[var(--text-muted)]">
              →
            </span>
            {/* The word on offer never shrinks — it is the whole point of
                the thing. What you typed is what gives way. */}
            <span className="shrink-0 font-semibold" style={{ color: tone.color }}>
              {suggestion.to}
            </span>
            {!confirming && (
              <kbd className="ml-0.5 hidden shrink-0 rounded border border-[var(--border)] bg-[var(--surface-2)] px-1 font-mono text-[10px] text-[var(--text-muted)] sm:inline">
                Alt
              </kbd>
            )}
          </span>
        )}
        <span
          className={cx(
            'shrink-0 text-[11px] tabular-nums',
            // The count gives way to a suggestion wherever the two would be
            // fighting over the width: always in the narrow cue column, and
            // on a phone everywhere.
            suggestion && (section === 'cues' ? 'hidden' : 'hidden sm:inline'),
          )}
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
        onChange={handleChange}
        onFocus={(event) => {
          onFocus()
          refreshHint(event.currentTarget)
        }}
        // Moving the caret changes which word is under it, and React fires
        // this for a plain caret move as well as for a real selection.
        onSelect={(event) => refreshHint(event.currentTarget)}
        onBlur={() => setHint(null)}
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
