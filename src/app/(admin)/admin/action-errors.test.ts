import { LoyaltyError } from '@/domain/loyalty/errors'
import { describe, expect, it } from 'vitest'

import { toSpanishActionError } from './action-errors'

describe('toSpanishActionError', () => {
  it('translates duplicate orders', () => {
    expect(
      toSpanishActionError(
        new LoyaltyError('DUPLICATE_ORDER', 'internal message')
      )
    ).toBe('Este pedido ya tiene sello.')
  })

  it('does not expose unexpected errors', () => {
    expect(toSpanishActionError(new Error('database secret'))).toBe(
      'Ocurrió un error. Intenta de nuevo.'
    )
  })
})
