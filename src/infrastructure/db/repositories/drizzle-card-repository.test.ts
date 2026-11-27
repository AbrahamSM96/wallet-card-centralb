import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { describe, expect, it } from 'vitest'

import { DrizzleCardRepository } from './drizzle-card-repository'

describe('DrizzleCardRepository', () => {
  it('translates the active-card unique constraint', async () => {
    const database = {
      insert: () => ({
        values: () => ({
          returning: () =>
            Promise.reject(
              new Error('Failed query: insert into cards', {
                cause: {
                  code: '23505',
                  constraint_name: 'cards_customer_active_unique',
                },
              })
            ),
        }),
      }),
    } as unknown as DatabaseExecutor
    const repository = new DrizzleCardRepository(database)

    await expect(
      repository.create({
        customerId: 'customer',
        publicCode: 'CB-2345',
        status: 'active',
      })
    ).rejects.toMatchObject({ code: 'CUSTOMER_HAS_ACTIVE_CARD' })
  })
})
