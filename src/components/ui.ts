/** Shared class strings, so every surface in the app looks the same. */

export const card =
  'rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]'

export const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition ' +
  'disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none'

export const buttonPrimary =
  `${buttonBase} bg-[var(--accent)] text-[var(--accent-text)] px-4 py-2.5 ` +
  'hover:brightness-110 active:brightness-95'

export const buttonGhost =
  `${buttonBase} border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-4 py-2.5 ` +
  'hover:bg-[var(--surface-2)]'

export const iconButton =
  `${buttonBase} h-10 w-10 border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] ` +
  'hover:bg-[var(--surface-2)]'

export const inputBase =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 ' +
  'text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none ' +
  'focus:border-[var(--accent)]'

export const label = 'text-sm font-medium text-[var(--text)]'
export const muted = 'text-sm text-[var(--text-muted)]'
export const sectionTitle =
  'text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]'

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ')
}
