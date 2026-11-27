import { ClaimTokenManager } from './claim-token-manager'
import { LoyaltyError } from './errors'
import { normalizeOrderNumber } from './order-number'
import { PublicCodeGenerator } from './public-code-generator'
import type {
  LoyaltyRepositories,
  LoyaltyUnitOfWork,
  NewCustomer,
  NewStamp,
} from './repositories'
import type { Card, CardPlatform } from './types'
import type {
  LoyaltyLogger,
  PostCommitScheduler,
  WalletNotification,
  WalletSync,
} from './wallet-provider'

const PUBLIC_CODE_ATTEMPTS = 20
const APPLE_DEVICE_FLAG_THRESHOLD = 2

export type AddStampInput = {
  adminId: string
  cardId: string
  note?: string
  orderNumber?: string
  source: 'manual' | 'order'
}

export type AddStampResult = {
  referralBonusCardId: string | null
  stampCount: number
}

export type ClaimCardInput = {
  platform: CardPlatform
  privacyAccepted?: boolean
  token: string
}

export type ClaimContext = {
  cardId: string
  privacyRequired: boolean
}

export type IssueCardInput = {
  claimExpiresAt: Date
  customerId: string
}

export type IssueCardResult = {
  card: Card
  claimToken: string
}

export type RegisterCustomerInput = NewCustomer & {
  claimExpiresAt: Date
}

export type RegisterCustomerResult = IssueCardResult & {
  customerId: string
}

export type RegisterReferralInput = RegisterCustomerInput & {
  referrerPublicCode: string
}

export type ReissueClaimTokenInput = {
  cardId: string
  claimExpiresAt: Date
  resetClaim?: boolean
}

export type RedeemRewardInput = {
  adminId: string
  cardId: string
}

export type RedeemRewardResult = {
  stampsUsed: number
}

export type RegisterAppleDeviceInput = {
  cardId: string
  deviceLibraryId: string
  pushToken: string
}

export type RegisterAppleDeviceResult = {
  created: boolean
  flagged: boolean
}

type LoyaltyServiceDependencies = {
  claimTokens: ClaimTokenManager
  logger?: LoyaltyLogger
  publicCodes: PublicCodeGenerator
  scheduler?: PostCommitScheduler
  unitOfWork: LoyaltyUnitOfWork
  walletSync?: WalletSync
}

/** Facade for card issuance, stamping, referrals, claims, and redemptions. */
export class LoyaltyService {
  readonly #claimTokens: ClaimTokenManager
  readonly #logger: LoyaltyLogger | null
  readonly #publicCodes: PublicCodeGenerator
  readonly #scheduler: PostCommitScheduler
  readonly #unitOfWork: LoyaltyUnitOfWork
  readonly #walletSync: WalletSync | null

  /**
   * Creates the loyalty facade with replaceable domain and persistence ports.
   *
   * @param dependencies - Collaborators used by all loyalty operations.
   * @param dependencies.claimTokens - Opaque token generator and hasher.
   * @param dependencies.logger - Optional non-throwing application logger.
   * @param dependencies.publicCodes - Short public-code generator.
   * @param dependencies.scheduler - Post-commit task scheduler.
   * @param dependencies.unitOfWork - Transaction boundary and repositories.
   * @param dependencies.walletSync - Optional post-commit wallet synchronizer.
   */
  constructor({
    claimTokens,
    logger,
    publicCodes,
    scheduler,
    unitOfWork,
    walletSync,
  }: LoyaltyServiceDependencies) {
    this.#claimTokens = claimTokens
    this.#logger = logger ?? null
    this.#publicCodes = publicCodes
    this.#scheduler = scheduler ?? runTaskImmediately
    this.#unitOfWork = unitOfWork
    this.#walletSync = walletSync ?? null
  }

