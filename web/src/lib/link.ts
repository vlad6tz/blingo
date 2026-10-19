import type { ParsedLink } from "../types/type";

export function buildShareLink(id: string, key: string): string {
  return `${location.origin}/d/${encodeURIComponent(id)}#${key}`
}

export function parseShareLink(href: string): ParsedLink | null {
  const url = new URL(href, location.origin)
  const id = /^\/d\/([^/]+)$/.exec(url.pathname)?.[1]
  const key = url.hash.slice(1)
  if (!id || !/^[A-Za-z0-9_-]{43}$/.test(key)) return null
  return { id, key }
}
