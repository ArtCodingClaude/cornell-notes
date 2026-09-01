import { useMemo } from 'react'
import type { Section, Settings } from '../types'

/**
 * How much text each section can hold before it starts shrinking, and at
 * what length it reaches the minimum size. The cue column is narrow, so it
 * gives up room much sooner than the main notes column.
 */
const thresholds: Record<Section, { start: number; end: number }> = {
  cues: { start: 120, end: 900 },
  notes: { start: 400, end: 4000 },
  summary: { start: 200, end: 1400 },
}

export function autoFontSize(
  text: string,
  section: Section,
  settings: Settings,
): number {
  const min = Math.min(settings.minFontSize, settings.maxFontSize)
  const max = Math.max(settings.minFontSize, settings.maxFontSize)

  if (!settings.autoScale) {
    return Math.min(Math.max(settings.baseFontSize, min), max)
  }

  const { start, end } = thresholds[section]
  const length = text.length
  if (length <= start) return max
  if (length >= end) return min

  const ratio = (length - start) / (end - start)
  // Ease out, so the first few lines barely shrink and long notes settle
  // gently towards the minimum instead of dropping off a cliff.
  const eased = 1 - Math.pow(1 - ratio, 2)
  return Math.round((max - eased * (max - min)) * 10) / 10
}

export function useAutoFontSize(
  text: string,
  section: Section,
  settings: Settings,
): number {
  return useMemo(
    () => autoFontSize(text, section, settings),
    [text, section, settings],
  )
}