  /**
   * Adds a ledger entry and awards the first-order referral atomically.
   *
   * @param input - Stamp command from the admin panel.
   */
  async addStamp(input: AddStampInput): Promise<AddStampResult> {
    const orderNumber = normalizeOrderNumber(input.orderNumber)
    validateStampInput(input, orderNumber)

    const result = await this.#unitOfWork.runInTransaction(
      async (repositories) => {
        const card = await requireMutableCard(repositories, input.cardId)

        if (
          orderNumber &&
          (await repositories.stamps.isOrderNumberTaken(orderNumber))
        ) {
          throw new LoyaltyError(
            'DUPLICATE_ORDER',
            `Order ${orderNumber} already has a stamp`
          )
        }

        const firstOrder =
          input.source === 'order' &&
          !(await repositories.stamps.hasOrderForCustomer(card.customerId))
        const stamp = createStampInput(input, orderNumber)

        await repositories.stamps.create(stamp)

        const stampCount = card.stampCount + 1
        await repositories.cards.updateStampCount(card.id, stampCount)

        if (!firstOrder) {
          return { referralBonusCardId: null, stampCount }
        }

        const referral =
          await repositories.referrals.findPendingByReferredCustomerForUpdate(
            card.customerId
          )

        if (!referral) return { referralBonusCardId: null, stampCount }

        const originalReferrerCard = await repositories.cards.findByIdForUpdate(
          referral.referrerCardId
        )
        const referrerCard =
          originalReferrerCard?.status === 'voided'
            ? await repositories.cards.findActiveByCustomerForUpdate(
                originalReferrerCard.customerId
              )
            : originalReferrerCard

        if (!referrerCard) {
          await resolveReferral(
            repositories,
            referral.id,
            originalReferrerCard
              ? 'no_active_referrer_card'
              : 'referrer_card_missing'
          )
          return { referralBonusCardId: null, stampCount }
        }

        await repositories.stamps.create({
          cardId: referrerCard.id,
          createdAt: new Date(),
          createdByAdminId: null,
          note: `Referral bonus for customer ${card.customerId}`,
          orderNumber: null,
          source: 'referral_bonus',
        })
        await repositories.cards.updateStampCount(
          referrerCard.id,
          referrerCard.stampCount + 1
        )

        await resolveReferral(repositories, referral.id, null)

        return { referralBonusCardId: referrerCard.id, stampCount }
      }
    )

