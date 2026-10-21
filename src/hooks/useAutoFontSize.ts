import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Settings } from '../types'

/**
 * Shrinks a section's text until it actually fits its box.
 *
 * This used to guess from the character count against fixed thresholds, which
 * was wrong as soon as the window was narrow, the lines wrapped, or the user
 * changed the size limits: what matters is the room actually left, so we
 * measure it.
 *
 * Measuring has a trap of its own. Applying a size changes the box, a changed
 * box asks for a new measurement, and two sizes half a pixel apart can hand
 * the box back and forth forever — on screen the letters tremble. The rest of
 * this file exists to make that settle: a constant width to measure against,
 * a step below which two sizes count as one, a margin the text has to win
 * back before it may grow again, and one measurement per frame at most.
 */

/** Sizes closer together than this are the same size as far as we care. */
const STEP = 1

/**
 * Empty lines left under the text whenever the size changes.
 *
 * Shrinking only just enough to fit meant shrinking again on the very next
 * line: twenty little jumps on the way down a full box, each one re-wrapping
 * every line above the caret, which reads as the whole note shaking. Leaving
 * room for a couple of lines makes it a handful of jumps with calm between.
 */
const ROOM_LINES = 2

/** `leading-relaxed` on the textarea: line height as a multiple of the size. */
const LINE_HEIGHT = 1.625

/** A box that moved by less than this did not really change shape. */
const BOX_EPSILON = 1

/**
 * The size to use now, or null while the element has no layout to measure.
 *
 * Shrinks only once the size in use overflows, and grows only once a bigger
 * size would still leave the spare lines free. Between the two it keeps what
 * it has, so no size can ever trade places with another.
 */
function measureFit(
  el: HTMLTextAreaElement,
  min: number,
  max: number,
  current: number,
): number | null {
  // Not laid out yet (hidden tab, first paint): measuring would report an
  // overflow that is not real, so leave the size alone until it is.
  if (el.clientHeight === 0) return null

  const previous = {
    fontSize: el.style.fontSize,
    overflowY: el.style.overflowY,
    paddingBottom: el.style.paddingBottom,
  }
  const padding = parseFloat(getComputedStyle(el).paddingBottom) || 0
  // A scrollbar appearing narrows the text, which moves where the lines wrap,
  // which can make the text fit — and then the scrollbar goes and it
  // overflows again. Holding the gutter open for the whole measurement judges
  // every candidate size against the same width.
  el.style.overflowY = 'scroll'

  /** True when `px` fits with `lines` empty lines still to spare below. */
  const fits = (px: number, lines: number) => {
    el.style.fontSize = `${px}px`
    // Extra padding is the spare room: the box keeps its height, so the text
    // has to fit in what is left above it.
    el.style.paddingBottom = `${padding + lines * px * LINE_HEIGHT}px`
    return el.scrollHeight <= el.clientHeight
  }

  /** The largest size that leaves the spare lines free. */
  const roomy = () => {
    if (fits(max, ROOM_LINES)) return max
    let low = min
    let high = max
    while (high - low > STEP) {
      const mid = (low + high) / 2
      if (fits(mid, ROOM_LINES)) low = mid
      else high = mid
    }
    // Down to a whole step, so the same box always answers with the same
    // number instead of a new decimal every time.
    return Math.max(min, Math.floor(low / STEP) * STEP)
  }

  let next: number
  if (current < min || current > max) {
    // The limits were just moved in settings: take a new size at once rather
    // than hold on to an impossible one.
    next = roomy()
  } else if (!fits(current, 0)) {
    // Overflowing. At the smallest size there is nothing left to try, and the
    // box scrolls instead; otherwise shrink, with room to type into.
    next = current <= min ? min : roomy()
  } else {
    // It fits. Grow only if the bigger size would fit with room to spare too,
    // or the next line would shrink it straight back.
    const bigger = current < max ? roomy() : current
    next = Math.max(bigger, current)
  }

  el.style.fontSize = previous.fontSize
  el.style.overflowY = previous.overflowY
  el.style.paddingBottom = previous.paddingBottom

  return next
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
  // The size in use, readable during a measurement without making every
  // effect depend on it and re-run each time it changes.
  const sizeRef = useRef(size)
  const frame = useRef(0)
  const box = useRef({ width: 0, height: 0 })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const next = autoScale ? measureFit(el, min, max, sizeRef.current) : base
    // Nothing worth changing: no state update, so no render, so nothing to
    // set the observer off again.
    if (next === null || next === sizeRef.current) return
    sizeRef.current = next
    setSize(next)
  }, [ref, autoScale, base, min, max])

  useLayoutEffect(() => {
    measure()
  }, [measure, value])

  // The box also changes shape when the window does, or when the cue column
  // ratio is dragged in settings.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const rect = entries[entries.length - 1]?.contentRect
      if (rect) {
        // Our own new size can nudge the box by a hair and notify us straight
        // back. Only a real change of shape deserves another measurement.
        if (
          Math.abs(rect.width - box.current.width) < BOX_EPSILON &&
          Math.abs(rect.height - box.current.height) < BOX_EPSILON
        ) {
          return
        }
        box.current = { width: rect.width, height: rect.height }
      }
      // One measurement per frame however many notifications arrive, so
      // dragging the window does not queue up hundreds of them.
      if (frame.current) return
      frame.current = window.requestAnimationFrame(() => {
        frame.current = 0
        measure()
      })
    })

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (frame.current) window.cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [ref, measure])

  return size
}
