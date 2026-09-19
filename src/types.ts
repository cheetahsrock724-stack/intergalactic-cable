/**
 * Core shared types for Intergalactic Cable.
 * Content data (channels, segments, beats) is kept separate from UI logic;
 * renderers receive a FrameInfo describing exactly where the simulated
 * broadcast currently is.
 */

export type CategoryId =
  | 'news'
  | 'shopping'
  | 'weather'
  | 'nature'
  | 'court'
  | 'cooking'
  | 'sports'
  | 'ads'
  | 'music'
  | 'documentary'
  | 'mystery'
  | 'community'

export interface Category {
  id: CategoryId
  label: string
}

/** A timed caption/event inside a segment. */
export interface Beat {
  /** Seconds from the start of the segment. */
  t: number
  /** Caption/dialogue text shown on screen. */
  caption: string
  /** Optional speaker name shown before the caption. */
  speaker?: string
  /** Optional sound effect triggered when the beat starts. */
  sfx?: SfxName
}

/** One authored program segment (a "scene block") on a channel. */
export interface Segment {
  id: string
  title: string
  /** Duration in seconds. */
  duration: number
  /** Timed captions/events, sorted by t, first beat at t=0. */
  beats: Beat[]
}

export type SfxName =
  | 'blip'
  | 'zap'
  | 'whoosh'
  | 'chime'
  | 'thud'
  | 'sparkle'
  | 'beep'
  | 'warble'
  | 'staticBurst'
  | 'gavel'
  | 'cash'
  | 'crowd'
  | 'bubble'

export type MusicStyle =
  | 'news'
  | 'shopping'
  | 'weather'
  | 'nature'
  | 'court'
  | 'kitchen'
  | 'sports'
  | 'ads'
  | 'ambient'
  | 'mystery'
  | 'public'
  | 'documentary'

export interface ChannelMeta {
  id: string
  slug: string
  number: number
  name: string
  /** Short badge shown in the channel bug and guide (<= 6 chars). */
  logoText: string
  tagline: string
  category: CategoryId
  accent: string
  accent2: string
  segments: Segment[]
  music: MusicStyle
  /**
   * For procedurally generated channels: the id of the curated channel whose
   * visual style + music bed this channel borrows. Undefined for curated
   * channels (they are their own template).
   */
  derivedFrom?: string
}

/** Everything a renderer needs for one frame. All values are derived from
 *  the deterministic schedule + wall clock, never from renderer state. */
export interface FrameInfo {
  w: number
  h: number
  /** Seconds since the start of the current segment. */
  t: number
  segIndex: number
  segment: Segment
  beatIndex: number
  beat: Beat
  /** Seconds since the current beat started. */
  beatT: number
  /** Seconds since the start of this channel's current loop. */
  loopT: number
  /** Which repetition of the program loop we're in (0,1,2,...). */
  cycle: number
  /** Stable seed for the current segment + cycle (for content variation). */
  seed: number
  /** Seconds since app start — for idle animations. */
  now: number
  reduced: boolean
  channel: ChannelMeta
}

export type ChannelRenderer = (
  ctx: CanvasRenderingContext2D,
  f: FrameInfo,
) => void

/** Draws the station logo inside the scene. */
export type LogoRenderer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  t: number,
) => void

export interface ChannelVisual {
  render: ChannelRenderer
  logo: LogoRenderer
}
