import type {
  NewReferral,
  ReferralRepository,
} from '@/domain/loyalty/repositories'
import type { PendingReferral } from '@/domain/loyalty/types'
import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { referrals } from '@/infrastructure/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

/** Coordinates pending referral rewards through row-level locks. */
export class DrizzleReferralRepository implements ReferralRepository {
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
   * Persists the relationship between referrer and referred customer.
   *
   * @param input - New referral values.
   */
  async create(input: NewReferral): Promise<void> {
    await this.#database.insert(referrals).values(input)
  }

  /**
   * Locks an unrewarded referral for the referred customer.
   *
   * @param customerId - Referred customer identifier.
   */
  async findPendingByReferredCustomerForUpdate(
    customerId: string
  ): Promise<PendingReferral | null> {
    const rows = await this.#database
      .select({
        id: referrals.id,
        referrerCardId: referrals.referrerCardId,
      })
      .from(referrals)
      .where(
        and(
          eq(referrals.referredCustomerId, customerId),
          isNull(referrals.rewardedAt)
        )
      )
      .limit(1)
      .for('update')
    return rows[0] ?? null
  }

  /**
   * Resolves a referral as rewarded or intentionally skipped.
   *
   * @param referralId - Referral identifier.
   * @param rewardedAt - Reward time.
   * @param rewardSkippedReason - Audit reason when no bonus was awarded.
   */
  async resolve(
    referralId: string,
    rewardedAt: Date,
    rewardSkippedReason: string | null
  ): Promise<boolean> {
    const rows = await this.#database
      .update(referrals)
      .set({ rewardSkippedReason, rewardedAt })
      .where(and(eq(referrals.id, referralId), isNull(referrals.rewardedAt)))
      .returning({ id: referrals.id })
    return rows.length > 0
  }
}
