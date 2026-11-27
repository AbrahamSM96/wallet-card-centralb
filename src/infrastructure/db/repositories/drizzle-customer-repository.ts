import { LoyaltyError } from '@/domain/loyalty/errors'
import type {
  CustomerRepository,
  NewCustomer,
} from '@/domain/loyalty/repositories'
import type { Customer } from '@/domain/loyalty/types'
import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { customers } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'

import { isUniqueViolation } from './postgres-error'

/** Persists customer identity and privacy data through Drizzle. */
export class DrizzleCustomerRepository implements CustomerRepository {
  readonly #database: DatabaseExecutor

  /**
   * Creates the repository for one database or transaction executor.
   *
   * @param database - Drizzle executor used by every operation.
   */
  constructor(database: DatabaseExecutor) {
    this.#database = database
  }

  /**
   * Stores privacy acceptance during a public claim.
   *
   * @param customerId - Customer identifier.
   * @param acceptedAt - Acceptance time.
   */
  async acceptPrivacy(customerId: string, acceptedAt: Date): Promise<void> {
    await this.#database
      .update(customers)
      .set({ privacyAcceptedAt: acceptedAt })
      .where(eq(customers.id, customerId))
  }

  /**
   * Creates a customer and translates expected identity conflicts.
   *
   * @param input - Validated customer values.
   */
  async create(input: NewCustomer): Promise<Customer> {
    try {
      const rows = await this.#database
        .insert(customers)
        .values(input)
        .returning({ id: customers.id })
      return rows[0]
    } catch (error) {
      if (
        isUniqueViolation(error, 'customers_email_unique') ||
        isUniqueViolation(error, 'customers_phone_unique')
      ) {
        throw new LoyaltyError(
          'CUSTOMER_ALREADY_EXISTS',
          'A customer with this email or phone already exists'
        )
      }
      throw error
    }
  }

  /**
   * Returns the stored privacy acceptance time.
   *
   * @param customerId - Customer identifier.
   */
  async getPrivacyAcceptedAt(customerId: string): Promise<Date | null> {
    const rows = await this.#database
      .select({ privacyAcceptedAt: customers.privacyAcceptedAt })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)
    return rows[0]?.privacyAcceptedAt ?? null
  }
}
