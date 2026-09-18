import { describe, expect, it } from 'vitest'
import { channelHash, parseChannelSlug, shareUrl } from '../src/lib/url'
import { CHANNELS } from '../src/data/channels'

describe('url routing', () => {
  it('round-trips every channel slug', () => {
    for (const c of CHANNELS) {
      expect(parseChannelSlug(channelHash(c.slug))).toBe(c.slug)
    }
  })

  it('parses a plain hash', () => {
    expect(parseChannelSlug('#/c/space-court')).toBe('space-court')
  })

  it('returns null for unrelated hashes', () => {
    expect(parseChannelSlug('')).toBeNull()
    expect(parseChannelSlug('#')).toBeNull()
    expect(parseChannelSlug('#/guide')).toBeNull()
    expect(parseChannelSlug('#/c/')).toBeNull()
  })

  it('decodes percent-encoded slugs', () => {
    expect(parseChannelSlug('#/c/deep%20space')).toBe('deep space')
  })

  it('survives malformed percent-encoding', () => {
    expect(parseChannelSlug('#/c/%zz')).toBeNull()
  })

  it('builds a share URL with the channel hash', () => {
    const url = shareUrl('void-weather', 'https://example.github.io/intergalactic-cable/')
    expect(url).toBe('https://example.github.io/intergalactic-cable/#/c/void-weather')
  })

  it('share URL keeps the repo subpath', () => {
    const url = shareUrl('strange-signals', 'https://user.github.io/intergalactic-cable/index.html')
    expect(url.startsWith('https://user.github.io/intergalactic-cable/')).toBe(true)
    expect(url.endsWith('#/c/strange-signals')).toBe(true)
  })
})
