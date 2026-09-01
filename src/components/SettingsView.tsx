import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { accents, useApp } from '../context/AppContext'
import { download, safeFilename } from '../lib/noteFile'
import { actionOrder, eventToCombo, formatCombo } from '../lib/shortcuts'
import type {
  AccentKey,
  ActionKey,
  BulletStyle,
  Language,
  ThemeMode,
} from '../types'
import type { TranslationKey } from '../i18n/translations'
import { BackIcon, DownloadIcon, TrashIcon, UploadIcon } from './Icons'
import {
  buttonGhost,
  buttonPrimary,
  card,
  cx,
  label,
  muted,
  sectionTitle,
} from './ui'

type Props = { onBack: () => void; onImport: () => void }

export function SettingsView({ onBack, onImport }: Props) {
  const {
    settings,
    updateSettings,
    resetShortcuts,
    notes,
    clearNotes,
    t,
  } = useApp()
  const [recording, setRecording] = useState<ActionKey | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  // While recording a shortcut, the next keypress becomes the new binding.
  useEffect(() => {
    if (!recording) return
    function onKeyDown(event: KeyboardEvent) {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') {
        setRecording(null)
        return
      }
      const combo = eventToCombo(event)
      if (!combo) return
      updateSettings({
        shortcuts: { ...settings.shortcuts, [recording as ActionKey]: combo },
      })
      setRecording(null)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recording, settings.shortcuts, updateSettings])

  function exportAll() {
    download(
      `cornell-notes-${safeFilename(new Date().toISOString().slice(0, 10))}.json`,
      JSON.stringify(notes, null, 2),
      'application/json',
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-20 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className={cx(buttonGhost, 'px-3 py-2')}>
          <BackIcon className="h-5 w-5" />
          <span className="hidden sm:inline">{t('nav.back')}</span>
        </button>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </div>

      <Panel title={t('settings.appearance')}>
        <Row title={t('settings.theme')}>
          <Segmented<ThemeMode>
            value={settings.themeMode}
            onChange={(themeMode) => updateSettings({ themeMode })}
            options={[
              { value: 'light', label: t('theme.light') },
              { value: 'dark', label: t('theme.dark') },
              { value: 'system', label: t('theme.system') },
            ]}
          />
        </Row>

        <Row title={t('lang.label')}>
          <Segmented<Language>
            value={settings.language}
            onChange={(language) => updateSettings({ language })}
            options={[
              { value: 'en', label: t('lang.en') },
              { value: 'fr', label: t('lang.fr') },
              { value: 'nl', label: t('lang.nl') },
            ]}
          />
        </Row>

        <Row title={t('settings.accent')}>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(accents) as AccentKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => updateSettings({ accent: key })}
                aria-label={key}
                aria-pressed={settings.accent === key}
                className={cx(
                  'h-9 w-9 cursor-pointer rounded-full border-2 transition',
                  settings.accent === key
                    ? 'border-[var(--text)] scale-110'
                    : 'border-transparent hover:scale-105',
                )}
                style={{ background: accents[key].swatch }}
              />
            ))}
          </div>
        </Row>
      </Panel>

      <Panel title={t('settings.text')}>
        <Row title={t('settings.bullets')} hint={t('settings.bulletsDesc')}>
          <Segmented<BulletStyle>
            value={settings.bulletStyle}
            onChange={(bulletStyle) => updateSettings({ bulletStyle })}
            options={[
              { value: 'off', label: t('bullets.off') },
              { value: 'dot', label: '•' },
              { value: 'dash', label: '–' },
            ]}
          />
        </Row>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={settings.autoScale}
            onChange={(event) =>
              updateSettings({ autoScale: event.target.checked })
            }
            className="mt-1 h-4 w-4 cursor-pointer accent-[var(--accent)]"
          />
          <span>
            <span className={label}>{t('settings.autoScale')}</span>
            <span className={cx(muted, 'block')}>
              {t('settings.autoScaleDesc')}
            </span>
          </span>
        </label>

        <Slider
          label={t('settings.baseFontSize')}
          value={settings.baseFontSize}
          min={11}
          max={28}
          suffix="px"
          onChange={(baseFontSize) => updateSettings({ baseFontSize })}
        />
        <Slider
          label={t('settings.minFontSize')}
          value={settings.minFontSize}
          min={9}
          max={20}
          suffix="px"
          onChange={(minFontSize) =>
            updateSettings({
              minFontSize,
              maxFontSize: Math.max(minFontSize + 1, settings.maxFontSize),
            })
          }
        />
        <Slider
          label={t('settings.maxFontSize')}
          value={settings.maxFontSize}
          min={12}
          max={36}
          suffix="px"
          onChange={(maxFontSize) =>
            updateSettings({
              maxFontSize,
              minFontSize: Math.min(maxFontSize - 1, settings.minFontSize),
            })
          }
        />
      </Panel>

      <Panel title={t('settings.layout')}>
        <Slider
          label={t('settings.cuesRatio')}
          value={settings.cuesRatio}
          min={18}
          max={50}
          suffix="%"
          onChange={(cuesRatio) => updateSettings({ cuesRatio })}
        />
        <div className="flex gap-2" aria-hidden="true">
          <div
            className="h-10 rounded-lg"
            style={{
              width: `${settings.cuesRatio}%`,
              background: 'var(--cue-soft)',
              border: '1px solid var(--cue)',
            }}
          />
          <div
            className="h-10 flex-1 rounded-lg"
            style={{
              background: 'var(--note-soft)',
              border: '1px solid var(--note)',
            }}
          />
        </div>
      </Panel>

      <Panel title={t('settings.shortcuts')}>
        <p className={muted}>{t('settings.shortcutsDesc')}</p>
        <ul className="divide-y divide-[var(--border)]">
          {actionOrder.map((action) => (
            <li
              key={action}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <span className="text-sm">
                {t(`shortcuts.${action}` as TranslationKey)}
              </span>
              <button
                type="button"
                onClick={() => setRecording(action)}
                className={cx(
                  'min-w-28 cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-xs transition',
                  recording === action
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]',
                )}
              >
                {recording === action
                  ? t('settings.recording')
                  : formatCombo(settings.shortcuts[action])}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={resetShortcuts}
          className={cx(buttonGhost, 'self-start px-3 py-2 text-sm')}
        >
          {t('settings.resetShortcuts')}
        </button>
      </Panel>

      <Panel title={t('settings.data')}>
        <p className={muted}>{t('settings.storageNote')}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportAll}
            className={cx(buttonPrimary, 'px-3.5 py-2 text-sm')}
            disabled={notes.length === 0}
          >
            <DownloadIcon className="h-4 w-4" />
            {t('settings.export')}
          </button>
          <button
            type="button"
            onClick={onImport}
            className={cx(buttonGhost, 'px-3.5 py-2 text-sm')}
          >
            <UploadIcon className="h-4 w-4" />
            {t('settings.import')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirmClear) {
                clearNotes()
                setConfirmClear(false)
              } else {
                setConfirmClear(true)
                window.setTimeout(() => setConfirmClear(false), 5000)
              }
            }}
            disabled={notes.length === 0}
            className={cx(
              buttonGhost,
              'px-3.5 py-2 text-sm',
              confirmClear && 'border-red-500 text-red-500',
            )}
          >
            <TrashIcon className="h-4 w-4" />
            {confirmClear ? t('settings.clearConfirm') : t('settings.clear')}
          </button>
        </div>
        <p className={muted}>{t('settings.exportDesc')}</p>
      </Panel>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={cx(card, 'flex flex-col gap-4 p-5')}>
      <h2 className={sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}

function Row({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="min-w-0">
        <span className={label}>{title}</span>
        {hint && <span className={cx(muted, 'block')}>{hint}</span>}
      </span>
      {children}
    </div>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cx(
            'cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === option.value
              ? 'bg-[var(--accent)] text-[var(--accent-text)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Slider({
  label: title,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={label}>{title}</span>
        <span className="font-mono text-xs text-[var(--text-muted)]">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-[var(--accent)]"
      />
    </div>
  )
}
