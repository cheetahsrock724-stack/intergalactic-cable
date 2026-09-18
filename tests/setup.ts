/**
 * Vitest (jsdom) setup: bridge @napi-rs/canvas (Skia) into the DOM so the
 * real renderers rasterize actual pixels during tests.
 *
 * - HTMLCanvasElement.getContext('2d') returns a Skia-backed 2D context.
 * - The Skia context prototype learns to accept DOM canvas elements in
 *   createPattern/drawImage (draw.ts builds noise tiles via createElement).
 * - Elements report a non-zero layout size (jsdom has no layout engine).
 */

import { createCanvas, type Canvas } from '@napi-rs/canvas'

const backing = new WeakMap<HTMLCanvasElement, Canvas>()

function getBacking(el: HTMLCanvasElement): Canvas {
  let c = backing.get(el)
  const w = el.width || 300
  const h = el.height || 150
  if (!c) {
    c = createCanvas(w, h)
    backing.set(el, c)
  } else if (c.width !== w || c.height !== h) {
    c.width = w
    c.height = h
  }
  return c
}

// Teach every Skia context to unwrap DOM canvas arguments.
type AnyFn = (...args: unknown[]) => unknown
const sampleCtx = createCanvas(1, 1).getContext('2d') as unknown as Record<string, AnyFn>
const NapiCtxProto = Object.getPrototypeOf(sampleCtx) as Record<string, AnyFn>
for (const method of ['createPattern', 'drawImage']) {
  const orig = NapiCtxProto[method]
  if (typeof orig !== 'function') continue
  NapiCtxProto[method] = function patchedMethod(this: unknown, ...args: unknown[]) {
    if (args[0] instanceof HTMLCanvasElement) args[0] = getBacking(args[0])
    return orig.apply(this, args)
  }
}

const proto = HTMLCanvasElement.prototype as HTMLCanvasElement & {
  getContext: (type: string) => unknown
}
const origGetContext = proto.getContext.bind(proto)
proto.getContext = function patched(this: HTMLCanvasElement, type: string) {
  if (type === '2d') return getBacking(this).getContext('2d')
  return origGetContext(type)
} as HTMLCanvasElement['getContext']

// jsdom has no layout: give elements a usable size so the render loop works.
const elProto = HTMLElement.prototype
Object.defineProperty(elProto, 'clientWidth', { configurable: true, get: () => 640 })
Object.defineProperty(elProto, 'clientHeight', { configurable: true, get: () => 360 })

// React 18 act() environment flag
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
