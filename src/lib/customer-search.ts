export type NormalizedCustomerSearch = {
  escapedQuery: string
  phoneDigits: string | null
}

/**
 * Escapes SQL LIKE wildcards and extracts a searchable phone fragment.
 *
 * @param query - Untrusted customer search text.
 */
export function normalizeCustomerSearch(
  query: string
): NormalizedCustomerSearch {
  const trimmedQuery = query.trim()
  const escapedQuery = trimmedQuery.replace(/[\\%_]/g, '\\$&')
  const digits = trimmedQuery.replace(/\D/g, '')
  return {
    escapedQuery,
    phoneDigits: digits.length >= 4 ? digits : null,
  }
}