    await this.#syncWalletAfterCommit(input.cardId)
    if (result.referralBonusCardId) {
      await this.#syncWalletAfterCommit(result.referralBonusCardId, {
        body: 'Ganaste un sello porque tu invitado hizo su primer pedido.',
        header: '¡Sello por referido!',
        id: `referral-${Date.now()}`,
      })
    }
    return result
  }

  /**
   * Claims a card through a valid, unused, non-expired opaque token.
   *
   * @param input - Raw claim token and selected wallet platform.
   */
  async claimCard(input: ClaimCardInput): Promise<void> {
    const tokenHash = await this.#claimTokens.hash(input.token)

    await this.#unitOfWork.runInTransaction(async (repositories) => {
      const claimToken =
        await repositories.claimTokens.findByHashForUpdate(tokenHash)

      if (!claimToken) {
        throw new LoyaltyError('CLAIM_TOKEN_INVALID', 'Claim token is invalid')
      }
      if (claimToken.usedAt) {
        throw new LoyaltyError(
          'CLAIM_TOKEN_USED',
          'Claim token was already used'
        )
      }
      if (claimToken.invalidatedAt) {
        throw new LoyaltyError(
          'CLAIM_TOKEN_INVALIDATED',
          'Claim token was invalidated'
        )
      }

      const claimedAt = new Date()

      if (claimToken.expiresAt <= claimedAt) {
        throw new LoyaltyError('CLAIM_TOKEN_EXPIRED', 'Claim token has expired')
      }

      const card = await requireMutableCard(repositories, claimToken.cardId)
      const privacyAcceptedAt =
        await repositories.customers.getPrivacyAcceptedAt(card.customerId)
      if (!privacyAcceptedAt && input.privacyAccepted !== true) {
        throw new LoyaltyError(
          'PRIVACY_ACCEPTANCE_REQUIRED',
          'Privacy notice acceptance is required before claim'
        )
      }
      if (!privacyAcceptedAt) {
        await repositories.customers.acceptPrivacy(card.customerId, claimedAt)
      }
      await repositories.cards.markClaimed(
        claimToken.cardId,
        claimedAt,
        input.platform
      )
      await repositories.claimTokens.markUsed(claimToken.id, claimedAt)
    })
  }

  /**
   * Resolves a valid claim token to its card without consuming it.
   *
   * @param token - One-time raw claim token.
   */
  async getClaimCardId(token: string): Promise<string> {
    return (await this.getClaimContext(token)).cardId
  }

  /**
   * Resolves a valid claim token and whether privacy consent is still needed.
   *
   * @param token - One-time raw claim token.
   */
  async getClaimContext(token: string): Promise<ClaimContext> {
    const tokenHash = await this.#claimTokens.hash(token)
    return this.#unitOfWork.runInTransaction(async (repositories) => {
      const claimToken =
        await repositories.claimTokens.findByHashForUpdate(tokenHash)
      validateClaimToken(claimToken)
      const card = await requireMutableCard(repositories, claimToken.cardId)
      const privacyAcceptedAt =
        await repositories.customers.getPrivacyAcceptedAt(card.customerId)
      return {
        cardId: claimToken.cardId,
        privacyRequired: privacyAcceptedAt === null,
      }
    })
  }

  /**
   * Issues a new active card and returns its one-time raw claim token.
   *
   * @param input - Customer and claim-token expiration.
   */
  async issueCard(input: IssueCardInput): Promise<IssueCardResult> {
    for (let attempt = 0; attempt < PUBLIC_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await this.#issueCardAttempt(input)
      } catch (error) {
        if (
          !(error instanceof LoyaltyError) ||
          error.code !== 'PUBLIC_CODE_CONFLICT'
        ) {
          throw error
        }
      }
    }

    throw new LoyaltyError(
      'PUBLIC_CODE_EXHAUSTED',
      'Could not allocate a unique public card code'
    )
  }

  /**
   * Marks a flagged card active after administrator review.
   *
   * @param cardId - Card identifier.
   */
  async markCardReviewed(cardId: string): Promise<void> {
    await this.#unitOfWork.runInTransaction(async (repositories) => {
      const card = await requireMutableCard(repositories, cardId)
      if (card.status === 'flagged') {
        await repositories.cards.updateStatus(card.id, 'active')
      }
    })
    await this.#syncWalletAfterCommit(cardId)
  }

  /**
   * Voids a card and invalidates every pending claim token atomically.
   *
   * @param cardId - Card identifier.
   */
  async voidCard(cardId: string): Promise<void> {
    await this.#unitOfWork.runInTransaction(async (repositories) => {
      const card = await requireMutableCard(repositories, cardId)
      const invalidatedAt = new Date()
      await repositories.claimTokens.invalidatePendingForCard(
        card.id,
        invalidatedAt
      )
      await repositories.cards.updateStatus(card.id, 'voided')
    })
    await this.#syncWalletAfterCommit(cardId)
  }

  /**
   * Registers a customer, card, and claim token in one transaction.
   *
   * @param input - Customer identity and claim expiration.
   */
  async registerCustomer(
    input: RegisterCustomerInput
  ): Promise<RegisterCustomerResult> {
    for (let attempt = 0; attempt < PUBLIC_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await this.#registerCustomerAttempt(input)
      } catch (error) {
        if (!isPublicCodeConflict(error)) throw error
      }
    }

    throw publicCodeExhaustedError()
  }

  /**
   * Registers a referred customer and referral relationship atomically.
   *
   * @param input - Referred customer, claim, and referrer public code.
   */
  async registerReferral(
    input: RegisterReferralInput
  ): Promise<RegisterCustomerResult> {
    for (let attempt = 0; attempt < PUBLIC_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await this.#registerReferralAttempt(input)
      } catch (error) {
        if (!isPublicCodeConflict(error)) throw error
      }
    }

    throw publicCodeExhaustedError()
  }

  /**
   * Rotates pending claim tokens and optionally clears wallet claim state.
   *
   * @param input - Card, expiration, and explicit reset choice.
   */
  async reissueClaimToken(input: ReissueClaimTokenInput): Promise<string> {
    const claimToken = this.#claimTokens.generate()
    const tokenHash = await this.#claimTokens.hash(claimToken)

    await this.#unitOfWork.runInTransaction(async (repositories) => {
      await requireMutableCard(repositories, input.cardId)

      const invalidatedAt = new Date()
      await repositories.claimTokens.invalidatePendingForCard(
        input.cardId,
        invalidatedAt
      )
      if (input.resetClaim === true) {
        await repositories.cards.resetClaim(input.cardId)
      }
      await repositories.claimTokens.create({
        cardId: input.cardId,
        expiresAt: input.claimExpiresAt,
        tokenHash,
      })
    })

    return claimToken
  }

  /**
   * Redeems every cached stamp once the configured threshold is reached.
   *
   * @param input - Admin and card identifiers for the redemption.
   */
  async redeemReward(input: RedeemRewardInput): Promise<RedeemRewardResult> {
    const result = await this.#unitOfWork.runInTransaction(
      async (repositories) => {
        const card = await requireMutableCard(repositories, input.cardId)
        const settings = await repositories.settings.get()

        if (!settings) {
          throw new LoyaltyError(
            'SETTINGS_NOT_FOUND',
            'Loyalty settings are missing'
          )
        }
        if (card.stampCount < settings.stampsRequired) {
          throw new LoyaltyError(
            'INSUFFICIENT_STAMPS',
            'Card has not reached the redemption threshold'
          )
        }

        const stampsUsed = settings.stampsRequired
        const stampCount = card.stampCount - stampsUsed

        await repositories.redemptions.create({
          cardId: card.id,
          createdAt: new Date(),
          createdByAdminId: input.adminId,
          stampsUsed,
        })
        await repositories.cards.updateStampCount(card.id, stampCount)

        return { stampsUsed }
      }
    )
    await this.#syncWalletAfterCommit(input.cardId, {
      body: `Canjeaste un premio usando ${result.stampsUsed} sellos.`,
      header: 'Premio canjeado',
      id: `redemption-${Date.now()}`,
    })
    return result
  }

  /**
   * Registers an Apple device and flags a card seen on a second device.
   *
   * @param input - Card, device library identifier, and APNs push token.
   */
  async registerAppleDevice(
    input: RegisterAppleDeviceInput
  ): Promise<RegisterAppleDeviceResult> {
    const result = await this.#unitOfWork.runInTransaction(
      async (repositories) => {
        const card = await requireMutableCard(repositories, input.cardId)
        const deviceIds =
          await repositories.appleRegistrations.listDeviceLibraryIds(card.id)
        const newDevice = !deviceIds.includes(input.deviceLibraryId)
        const exceedsDeviceThreshold =
          newDevice && deviceIds.length >= APPLE_DEVICE_FLAG_THRESHOLD
        const created = await repositories.appleRegistrations.upsert(
          card.id,
          input.deviceLibraryId,
          input.pushToken
        )
        const statusChanged =
          exceedsDeviceThreshold && card.status !== 'flagged'
        if (statusChanged) {
          await repositories.cards.updateStatus(card.id, 'flagged')
        }
        return { created, flagged: statusChanged }
      }
    )
    if (result.flagged) await this.#syncWalletAfterCommit(input.cardId)
    return result
  }

  /**
   * Runs one collision-sensitive card issuance attempt.
   *
   * @param input - Customer and claim-token expiration.
   */
  async #issueCardAttempt(input: IssueCardInput): Promise<IssueCardResult> {
    const publicCode = this.#publicCodes.generate()
    const claimToken = this.#claimTokens.generate()
    const tokenHash = await this.#claimTokens.hash(claimToken)

    return this.#unitOfWork.runInTransaction(async (repositories) => {
      if (await repositories.cards.isPublicCodeTaken(publicCode)) {
        throw new LoyaltyError(
          'PUBLIC_CODE_CONFLICT',
          `Public code ${publicCode} already exists`
        )
      }

      const card = await repositories.cards.create({
        customerId: input.customerId,
        publicCode,
        status: 'active',
      })
      await repositories.claimTokens.create({
        cardId: card.id,
        expiresAt: input.claimExpiresAt,
        tokenHash,
      })

      return { card, claimToken }
    })
  }

  /**
   * Runs one collision-sensitive customer registration attempt.
   *
   * @param input - Customer identity and claim expiration.
   */
  async #registerCustomerAttempt(
    input: RegisterCustomerInput
  ): Promise<RegisterCustomerResult> {
    const publicCode = this.#publicCodes.generate()
    const claimToken = this.#claimTokens.generate()
    const tokenHash = await this.#claimTokens.hash(claimToken)

    return this.#unitOfWork.runInTransaction(async (repositories) => {
      await requireAvailablePublicCode(repositories, publicCode)
      const customer = await repositories.customers.create({
        birthday: input.birthday,
        email: input.email,
        name: input.name,
        phone: input.phone,
        privacyAcceptedAt: input.privacyAcceptedAt,
      })
      const card = await createCardWithClaimToken(repositories, {
        claimExpiresAt: input.claimExpiresAt,
        customerId: customer.id,
        publicCode,
        tokenHash,
      })
      return { card, claimToken, customerId: customer.id }
    })
  }

  /**
   * Runs one collision-sensitive referred-customer registration attempt.
   *
   * @param input - Customer, claim, and referrer values.
   */
  async #registerReferralAttempt(
    input: RegisterReferralInput
  ): Promise<RegisterCustomerResult> {
    const publicCode = this.#publicCodes.generate()
    const claimToken = this.#claimTokens.generate()
    const tokenHash = await this.#claimTokens.hash(claimToken)

    return this.#unitOfWork.runInTransaction(async (repositories) => {
      const referrerCard =
        await repositories.cards.findActiveByPublicCodeForUpdate(
          input.referrerPublicCode
        )
      if (!referrerCard) {
        throw new LoyaltyError(
          'REFERRER_CARD_NOT_FOUND',
          'Referrer card is not active'
        )
      }

      await requireAvailablePublicCode(repositories, publicCode)
      const customer = await repositories.customers.create({
        birthday: input.birthday,
        email: input.email,
        name: input.name,
        phone: input.phone,
        privacyAcceptedAt: input.privacyAcceptedAt,
      })
      const card = await createCardWithClaimToken(repositories, {
        claimExpiresAt: input.claimExpiresAt,
        customerId: customer.id,
        publicCode,
        tokenHash,
      })
      await repositories.referrals.create({
        referredCustomerId: customer.id,
        referrerCardId: referrerCard.id,
      })
      return { card, claimToken, customerId: customer.id }
    })
  }

  /**
   * Updates a wallet after commit while isolating external failures.
   *
   * @param cardId - Card whose wallet object changed.
   * @param notification - Optional message sent after the field update.
   */
  async #syncWalletAfterCommit(
    cardId: string,
    notification?: WalletNotification
  ): Promise<void> {
    if (!this.#walletSync) return

    await this.#scheduler(async () => {
      try {
        await this.#walletSync?.update(cardId)
        if (notification) {
          await this.#walletSync?.notify(cardId, notification)
        }
      } catch (error) {
        this.#logger?.error('Google Wallet post-commit sync failed', error)
      }
    })
  }
}

