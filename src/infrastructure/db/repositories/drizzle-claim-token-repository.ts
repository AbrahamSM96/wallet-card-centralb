import type {
  ClaimTokenRepository,
  NewClaimToken,
} from '@/domain/loyalty/repositories'
import type { ClaimToken } from '@/domain/loyalty/types'
import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { claimTokens } from '@/infrastructure/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

/** Persists one-time claim tokens without exposing their raw values. */
export class DrizzleClaimTokenRepository implements ClaimTokenRepository {
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
   * Persists a hashed claim token.
   *
   * @param input - Hashed token values.
   */
  async create(input: NewClaimToken): Promise<void> {
    await this.#database.insert(claimTokens).values(input)
  }

  /**
   * Locks and returns a claim token by its digest.
   *
   * @param tokenHash - SHA-256 token digest.
   */
  async findByHashForUpdate(tokenHash: string): Promise<ClaimToken | null> {
    const rows = await this.#database
      .select()
      .from(claimTokens)
      .where(eq(claimTokens.tokenHash, tokenHash))
      .limit(1)
      .for('update')
    const token = rows[0]

    return token
      ? {
          cardId: token.cardId,
          expiresAt: token.expiresAt,
          id: token.id,
          invalidatedAt: token.invalidatedAt,
          usedAt: token.usedAt,
        }
      : null
  }

  /**
   * Invalidates every pending token for a card before issuing a replacement.
   *
   * @param cardId - Card identifier.
   * @param invalidatedAt - Invalidation time.
   */
  async invalidatePendingForCard(
    cardId: string,
    invalidatedAt: Date
  ): Promise<void> {
    await this.#database
      .update(claimTokens)
      .set({ invalidatedAt })
      .where(
        and(
          eq(claimTokens.cardId, cardId),
          isNull(claimTokens.invalidatedAt),
          isNull(claimTokens.usedAt)
        )
      )
  }

  /**
   * Marks a claim token as consumed.
   *
   * @param claimTokenId - Claim token identifier.
   * @param usedAt - Consumption time.
   */
  async markUsed(claimTokenId: string, usedAt: Date): Promise<void> {
    await this.#database
      .update(claimTokens)
      .set({ usedAt })
      .where(eq(claimTokens.id, claimTokenId))
  }
}
