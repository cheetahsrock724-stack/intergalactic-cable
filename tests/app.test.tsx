/**
 * Integration tests: mount the real <App /> in jsdom with Skia-backed
 * canvases. Exercises power-on, channel controls, keyboard shortcuts,
 * guide search/filters, favorites, persistence, and deep links — and
 * verifies the canvas actually draws broadcast pixels.
 */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App'
import { PREFS_KEY } from '../src/lib/prefs'
import { CHANNELS } from '../src/data/channels'
import { generateChannel } from '../src/data/generate'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const settle = async (ms = 80) => {
  await act(async () => {
    await sleep(ms)
  })
}

let container: HTMLDivElement
let root: Root

const $ = (sel: string) => container.querySelector(sel)
const $$ = (sel: string) => [...container.querySelectorAll(sel)]
const txt = (sel: string) => $(sel)?.textContent ?? ''

function click(el: Element | null) {
  if (!el) throw new Error('element not found')
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function key(k: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
  })
}

function canvasIsDrawing(): boolean {
  const c = container.querySelector('canvas') as HTMLCanvasElement | null
  if (!c || !c.width) return false
  const ctx = c.getContext('2d') as unknown as {
    getImageData: (x: number, y: number, w: number, h: number) => { data: Uint8ClampedArray }
  }
  const { data } = ctx.getImageData(0, 0, c.width, c.height)
  let min = 255
  let max = 0
  for (let i = 0; i < data.length; i += 4 * 97) {
    const l = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (l < min) min = l
    if (l > max) max = l
  }
  return max - min > 24 // not a blank screen
}

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
})

async function mountApp() {
  await act(async () => {
    root.render(<App />)
  })
  await settle()
}

