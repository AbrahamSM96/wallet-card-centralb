import { describe, expect, it } from 'vitest'

import { normalizeCustomerSearch } from './customer-search'

describe('normalizeCustomerSearch', () => {
  it('extracts digits from a human-formatted phone', () => {
    expect(normalizeCustomerSearch('771 555-0199')).toEqual({
      escapedQuery: '771 555-0199',
      phoneDigits: '7715550199',
    })
  })

  it('escapes LIKE wildcards and backslashes', () => {
    expect(normalizeCustomerSearch('Ana_100%\\')).toEqual({
      escapedQuery: 'Ana\\_100\\%\\\\',
      phoneDigits: null,
    })
  })
})
