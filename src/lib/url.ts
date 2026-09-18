/**
 * Hash-based routing so deep links survive refresh on GitHub Pages without
 * any server rewrites. Format:  #/c/<channel-slug>
 */

export function channelHash(slug: string): string {
  return `#/c/${encodeURIComponent(slug)}`
}

/** Parse a slug out of a location hash. Returns null for anything else. */
export function parseChannelSlug(hash: string): string | null {
  const m = /^#\/c\/([^/?#]+)/.exec(hash)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return null
  }
}

/** Build a shareable absolute URL for a channel. */
export function shareUrl(slug: string, base: string = window.location.href): string {
  const url = new URL(base)
  url.hash = `/c/${encodeURIComponent(slug)}`
  return url.toString()
}
