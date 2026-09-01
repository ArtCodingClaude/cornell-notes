import { useCallback, useEffect, useRef } from 'react'
import type { Note } from '../types'

/**
 * Undo that works by edit rather than by letter.
 *
 * A controlled textarea has no usable native undo: React writes `value` on
 * every keystroke, so the browser records one entry per character and Ctrl+Z
 * gives back "hello worl". This keeps its own history instead, committing a
 * snapshot once typing has paused.
 */

export type Snapshot = Pick<Note, 'title' | 'cues' | 'notes' | 'summary'>

/** How long typing has to stop before the current state becomes undoable. */
const COMMIT_AFTER = 500

/** Plenty for a writing session, and bounded so a long note cannot grow it forever. */
const MAX_HISTORY = 100

export function snapshotOf(note: Note): Snapshot {
  return {
    title: note.title,
    cues: note.cues,
    notes: note.notes,
    summary: note.summary,
  }
}

function same(a: Snapshot, b: Snapshot): boolean {
  return (
    a.title === b.title &&
    a.cues === b.cues &&
    a.notes === b.notes &&
    a.summary === b.summary
  )
}

/** Which field an undo changed, so the caller can put the caret back there. */
export function changedField(
  a: Snapshot,
  b: Snapshot,
): keyof Snapshot | null {
  if (a.cues !== b.cues) return 'cues'
  if (a.notes !== b.notes) return 'notes'
  if (a.summary !== b.summary) return 'summary'
  if (a.title !== b.title) return 'title'
  return null
}

export function useUndoHistory(
  note: Note,
  apply: (snapshot: Snapshot, field: keyof Snapshot | null) => void,
) {
  const past = useRef<Snapshot[]>([snapshotOf(note)])
  const future = useRef<Snapshot[]>([])
  // Set while we are the ones writing, so restoring does not read as a new edit.
  const restoring = useRef(false)
  const timer = useRef<number | null>(null)

  const current = snapshotOf(note)
  const currentRef = useRef(current)
  currentRef.current = current

  // Starting on another note starts another history.
  useEffect(() => {
    past.current = [snapshotOf(note)]
    future.current = []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  const commit = useCallback(() => {
    const top = past.current[past.current.length - 1]
    if (top && same(top, currentRef.current)) return
    past.current.push(currentRef.current)
    if (past.current.length > MAX_HISTORY) past.current.shift()
  }, [])

  // Wait for a pause in the typing, then make that state undoable.
  useEffect(() => {
    if (restoring.current) {
      restoring.current = false
      return
    }
    // A fresh edit invalidates anything that was undone.
    future.current = []
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(commit, COMMIT_AFTER)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [current.title, current.cues, current.notes, current.summary, commit])

  const undo = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    commit() // anything typed since the last pause is undoable too
    if (past.current.length < 2) return
    const undone = past.current.pop() as Snapshot
    future.current.push(undone)
    const target = past.current[past.current.length - 1]
    restoring.current = true
    apply(target, changedField(undone, target))
  }, [apply, commit])

  const redo = useCallback(() => {
    const target = future.current.pop()
    if (!target) return
    const from = past.current[past.current.length - 1]
    past.current.push(target)
    restoring.current = true
    apply(target, changedField(from, target))
  }, [apply])

  return { undo, redo }
}