/**
 * Builds a normalized ledger insert from an admin command.
 *
 * @param input - Validated stamp command.
 * @param orderNumber - Canonical order number or null for a manual stamp.
 */
function createStampInput(
  input: AddStampInput,
  orderNumber: string | null
): NewStamp {
  return {
    cardId: input.cardId,
    createdAt: new Date(),
    createdByAdminId: input.adminId,
    note: input.note ?? null,
    orderNumber,
    source: input.source,
  }
}

/**
 * Loads and validates a card while holding its transaction lock.
 *
 * @param repositories - Repositories scoped to the active transaction.
 * @param cardId - Card identifier to lock.
 */
async function requireMutableCard(
  repositories: LoyaltyRepositories,
  cardId: string
): Promise<Card> {
  const card = await repositories.cards.findByIdForUpdate(cardId)

  if (!card) throw new LoyaltyError('CARD_NOT_FOUND', 'Card does not exist')
  if (card.status === 'voided') {
    throw new LoyaltyError('CARD_VOIDED', 'Voided cards cannot be modified')
  }

  return card
}

/**
 * Enforces source-specific stamp requirements before opening a transaction.
 *
 * @param input - Stamp command to validate.
 * @param orderNumber - Canonical order number.
 */
function validateStampInput(
  input: AddStampInput,
  orderNumber: string | null
): void {
  const hasOrderNumber = orderNumber !== null

  if (input.source === 'order' && !hasOrderNumber) {
    throw new LoyaltyError(
      'INVALID_STAMP',
      'Order stamps require an order number'
    )
  }
  if (input.source === 'manual' && hasOrderNumber) {
    throw new LoyaltyError(
      'INVALID_STAMP',
      'Manual stamps cannot include an order number'
    )
  }
}

