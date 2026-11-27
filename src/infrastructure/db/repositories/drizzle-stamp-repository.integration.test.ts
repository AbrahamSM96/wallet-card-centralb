import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { DrizzleStampRepository } from './drizzle-stamp-repository'

const integrationTest = process.env.DATABASE_URL ? it : it.skip

describe('DrizzleStampRepository integration', () => {
  integrationTest(
    'translates a wrapped duplicate-order constraint error',
    async () => {
      const { closeDatabase, db } = await import('@/infrastructure/db/client')
      const { cards, customers, stamps } =
        await import('@/infrastructure/db/schema')
      const suffix = randomUUID()
      const customerRows = await db
        .insert(customers)
        .values({
          birthday: '1990-01-01',
          email: `${suffix}@integration.test`,
          name: 'Integration Test',
          phone: suffix,
          privacyAcceptedAt: null,
        })
        .returning({ id: customers.id })
      const customer = customerRows[0]
      const cardRows = await db
        .insert(cards)
        .values({
          customerId: customer.id,
          publicCode: `CB-${suffix.slice(0, 4).toUpperCase()}`,
        })
        .returning({ id: cards.id })
      const card = cardRows[0]
      const repository = new DrizzleStampRepository(db)
      const orderNumber = `INTEGRATION-${suffix}`
      const stamp = {
        cardId: card.id,
        createdAt: new Date(),
        createdByAdminId: null,
        note: null,
        orderNumber,
        source: 'order' as const,
      }

      try {
        await repository.create(stamp)
        await expect(repository.create(stamp)).rejects.toMatchObject({
          code: 'DUPLICATE_ORDER',
        })
      } finally {
        await db.delete(stamps).where(eq(stamps.cardId, card.id))
        await db.delete(cards).where(eq(cards.id, card.id))
        await db.delete(customers).where(eq(customers.id, customer.id))
        await closeDatabase()
      }
    }
  )
})
