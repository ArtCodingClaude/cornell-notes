import { useApp } from '../context/AppContext'
import { markerOptions, markerText } from '../lib/bullets'
import type { TranslationKey } from '../i18n/translations'
import type { BulletLevels, Marker } from '../types'
import { cx, label, muted } from './ui'

const levelNames: TranslationKey[] = [
  'bullets.level1',
  'bullets.level2',
  'bullets.level3',
]

/** The style a note starts with when it is given one of its own. */
export const startingLevels: BulletLevels = ['dot', 'circle', 'square']

/** "1. a) •" — a style in one glance, for buttons and summaries. */
export function describeLevels(levels: BulletLevels): string {
  return levels.map((marker) => markerText(marker)).join('  ')
}

/**
 * One row of markers per nesting level, and a small list underneath drawn
 * with the choice, so you see the result before writing a single line.
 */
export function BulletPicker({
  value,
  onChange,
}: {
  value: BulletLevels
  onChange: (next: BulletLevels) => void
}) {
  const { t } = useApp()

  function choose(level: number, marker: Marker) {
    const next = [...value] as BulletLevels
    next[level] = marker
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {levelNames.map((name, level) => (
        <div key={name} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className={cx(label, 'w-36 shrink-0')}>{t(name)}</span>
          <div
            role="radiogroup"
            aria-label={t(name)}
            className="inline-flex flex-wrap rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1"
          >
            {markerOptions.map((marker) => (
              <button
                key={marker}
                type="button"
                role="radio"
                aria-checked={value[level] === marker}
                title={t(`bullets.marker.${marker}` as TranslationKey)}
                onClick={() => choose(level, marker)}
                className={cx(
                  // A size up from the rest of the settings: ◦ and ▪ are
                  // small signs, and at text-sm they all look like a dot.
                  'min-w-9 cursor-pointer rounded-lg px-2 py-1 text-lg leading-snug font-medium transition',
                  value[level] === marker
                    ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                )}
              >
                {markerText(marker)}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3">
        <p className={cx(muted, 'mb-1.5 text-xs')}>{t('bullets.preview')}</p>
        <Preview levels={value} />
      </div>
    </div>
  )
}

/** Two main points with a sub-point and a sub-sub-point, as they would look. */
function Preview({ levels }: { levels: BulletLevels }) {
  // Which level each line sits at, and which item of its level it is.
  const lines: [level: number, n: number, width: string][] = [
    [0, 1, '10rem'],
    [1, 1, '8rem'],
    [2, 1, '6rem'],
    [1, 2, '7rem'],
    [0, 2, '9rem'],
  ]
  return (
    <div className="flex flex-col gap-1 text-sm" aria-hidden>
      {lines.map(([level, n, width], index) => (
        <div
          key={index}
          className="flex items-center gap-2"
          style={{ paddingLeft: `${level * 1.25}rem` }}
        >
          <span className="w-6 shrink-0 text-right tabular-nums">
            {markerText(levels[level], n)}
          </span>
          <span
            className="h-1.5 rounded-full bg-[var(--border-strong)]"
            style={{ width }}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * The bullets of one note: the general style from the settings, or one of
 * its own. Changing it rewrites the bullets already in the note, through
 * `onChange`, so the note never ends up half in one style.
 */
export function NoteBulletsPanel({
  value,
  general,
  onChange,
}: {
  /** The note's own style, or null when it follows the settings. */
  value: BulletLevels | null
  /** The style from the settings, or null when bullets are off there. */
  general: BulletLevels | null
  onChange: (next: BulletLevels | null) => void
}) {
  const { t } = useApp()
  const own = value !== null

  const choices = [
    { own: false, label: t('bullets.useGeneral') },
    { own: true, label: t('bullets.ownStyle') },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label={t('bullets.note')}
        className="inline-flex self-start rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1"
      >
        {choices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            role="radio"
            aria-checked={own === choice.own}
            onClick={() => {
              if (choice.own === own) return
              onChange(choice.own ? (general ?? startingLevels) : null)
            }}
            className={cx(
              'cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition',
              own === choice.own
                ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
          >
            {choice.label}
          </button>
        ))}
      </div>

      {value ? (
        <BulletPicker value={value} onChange={onChange} />
      ) : (
        <p className={muted}>
          {general ? describeLevels(general) : t('bullets.off')}
        </p>
      )}

      <p className={cx(muted, 'text-xs')}>{t('bullets.restyleHint')}</p>
    </div>
  )
}
