import type { ActionKey } from '../types'

export const actionOrder: ActionKey[] = [
  'gotoCues',
  'gotoNotes',
  'gotoSummary',
  'newNote',
  'save',
  'review',
  'print',
  'home',
  'help',
]

const modifierKeys = new Set(['Control', 'Meta', 'Alt', 'Shift'])

function normalizeKey(key: string): string {
  if (key === ' ') return 'space'
  if (key.length === 1) return key.toLowerCase()
  return key.toLowerCase()
}

/**
 * Turns a keyboard event into a stable string like "mod+1" or "?".
 * "mod" means Ctrl on Windows/Linux and Cmd on macOS, so one stored
 * shortcut works on both. Returns '' when only a modifier was pressed.
 */
export function eventToCombo(e: KeyboardEvent): string {
  const key = normalizeKey(e.key)
  if (modifierKeys.has(e.key)) return ''

  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('mod')
  if (e.altKey) parts.push('alt')

  // Shift is part of the combo for letters and named keys, but not for
  // punctuation that only exists because Shift was held (? : % ...).
  const isShiftedPunctuation = key.length === 1 && !/[a-z0-9]/.test(key)
  if (e.shiftKey && !isShiftedPunctuation) parts.push('shift')

  parts.push(key)
  return parts.join('+')
}

const displayNames: Record<string, string> = {
  escape: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  space: 'Space',
  enter: 'Enter',
  tab: 'Tab',
  backspace: 'Backspace',
}

export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function formatCombo(combo: string): string {
  if (!combo) return '—'
  const mod = isApplePlatform() ? '⌘' : 'Ctrl'
  return combo
    .split('+')
    .map((part) => {
      if (part === 'mod') return mod
      if (part === 'alt') return isApplePlatform() ? '⌥' : 'Alt'
      if (part === 'shift') return isApplePlatform() ? '⇧' : 'Shift'
      return displayNames[part] ?? part.toUpperCase()
    })
    .join(isApplePlatform() ? '' : ' + ')
}

/** True when the event target is a place where the user is typing. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}