type CardWithClaimTokenInput = {
  claimExpiresAt: Date
  customerId: string
  publicCode: string
  tokenHash: string
}

/**
 * Creates a card and its hashed claim token in the current transaction.
 *
 * @param repositories - Repositories scoped to the active transaction.
 * @param input - Card identity and hashed claim-token values.
 */
async function createCardWithClaimToken(
  repositories: LoyaltyRepositories,
  input: CardWithClaimTokenInput
): Promise<Card> {
  const card = await repositories.cards.create({
    customerId: input.customerId,
    publicCode: input.publicCode,
    status: 'active',
  })
  await repositories.claimTokens.create({
    cardId: card.id,
    expiresAt: input.claimExpiresAt,
    tokenHash: input.tokenHash,
  })
  return card
}

/**
 * Reports whether an unknown error is a retryable public-code collision.
 *
 * @param error - Unknown failure from a registration attempt.
 */
function isPublicCodeConflict(error: unknown): boolean {
  return error instanceof LoyaltyError && error.code === 'PUBLIC_CODE_CONFLICT'
}

/** Builds the terminal error raised after repeated public-code collisions. */
function publicCodeExhaustedError(): LoyaltyError {
  return new LoyaltyError(
    'PUBLIC_CODE_EXHAUSTED',
    'Could not allocate a unique public card code'
  )
}

