import { useApp } from '../context/AppContext'
import type { View } from '../types'
import {
  BookIcon,
  KeyboardIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from './Icons'
import { cx, iconButton } from './ui'

type Props = {
  view: View
  onNavigate: (view: View) => void
  onShowShortcuts: () => void
}

export function TopBar({ view, onNavigate, onShowShortcuts }: Props) {
  const { settings, updateSettings, t } = useApp()

  // One button cycles light -> dark -> system, so the theme is always one click away.
  const nextMode =
    settings.themeMode === 'light'
      ? 'dark'
      : settings.themeMode === 'dark'
        ? 'system'
        : 'light'

  const ThemeIcon =
    settings.themeMode === 'light'
      ? SunIcon
      : settings.themeMode === 'dark'
        ? MoonIcon
        : MonitorIcon

  const themeLabel = t(
    settings.themeMode === 'light'
      ? 'theme.light'
      : settings.themeMode === 'dark'
        ? 'theme.dark'
        : 'theme.system',
  )

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 text-left cursor-pointer"
        >
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-bold text-[var(--accent-text)]"
            style={{ background: 'var(--accent)' }}
            aria-hidden="true"
          >
            C
          </span>
          <span className="truncate text-base font-semibold">
            {t('app.title')}
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onShowShortcuts}
            className={cx(iconButton, 'hidden sm:inline-flex')}
            title={t('shortcuts.title')}
            aria-label={t('shortcuts.title')}
          >
            <KeyboardIcon />
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ themeMode: nextMode })}
            className={iconButton}
            title={`${t('theme.toggle')} — ${themeLabel}`}
            aria-label={`${t('theme.toggle')} — ${themeLabel}`}
          >
            <ThemeIcon />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('guide')}
            className={cx(
              iconButton,
              view === 'guide' && 'border-[var(--accent)] text-[var(--accent)]',
            )}
            title={t('nav.guide')}
            aria-label={t('nav.guide')}
          >
            <BookIcon />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className={cx(
              iconButton,
              view === 'settings' &&
                'border-[var(--accent)] text-[var(--accent)]',
            )}
            title={t('nav.settings')}
            aria-label={t('nav.settings')}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