describe('App integration', () => {
  it('boots to the power screen, then plays an animated broadcast', async () => {
    await mountApp()
    expect($('.power-screen')).toBeTruthy()
    expect($('.tv-frame')?.className).toContain('off')

    click($('.power-big'))
    await settle(150)

    expect($('.tv-frame')?.className).toContain('on')
    expect($('.captions')?.textContent?.length ?? 0).toBeGreaterThan(10)
    expect(canvasIsDrawing(), 'canvas should render broadcast pixels').toBe(true)
    expect(txt('.np-name')).toBe(CHANNELS[0].name)
    expect(txt('.rd-name')).toBe(CHANNELS[0].name)
    expect($('.live-badge')?.textContent).toContain('SIMULATED LIVE')
  })

  it('channel up/down wraps around and updates the shareable hash', async () => {
    await mountApp()
    click($('.power-big'))
    await settle(60)

    key('ArrowUp')
    await settle(500) // let the tuning interlude pass
    expect(txt('.rd-name')).toBe(CHANNELS[1].name)
    expect(window.location.hash).toBe(`#/c/${CHANNELS[1].slug}`)

    // from index 1, a full loop of downs (12) plus one more wraps to index 0
    for (let i = 0; i < CHANNELS.length + 1; i++) key('ArrowDown')
    await settle(600)
    expect(txt('.rd-name')).toBe(CHANNELS[0].name)
    expect(window.location.hash).toBe(`#/c/${CHANNELS[0].slug}`)
  })

  it('rapid channel switching does not crash and leaves a working broadcast', async () => {
    await mountApp()
    click($('.power-big'))
    await settle(60)
    for (let i = 0; i < 14; i++) key('ArrowUp') // faster than the tune interlude
    await settle(700)
    expect($('.tv-frame')?.className).toContain('on')
    expect(canvasIsDrawing()).toBe(true)
    // 11 ups finish the curated block, then the dial spills into the void:
    // 12th up → ch 1, 13th → ch 3 (2 is curated), 14th → ch 4
    expect(txt('.rd-name')).toBe(generateChannel(4).name)
    expect(window.location.hash).toBe('#/c/inf-4')
  })

  it('keyboard: m mutes, g opens guide, Escape closes it', async () => {
    await mountApp()
    key('m')
    expect(txt('.rd-sub')).toContain('MUTED')
    key('m')
    expect(txt('.rd-sub')).toContain('VOL')

    key('g')
    await settle(30)
    expect($('.guide')).toBeTruthy()
    key('Escape')
    await settle(30)
    expect($('.guide')).toBeFalsy()
  })

  it('numeric entry tunes directly to a channel', async () => {
    await mountApp()
    click($('.power-big'))
    await settle(60)
    key('ArrowUp') // move away from 404 so tuning back is a real change
    await settle(500)
    expect(txt('.rd-name')).not.toBe('Galactic News 404')

    key('4'); key('0'); key('4')
    expect($('.num-entry')?.textContent).toContain('404')
    key('Enter')
    await settle(500)
    expect(txt('.rd-name')).toBe('Galactic News 404')
    expect(window.location.hash).toBe('#/c/galactic-news-404')
  })

  it('numeric entry tunes to a generated channel on the infinite dial', async () => {
    await mountApp()
    click($('.power-big'))
    await settle(60)

    key('5'); key('5')
    expect($('.num-entry')?.textContent).toContain('55')
    key('Enter')
    await settle(600)
    expect(txt('.rd-name')).toBe(generateChannel(55).name)
    expect(txt('.rd-ch')).toBe('55')
    expect(window.location.hash).toBe('#/c/inf-55')
    expect(canvasIsDrawing(), 'generated channel renders broadcast pixels').toBe(true)
    expect(($('.captions')?.textContent ?? '').length).toBeGreaterThan(10)
  })

  it('channel 0 still does not exist', async () => {
    await mountApp()
    click($('.power-big'))
    await settle(60)
    key('0')
    key('Enter')
    await settle(100)
    expect(txt('.toast')).toContain('No channel 0')
  })

  it('channel up past the last curated channel enters the infinite dial', async () => {
    await mountApp()
    click($('.power-big'))
    await settle(60)

    for (let i = 0; i < 11; i++) key('ArrowUp') // walk to the last curated channel
    await settle(600)
    expect(txt('.rd-name')).toBe(CHANNELS[11].name)

    key('ArrowUp') // one more: over the edge
    await settle(600)
    expect(txt('.rd-ch')).toBe('01')
    expect(txt('.rd-name')).toBe(generateChannel(1).name)
    expect(window.location.hash).toBe('#/c/inf-1')
    expect(canvasIsDrawing()).toBe(true)
  })

  it('deep links boot straight to a generated channel', async () => {
    window.history.replaceState(null, '', '#/c/inf-42')
    await mountApp()
    expect(txt('.rd-name')).toBe(generateChannel(42).name)
    click($('.power-big'))
    await settle(150)
    expect(canvasIsDrawing()).toBe(true)
    expect(window.location.hash).toBe('#/c/inf-42')
  })

  it('favorites work on generated channels', async () => {
    await mountApp()
    click($('.power-big'))
    await settle(60)

    key('6'); key('0'); key('Enter')
    await settle(600)
    expect(txt('.rd-name')).toBe(generateChannel(60).name)

    click($('.btn-fav'))
    await settle(100)
    expect(txt('.toast')).toContain(generateChannel(60).name)
    expect($('.btn-fav')?.className).toContain('fav-on')
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    expect(saved.favorites).toContain('inf-60')
  })

  it('guide: search and category filters combine, selecting tunes the TV', async () => {
    await mountApp()
    key('g')
    await settle(30)
    expect($$('.guide-row').length).toBe(CHANNELS.length)

    // search alone
    const input = $('.guide-search input') as HTMLInputElement
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, 'value',
    )!.set!
    act(() => {
      setValue.call(input, 'robot')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await settle(30)
    expect($$('.guide-row').length).toBe(1)
    expect(txt('.guide-row')).toContain('Robot Kitchen')

    // category filter combined with search narrows further
    const chips = $$('.cat-chip')
    const newsChip = chips.find((c) => c.textContent === 'News')!
    act(() => {
      newsChip.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await settle(30)
    expect($$('.guide-row').length).toBe(0) // "robot" + News → nothing
    expect($('.guide-empty')).toBeTruthy()

    // clear search, News filter shows exactly the news channel
    act(() => {
      setValue.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await settle(30)
    expect($$('.guide-row').length).toBe(1)
    expect(txt('.guide-row')).toContain('Galactic News 404')

    // select it
    click($('.guide-row'))
    await settle(60)
    expect(txt('.rd-name')).toBe('Galactic News 404')
  })

  it('guide hints at the infinite dial and its try-button tunes the void', async () => {
    await mountApp()
    click($('.power-big'))
    await settle(60)
    key('g')
    await settle(30)

    expect($('.guide-more')?.textContent).toContain('infinitely many')
    expect($$('.guide-row').length).toBe(CHANNELS.length) // the hint is not a row

    click($('.gm-try'))
    await settle(600)
    expect(txt('.rd-name')).toBe(generateChannel(100).name)
    expect(window.location.hash).toBe('#/c/inf-100')
  })

  it('favorites and volume persist across remounts', async () => {
    await mountApp()
    click($('.btn-fav'))
    await settle(30)
    click($$('.btn-vol')[0]) // VOL +
    await settle(30)

    const stored = JSON.parse(localStorage.getItem(PREFS_KEY)!)
    expect(stored.favorites).toEqual([CHANNELS[0].id])
    expect(stored.volume).toBeCloseTo(0.8, 5)

    // remount
    await act(async () => {
      root.unmount()
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await mountApp()

    expect($('.btn-fav')?.textContent).toBe('★')
    expect(txt('.rd-sub')).toContain('VOL 80%')
  })

  it('deep link selects the channel from the URL hash', async () => {
    window.history.replaceState(null, '', '#/c/strange-signals')
    await mountApp()
    expect(txt('.rd-name')).toBe('Strange Signals')
    expect(txt('.rd-ch')).toBe('64')
  })

  it('reset preferences restores defaults', async () => {
    await mountApp()
    click($('.btn-fav'))
    await settle(20)
    expect(JSON.parse(localStorage.getItem(PREFS_KEY)!).favorites.length).toBe(1)

    click($$('.remote-utility .btn')[3]) // ⚙ settings
    await settle(20)
    const resetBtn = $$('.set-row').find((b) => b.textContent?.includes('Reset'))!
    click(resetBtn)
    await settle(20)

    const stored = JSON.parse(localStorage.getItem(PREFS_KEY)!)
    expect(stored.favorites).toEqual([])
  })

  it('typing in the guide search is not intercepted by keyboard shortcuts', async () => {
    await mountApp()
    key('g')
    await settle(30)
    const input = $('.guide-search input') as HTMLInputElement
    input.focus()
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'm', bubbles: true }),
      )
    })
    await settle(20)
    // mute shortcut must NOT have fired while focused in the input
    expect(txt('.rd-sub')).not.toContain('MUTED')
  })

  it('reduced motion setting applies to the TV frame', async () => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ reducedMotion: true, lastChannel: 'deep-space-radio' }),
    )
    await mountApp()
    click($('.power-big'))
    await settle(150)
    expect($('.tv-frame')?.className).toContain('reduced')
    expect(canvasIsDrawing()).toBe(true)
  })
})
