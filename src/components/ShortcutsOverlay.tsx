import { useApp } from '../context/AppContext'
import { actionOrder, formatCombo } from '../lib/shortcuts'
import type { TranslationKey } from '../i18n/translations'
import { CloseIcon } from './Icons'
import { card, cx, muted } from './ui'

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const { settings, t } = useApp()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('shortcuts.title')}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={cx(card, 'fade-up w-full max-w-md p-5')}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t('shortcuts.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
            aria-label={t('common.close')}
          >
            <CloseIcon />
          </button>
        </div>

        <ul className="divide-y divide-[var(--border)]">
          <li className="flex items-center justify-between py-2">
            <span className="text-sm">{t('shortcuts.tab')}</span>
            <kbd className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-xs">
              Tab / Shift + Tab
            </kbd>
          </li>
          {actionOrder.map((action) => (
            <li key={action} className="flex items-center justify-between py-2">
              <span className="text-sm">
                {t(`shortcuts.${action}` as TranslationKey)}
              </span>
              <kbd className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-xs">
                {formatCombo(settings.shortcuts[action])}
              </kbd>
            </li>
          ))}
        </ul>

        <p className={cx(muted, 'mt-3')}>{t('shortcuts.hint')}</p>
      </div>
    </div>
  )
}