/**
 * Ensures a generated public code is not already present.
 *
 * @param repositories - Repositories scoped to the active transaction.
 * @param publicCode - Candidate code.
 */
async function requireAvailablePublicCode(
  repositories: LoyaltyRepositories,
  publicCode: string
): Promise<void> {
  if (await repositories.cards.isPublicCodeTaken(publicCode)) {
    throw new LoyaltyError(
      'PUBLIC_CODE_CONFLICT',
      `Public code ${publicCode} already exists`
    )
  }
}

/**
 * Marks a pending referral as awarded or intentionally skipped.
 *
 * @param repositories - Repositories scoped to the active transaction.
 * @param referralId - Pending referral identifier.
 * @param rewardSkippedReason - Audit reason, or null when bonus was awarded.
 */
async function resolveReferral(
  repositories: LoyaltyRepositories,
  referralId: string,
  rewardSkippedReason: string | null
): Promise<void> {
  const resolved = await repositories.referrals.resolve(
    referralId,
    new Date(),
    rewardSkippedReason
  )
  if (!resolved) {
    throw new LoyaltyError(
      'INVALID_STAMP',
      'Referral was resolved by another transaction'
    )
  }
}

/**
 * Validates a stored claim token without changing its state.
 *
 * @param claimToken - Stored token record or null.
 */
function validateClaimToken(
  claimToken: Awaited<
    ReturnType<LoyaltyRepositories['claimTokens']['findByHashForUpdate']>
  >
): asserts claimToken is NonNullable<typeof claimToken> {
  if (!claimToken) {
    throw new LoyaltyError('CLAIM_TOKEN_INVALID', 'Claim token is invalid')
  }
  if (claimToken.usedAt) {
    throw new LoyaltyError('CLAIM_TOKEN_USED', 'Claim token was already used')
  }
  if (claimToken.invalidatedAt) {
    throw new LoyaltyError(
      'CLAIM_TOKEN_INVALIDATED',
      'Claim token was invalidated'
    )
  }
  if (claimToken.expiresAt <= new Date()) {
    throw new LoyaltyError('CLAIM_TOKEN_EXPIRED', 'Claim token has expired')
  }
}

/**
 * Executes post-commit work inline when no framework scheduler is injected.
 *
 * @param task - Asynchronous post-commit work.
 */
async function runTaskImmediately(task: () => Promise<void>): Promise<void> {
  await task()
}
