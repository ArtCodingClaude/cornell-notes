import { useApp } from '../context/AppContext'

/**
 * A miniature of the Cornell page, so a first-time visitor understands the
 * three-part layout before opening the editor.
 */
export function CornellDiagram({ compact = false }: { compact?: boolean }) {
  const { t, settings } = useApp()
  const cuesWidth = `${settings.cuesRatio}%`

  return (
    <div className="w-full">
      <div
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="flex gap-2.5" style={{ height: compact ? 118 : 168 }}>
          <div
            className="flex flex-col rounded-xl border p-3"
            style={{
              width: cuesWidth,
              borderColor: 'var(--cue)',
              background: 'var(--cue-soft)',
            }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--cue)' }}
            >
              {t('diagram.cues')}
            </span>
            <Lines color="var(--cue)" count={compact ? 3 : 4} widths={[70, 55, 80, 45]} />
          </div>

          <div
            className="flex flex-1 flex-col rounded-xl border p-3"
            style={{ borderColor: 'var(--note)', background: 'var(--note-soft)' }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--note)' }}
            >
              {t('diagram.notes')}
            </span>
            <Lines
              color="var(--note)"
              count={compact ? 4 : 6}
              widths={[95, 88, 70, 92, 60, 84]}
            />
          </div>
        </div>

        <div
          className="mt-2.5 rounded-xl border p-3"
          style={{ borderColor: 'var(--sum)', background: 'var(--sum-soft)' }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--sum)' }}
          >
            {t('diagram.summary')}
          </span>
          <Lines color="var(--sum)" count={2} widths={[100, 62]} />
        </div>
      </div>

      {!compact && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Legend
            color="var(--cue)"
            term={t('diagram.cues')}
            desc={t('diagram.cuesDesc')}
          />
          <Legend
            color="var(--note)"
            term={t('diagram.notes')}
            desc={t('diagram.notesDesc')}
          />
          <Legend
            color="var(--sum)"
            term={t('diagram.summary')}
            desc={t('diagram.summaryDesc')}
          />
        </dl>
      )}
    </div>
  )
}

function Lines({
  color,
  count,
  widths,
}: {
  color: string
  count: number
  widths: number[]
}) {
  return (
    <div className="mt-2 flex flex-col gap-1.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="h-1.5 rounded-full opacity-30"
          style={{ background: color, width: `${widths[index] ?? 70}%` }}
        />
      ))}
    </div>
  )
}

function Legend({
  color,
  term,
  desc,
}: {
  color: string
  term: string
  desc: string
}) {
  return (
    <div className="flex gap-2.5">
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      <div>
        <dt className="text-sm font-semibold">{term}</dt>
        <dd className="text-sm text-[var(--text-muted)]">{desc}</dd>
      </div>
    </div>
  )
}
