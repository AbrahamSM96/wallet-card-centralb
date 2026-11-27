/**
 * Produces the canonical representation used by validation and persistence.
 *
 * @param value - Raw order number entered by an administrator.
 */
export function normalizeOrderNumber(value: string | undefined): string | null {
  const normalized = value?.trim().replace(/^#\s*/, '').trim().toUpperCase()
  return normalized || null
}
