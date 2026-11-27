import type {
  LoyaltyRepositories,
  LoyaltyUnitOfWork,
} from '@/domain/loyalty/repositories'
import { db } from '@/infrastructure/db/client'

import { DrizzleAppleRegistrationRepository } from './drizzle-apple-registration-repository'
import { DrizzleCardRepository } from './drizzle-card-repository'
import { DrizzleClaimTokenRepository } from './drizzle-claim-token-repository'
import { DrizzleCustomerRepository } from './drizzle-customer-repository'
import { DrizzleRedemptionRepository } from './drizzle-redemption-repository'
import { DrizzleReferralRepository } from './drizzle-referral-repository'
import { DrizzleSettingsRepository } from './drizzle-settings-repository'
import { DrizzleStampRepository } from './drizzle-stamp-repository'

/** Supplies transaction-scoped Drizzle repositories to the loyalty domain. */
export class DrizzleLoyaltyUnitOfWork implements LoyaltyUnitOfWork {
  readonly #database: typeof db

  /**
   * Creates a unit of work around the application database singleton.
   *
   * @param database - Drizzle database client that opens transactions.
   */
  constructor(database: typeof db = db) {
    this.#database = database
  }

  /**
   * Runs all repository work in one PostgreSQL transaction.
   *
   * @param work - Domain orchestration using transaction-scoped repositories.
   */
  async runInTransaction<T>(
    work: (repositories: LoyaltyRepositories) => Promise<T>
  ): Promise<T> {
    return this.#database.transaction(async (transaction) => {
      const repositories: LoyaltyRepositories = {
        appleRegistrations: new DrizzleAppleRegistrationRepository(transaction),
        cards: new DrizzleCardRepository(transaction),
        claimTokens: new DrizzleClaimTokenRepository(transaction),
        customers: new DrizzleCustomerRepository(transaction),
        redemptions: new DrizzleRedemptionRepository(transaction),
        referrals: new DrizzleReferralRepository(transaction),
        settings: new DrizzleSettingsRepository(transaction),
        stamps: new DrizzleStampRepository(transaction),
      }
      return work(repositories)
    })
  }
}
