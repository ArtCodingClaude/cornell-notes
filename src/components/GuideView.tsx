import { useApp } from '../context/AppContext'
import { actionOrder, formatCombo } from '../lib/shortcuts'
import type { TranslationKey } from '../i18n/translations'
import { CornellDiagram } from './CornellDiagram'
import { BackIcon } from './Icons'
import { buttonGhost, card, cx, muted, sectionTitle } from './ui'

export function GuideView({ onBack }: { onBack: () => void }) {
  const { settings, t } = useApp()

  const sample =
    settings.language === 'nl'
      ? '# Titel van de notitie\n\n*2026-09-01*\n\n## Trefwoorden\n\nWat is X?\n\n## Notities\n\nX is ...\n\n## Samenvatting\n\nIn het kort ...'
      : '# Titre de la note\n\n*2026-09-01*\n\n## Mots-clés\n\nQu’est-ce que X ?\n\n## Notes\n\nX est ...\n\n## Résumé\n\nEn bref ...'

  const features: { title: TranslationKey; desc: TranslationKey }[] = [
    { title: 'guide.featAutoSave', desc: 'guide.featAutoSaveDesc' },
    { title: 'guide.featScale', desc: 'guide.featScaleDesc' },
    { title: 'guide.featKeyboard', desc: 'guide.featKeyboardDesc' },
    { title: 'guide.featImport', desc: 'guide.featImportDesc' },
  ]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-20 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className={cx(buttonGhost, 'px-3 py-2')}>
          <BackIcon className="h-5 w-5" />
          <span className="hidden sm:inline">{t('nav.back')}</span>
        </button>
        <h1 className="text-2xl font-bold">{t('guide.title')}</h1>
      </div>

      <section className={cx(card, 'flex flex-col gap-4 p-5')}>
        <h2 className="text-lg font-semibold">{t('guide.methodTitle')}</h2>
        <p className="leading-relaxed">{t('guide.methodP1')}</p>
        <CornellDiagram compact />
        <p className="leading-relaxed">{t('guide.methodP2')}</p>
        <p className="leading-relaxed">{t('guide.methodP3')}</p>
      </section>

      <section className={cx(card, 'flex flex-col gap-4 p-5')}>
        <h2 className={sectionTitle}>{t('guide.featuresTitle')}</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title}>
              <dt className="font-semibold">{t(feature.title)}</dt>
              <dd className={muted}>{t(feature.desc)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={cx(card, 'flex flex-col gap-3 p-5')}>
        <h2 className={sectionTitle}>{t('shortcuts.title')}</h2>
        <ul className="divide-y divide-[var(--border)]">
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
          <li className="flex items-center justify-between py-2">
            <span className="text-sm">{t('shortcuts.tab')}</span>
            <kbd className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-xs">
              Tab / Shift + Tab
            </kbd>
          </li>
        </ul>
      </section>

      <section className={cx(card, 'flex flex-col gap-3 p-5')}>
        <h2 className={sectionTitle}>{t('guide.formatTitle')}</h2>
        <p className={muted}>{t('guide.formatDesc')}</p>
        <pre className="thin-scroll overflow-x-auto rounded-xl bg-[var(--surface-2)] p-4 text-xs leading-relaxed">
          <code>{sample}</code>
        </pre>
      </section>
    </div>
  )
}
