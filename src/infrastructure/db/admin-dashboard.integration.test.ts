import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

const integrationTest = process.env.DATABASE_URL ? it : it.skip

describe('admin customer search integration', () => {
  integrationTest(
    'finds a canonical phone from human-formatted digits',
    async () => {
      const { searchCustomers } = await import('./admin-dashboard')
      const { closeDatabase, db } = await import('./client')
      const { customers } = await import('./schema')
      const { formatMexicanPhone } = await import('@/lib/claim-delivery')
      const suffix = randomUUID()
      const phone = `+52771${Date.now().toString().slice(-7)}`
      const rows = await db
        .insert(customers)
        .values({
          birthday: '1990-01-01',
          email: `${suffix}@search.integration.test`,
          name: `Search ${suffix}`,
          phone,
          privacyAcceptedAt: null,
        })
        .returning({ id: customers.id })
      const customer = rows[0]

      try {
        const results = await searchCustomers(formatMexicanPhone(phone))
        expect(results.some((result) => result.id === customer.id)).toBe(true)
      } finally {
        await db.delete(customers).where(eq(customers.id, customer.id))
        await closeDatabase()
      }
    }
  )
})
