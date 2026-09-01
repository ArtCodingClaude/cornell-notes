import { useCallback, useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { Settings } from '../types'

/**
 * Shrinks a section's text until it actually fits its box.
 *
 * This used to guess from the character count against fixed thresholds, which
 * was wrong as soon as the window was narrow, the lines wrapped, or the user
 * changed the size limits: what matters is the room actually left, so we
 * measure it.
 */

/** Largest size between min and max at which the content stops overflowing. */
function fitFontSize(
  el: HTMLTextAreaElement,
  min: number,
  max: number,
): number {
  // Not laid out yet (hidden tab, first paint): measuring would report an
  // overflow that is not real, so keep the largest size until it is.
  if (el.clientHeight === 0) return max

  const previousSize = el.style.fontSize
  const previousTransition = el.style.transition
  // The size is animated for the user; during measurement we need the layout
  // the browser would settle on, not the frame it is currently animating.
  el.style.transition = 'none'

  const fits = (px: number) => {
    el.style.fontSize = `${px}px`
    return el.scrollHeight <= el.clientHeight
  }

  let result = min
  if (fits(max)) {
    result = max
  } else {
    let low = min
    let high = max
    while (high - low > 0.5) {
      const mid = (low + high) / 2
      if (fits(mid)) low = mid
      else high = mid
    }
    result = Math.round(low * 10) / 10
  }

  el.style.fontSize = previousSize
  el.style.transition = previousTransition
  return result
}

export function useFitFontSize(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  settings: Settings,
): number {
  const min = Math.min(settings.minFontSize, settings.maxFontSize)
  const max = Math.max(settings.minFontSize, settings.maxFontSize)
  const base = Math.min(Math.max(settings.baseFontSize, min), max)
  const { autoScale } = settings

  const [size, setSize] = useState(autoScale ? max : base)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setSize(autoScale ? fitFontSize(el, min, max) : base)
  }, [ref, autoScale, base, min, max])

  useLayoutEffect(() => {
    measure()
  }, [measure, value])

  // The box also changes shape when the window does, or when the cue column
  // ratio is dragged in settings.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, measure])

  return size
}
