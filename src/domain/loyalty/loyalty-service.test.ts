import { describe, expect, it, vi } from 'vitest'

import { ClaimTokenManager } from './claim-token-manager'
import { LoyaltyService } from './loyalty-service'
import { PublicCodeGenerator } from './public-code-generator'
import type {
  LoyaltyRepositories,
  LoyaltyUnitOfWork,
  NewCard,
  NewClaimToken,
  NewRedemption,
  NewStamp,
} from './repositories'
import type { Card, ClaimToken } from './types'

type FakeReferral = {
  id: string
  referredCustomerId: string
  referrerCardId: string
  rewardSkippedReason: string | null
  rewardedAt: Date | null
}

type StoredClaimToken = ClaimToken & {
  tokenHash: string
}

type FakeState = {
  appleRegistrations: Array<{
    cardId: string
    deviceLibraryId: string
    pushToken: string
  }>
  cards: Map<string, Card>
  claimTokens: Map<string, StoredClaimToken>
  privacyAcceptedAt: Map<string, Date | null>
  redemptions: NewRedemption[]
  referrals: FakeReferral[]
  stamps: NewStamp[]
  stampsRequired: number
  transactionCount: number
}

describe('LoyaltyService', () => {
  it('rejects an order number that already has a stamp', async () => {
    const { service, state } = createScenario()
    state.stamps.push({
      cardId: 'referred-card',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      createdByAdminId: 'admin',
      note: null,
      orderNumber: 'ORDER-1',
      source: 'order',
    })

    await expect(
      service.addStamp({
        adminId: 'admin',
        cardId: 'referred-card',
        orderNumber: 'ORDER-1',
        source: 'order',
      })
    ).rejects.toMatchObject({ code: 'DUPLICATE_ORDER' })
    expect(state.cards.get('referred-card')?.stampCount).toBe(0)
  })

  it('normalizes order numbers before duplicate validation', async () => {
    const { service, state } = createScenario()
    state.stamps.push({
      cardId: 'referred-card',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      createdByAdminId: 'admin',
      note: null,
      orderNumber: 'A-12',
      source: 'order',
    })

    await expect(
      service.addStamp({
        adminId: 'admin',
        cardId: 'referred-card',
        orderNumber: ' #a-12 ',
        source: 'order',
      })
    ).rejects.toMatchObject({ code: 'DUPLICATE_ORDER' })
  })

  it('awards one referral bonus only on the first order stamp', async () => {
    const { service, state } = createScenario()

    await service.addStamp({
      adminId: 'admin',
      cardId: 'referred-card',
      source: 'manual',
    })
    expect(state.cards.get('referrer-card')?.stampCount).toBe(0)

    const firstOrder = await service.addStamp({
      adminId: 'admin',
      cardId: 'referred-card',
      orderNumber: 'ORDER-1',
      source: 'order',
    })
    expect(firstOrder.referralBonusCardId).toBe('referrer-card')
    expect(state.cards.get('referrer-card')?.stampCount).toBe(1)

    const secondOrder = await service.addStamp({
      adminId: 'admin',
      cardId: 'referred-card',
      orderNumber: 'ORDER-2',
      source: 'order',
    })
    expect(secondOrder.referralBonusCardId).toBeNull()
    expect(state.cards.get('referrer-card')?.stampCount).toBe(1)
    expect(
      state.stamps.filter((stamp) => stamp.source === 'referral_bonus')
    ).toHaveLength(1)
    expect(state.referrals[0]?.rewardedAt).toBeInstanceOf(Date)
  })

  it('records a redemption and resets the cached stamp count', async () => {
    const { service, state } = createScenario()
    const card = state.cards.get('referred-card') as Card
    card.stampCount = 12
    state.stampsRequired = 10

    const result = await service.redeemReward({
      adminId: 'admin',
      cardId: card.id,
    })

    expect(result.stampsUsed).toBe(10)
    expect(card.stampCount).toBe(2)
    expect(state.redemptions).toEqual([
      expect.objectContaining({ cardId: card.id, stampsUsed: 10 }),
    ])
  })

  it('moves a referral bonus from a voided card to its active replacement', async () => {
    const { service, state } = createScenario()
    const oldCard = state.cards.get('referrer-card') as Card
    oldCard.status = 'voided'
    state.cards.set('replacement-card', {
      claimedAt: null,
      customerId: oldCard.customerId,
      id: 'replacement-card',
      platform: null,
      publicCode: 'CB-NEW2',
      stampCount: 4,
      status: 'active',
    })

    const result = await service.addStamp({
      adminId: 'admin',
      cardId: 'referred-card',
      orderNumber: 'ORDER-1',
      source: 'order',
    })

    expect(result.referralBonusCardId).toBe('replacement-card')
    expect(state.cards.get('replacement-card')?.stampCount).toBe(5)
    expect(state.referrals[0]?.rewardSkippedReason).toBeNull()
  })

  it('keeps the referred stamp when the referrer has no active card', async () => {
    const { service, state } = createScenario()
    const oldCard = state.cards.get('referrer-card') as Card
    oldCard.status = 'voided'

    const result = await service.addStamp({
      adminId: 'admin',
      cardId: 'referred-card',
      orderNumber: 'ORDER-1',
      source: 'order',
    })

    expect(result).toEqual({ referralBonusCardId: null, stampCount: 1 })
    expect(state.cards.get('referred-card')?.stampCount).toBe(1)
    expect(state.referrals[0]?.rewardSkippedReason).toBe(
      'no_active_referrer_card'
    )
  })

  it('rejects a claim token that was already used', async () => {
    const { claimTokenManager, service, state } = createScenario()
    const rawToken = 'used-token'
    const tokenHash = await claimTokenManager.hash(rawToken)
    state.claimTokens.set(tokenHash, {
      cardId: 'referred-card',
      expiresAt: new Date('2099-01-01T00:00:00Z'),
      id: 'used-token-id',
      invalidatedAt: null,
      tokenHash,
      usedAt: new Date('2026-01-01T00:00:00Z'),
    })

    await expect(
      service.claimCard({ platform: 'apple', token: rawToken })
    ).rejects.toMatchObject({ code: 'CLAIM_TOKEN_USED' })
  })

  it('rejects an expired claim token', async () => {
    const { claimTokenManager, service, state } = createScenario()
    const rawToken = 'expired-token'
    const tokenHash = await claimTokenManager.hash(rawToken)
    state.claimTokens.set(tokenHash, {
      cardId: 'referred-card',
      expiresAt: new Date('2000-01-01T00:00:00Z'),
      id: 'expired-token-id',
      invalidatedAt: null,
      tokenHash,
      usedAt: null,
    })

    await expect(
      service.claimCard({ platform: 'google', token: rawToken })
    ).rejects.toMatchObject({ code: 'CLAIM_TOKEN_EXPIRED' })
  })

  it('requires and stores privacy acceptance during claim', async () => {
    const { claimTokenManager, service, state } = createScenario()
    state.privacyAcceptedAt.set('referred-customer', null)
    const rawToken = 'privacy-token'
    const tokenHash = await claimTokenManager.hash(rawToken)
    const storedToken: StoredClaimToken = {
      cardId: 'referred-card',
      expiresAt: new Date('2099-01-01T00:00:00Z'),
      id: 'privacy-token-id',
      invalidatedAt: null,
      tokenHash,
      usedAt: null,
    }
    state.claimTokens.set(tokenHash, storedToken)

    await expect(
      service.claimCard({ platform: 'google', token: rawToken })
    ).rejects.toMatchObject({ code: 'PRIVACY_ACCEPTANCE_REQUIRED' })
    expect(storedToken.usedAt).toBeNull()

    await service.claimCard({
      platform: 'google',
      privacyAccepted: true,
      token: rawToken,
    })
    expect(state.privacyAcceptedAt.get('referred-customer')).toBeInstanceOf(
      Date
    )
    expect(storedToken.usedAt).toBeInstanceOf(Date)
  })

  it('rotates pending claim tokens and resets claim state only on request', async () => {
    const { claimTokenManager, service, state } = createScenario()
    const card = state.cards.get('referred-card') as Card
    card.claimedAt = new Date('2026-01-01T00:00:00Z')
    card.platform = 'apple'
    const oldToken = 'old-pending-token'
    const oldTokenHash = await claimTokenManager.hash(oldToken)
    state.claimTokens.set(oldTokenHash, {
      cardId: card.id,
      expiresAt: new Date('2099-01-01T00:00:00Z'),
      id: 'old-pending-token-id',
      invalidatedAt: null,
      tokenHash: oldTokenHash,
      usedAt: null,
    })

    await service.reissueClaimToken({
      cardId: card.id,
      claimExpiresAt: new Date('2099-02-01T00:00:00Z'),
    })
    expect(state.claimTokens.get(oldTokenHash)?.invalidatedAt).toBeInstanceOf(
      Date
    )
    expect(card.platform).toBe('apple')
    await expect(
      service.claimCard({ platform: 'google', token: oldToken })
    ).rejects.toMatchObject({ code: 'CLAIM_TOKEN_INVALIDATED' })

    await service.reissueClaimToken({
      cardId: card.id,
      claimExpiresAt: new Date('2099-03-01T00:00:00Z'),
      resetClaim: true,
    })
    expect(card.claimedAt).toBeNull()
    expect(card.platform).toBeNull()
  })

  it('issues a readable code and persists only the claim-token hash', async () => {
    const claimTokenManager = new ClaimTokenManager()
    const state = createState()
    const unitOfWork = createFakeUnitOfWork(state)
    const service = new LoyaltyService({
      claimTokens: claimTokenManager,
      publicCodes: new PublicCodeGenerator(() => 0),
      unitOfWork,
    })

    const issued = await service.issueCard({
      claimExpiresAt: new Date('2099-01-01T00:00:00Z'),
      customerId: 'new-customer',
    })
    const tokenHash = await claimTokenManager.hash(issued.claimToken)

    expect(issued.card.publicCode).toBe('CB-2222')
    expect(issued.claimToken).toHaveLength(43)
    expect(state.claimTokens.has(tokenHash)).toBe(true)
    expect(state.claimTokens.has(issued.claimToken)).toBe(false)
    expect(state.transactionCount).toBe(1)
  })

  it('retries issuance when a generated public code is already taken', async () => {
    const state = createState()
    state.cards.set('collision', {
      claimedAt: null,
      customerId: 'existing-customer',
      id: 'collision',
      platform: null,
      publicCode: 'CB-2222',
      stampCount: 0,
      status: 'active',
    })
    const randomValues = [0, 0, 0, 0, 1, 1, 1, 1]
    const service = new LoyaltyService({
      claimTokens: new ClaimTokenManager(),
      publicCodes: new PublicCodeGenerator(() => randomValues.shift() ?? 2),
      unitOfWork: createFakeUnitOfWork(state),
    })

    const issued = await service.issueCard({
      claimExpiresAt: new Date('2099-01-01T00:00:00Z'),
      customerId: 'new-customer',
    })

    expect(issued.card.publicCode).toBe('CB-3333')
    expect(state.transactionCount).toBe(2)
  })

  it('registers a customer, card, and claim token in one transaction', async () => {
    const { service, state } = createScenario()

    const result = await service.registerCustomer({
      birthday: '1990-05-10',
      claimExpiresAt: new Date('2099-01-01T00:00:00Z'),
      email: 'customer@example.com',
      name: 'Customer',
      phone: '7710000000',
      privacyAcceptedAt: null,
    })

    expect(result.card.customerId).toBe(result.customerId)
    expect(state.cards.has(result.card.id)).toBe(true)
    expect(state.claimTokens.size).toBe(1)
    expect(state.transactionCount).toBe(1)
  })

  it('registers a referred customer and relationship in one transaction', async () => {
    const { service, state } = createScenario()

    const result = await service.registerReferral({
      birthday: '1995-08-20',
      claimExpiresAt: new Date('2099-01-01T00:00:00Z'),
      email: 'referred@example.com',
      name: 'Referred Customer',
      phone: '7710000001',
      privacyAcceptedAt: new Date('2026-01-01T00:00:00Z'),
      referrerPublicCode: 'CB-6789',
    })

    expect(state.referrals).toContainEqual(
      expect.objectContaining({
        referredCustomerId: result.customerId,
        referrerCardId: 'referrer-card',
      })
    )
    expect(state.transactionCount).toBe(1)
  })

  it('marks a flagged card active after review', async () => {
    const { service, state } = createScenario()
    const card = state.cards.get('referred-card') as Card
    card.status = 'flagged'

    await service.markCardReviewed(card.id)

    expect(card.status).toBe('active')
  })

  it('voids a card and invalidates its pending claim tokens', async () => {
    const { claimTokenManager, service, state } = createScenario()
    const card = state.cards.get('referred-card') as Card
    const tokenHash = await claimTokenManager.hash('pending-token')
    state.claimTokens.set(tokenHash, {
      cardId: card.id,
      expiresAt: new Date('2099-01-01T00:00:00Z'),
      id: 'pending-token',
      invalidatedAt: null,
      tokenHash,
      usedAt: null,
    })

    await service.voidCard(card.id)

    expect(card.status).toBe('voided')
    expect(state.claimTokens.get(tokenHash)?.invalidatedAt).toBeInstanceOf(Date)
  })

  it('synchronizes the wallet after a card is voided', async () => {
    const state = createState()
    const update = vi.fn().mockResolvedValue(undefined)
    const service = new LoyaltyService({
      claimTokens: new ClaimTokenManager(),
      publicCodes: new PublicCodeGenerator(() => 0),
      unitOfWork: createFakeUnitOfWork(state),
      walletSync: {
        issue: vi.fn(),
        notify: vi.fn(),
        update,
        updateClass: vi.fn(),
      },
    })

    await service.voidCard('referred-card')

    expect(state.cards.get('referred-card')?.status).toBe('voided')
    expect(update).toHaveBeenCalledWith('referred-card')
  })

  it('flags only after more than two distinct Apple devices', async () => {
    const state = createState()
    state.appleRegistrations.push({
      cardId: 'referred-card',
      deviceLibraryId: 'first-device',
      pushToken: 'first-push-token',
    })
    const update = vi.fn().mockResolvedValue(undefined)
    const service = new LoyaltyService({
      claimTokens: new ClaimTokenManager(),
      publicCodes: new PublicCodeGenerator(() => 0),
      unitOfWork: createFakeUnitOfWork(state),
      walletSync: {
        issue: vi.fn(),
        notify: vi.fn(),
        update,
        updateClass: vi.fn(),
      },
    })

    const secondResult = await service.registerAppleDevice({
      cardId: 'referred-card',
      deviceLibraryId: 'second-device',
      pushToken: 'second-push-token',
    })
    expect(secondResult).toEqual({ created: true, flagged: false })
    expect(state.cards.get('referred-card')?.status).toBe('active')
    expect(update).not.toHaveBeenCalled()

    const thirdResult = await service.registerAppleDevice({
      cardId: 'referred-card',
      deviceLibraryId: 'third-device',
      pushToken: 'third-push-token',
    })

    expect(thirdResult).toEqual({ created: true, flagged: true })
    expect(state.cards.get('referred-card')?.status).toBe('flagged')
    expect(update).toHaveBeenCalledWith('referred-card')
  })

  it('does not resynchronize an already flagged card on re-registration', async () => {
    const state = createState()
    const card = state.cards.get('referred-card') as Card
    card.status = 'flagged'
    state.appleRegistrations.push({
      cardId: card.id,
      deviceLibraryId: 'known-device',
      pushToken: 'old-token',
    })
    const update = vi.fn().mockResolvedValue(undefined)
    const service = new LoyaltyService({
      claimTokens: new ClaimTokenManager(),
      publicCodes: new PublicCodeGenerator(() => 0),
      unitOfWork: createFakeUnitOfWork(state),
      walletSync: {
        issue: vi.fn(),
        notify: vi.fn(),
        update,
        updateClass: vi.fn(),
      },
    })

    const result = await service.registerAppleDevice({
      cardId: card.id,
      deviceLibraryId: 'known-device',
      pushToken: 'refreshed-token',
    })

    expect(result).toEqual({ created: false, flagged: false })
    expect(update).not.toHaveBeenCalled()
  })

  it('keeps a committed stamp when wallet synchronization fails', async () => {
    const state = createState()
    const update = vi.fn().mockRejectedValue(new Error('Google unavailable'))
    const logger = { error: vi.fn() }
    const service = new LoyaltyService({
      claimTokens: new ClaimTokenManager(),
      logger,
      publicCodes: new PublicCodeGenerator(() => 0),
      unitOfWork: createFakeUnitOfWork(state),
      walletSync: {
        issue: vi.fn(),
        notify: vi.fn(),
        update,
        updateClass: vi.fn(),
      },
    })

    await expect(
      service.addStamp({
        adminId: 'admin',
        cardId: 'referred-card',
        source: 'manual',
      })
    ).resolves.toMatchObject({ stampCount: 1 })
    expect(state.cards.get('referred-card')?.stampCount).toBe(1)
    expect(update).toHaveBeenCalledWith('referred-card')
    expect(logger.error).toHaveBeenCalledOnce()
  })

  it('keeps a committed stamp when APNs fails', async () => {
    const state = createState()
    const logger = { error: vi.fn() }
    const service = new LoyaltyService({
      claimTokens: new ClaimTokenManager(),
      logger,
      publicCodes: new PublicCodeGenerator(() => 0),
      unitOfWork: createFakeUnitOfWork(state),
      walletSync: {
        issue: vi.fn(),
        notify: vi.fn(),
        update: vi.fn().mockRejectedValue(new Error('APNs unavailable')),
        updateClass: vi.fn(),
      },
    })

    await service.addStamp({
      adminId: 'admin',
      cardId: 'referred-card',
      source: 'manual',
    })

    expect(state.cards.get('referred-card')?.stampCount).toBe(1)
    expect(logger.error).toHaveBeenCalledOnce()
  })

  it('can defer wallet work until after the domain response', async () => {
    const state = createState()
    const tasks: Array<() => Promise<void>> = []
    const update = vi.fn().mockResolvedValue(undefined)
    const service = new LoyaltyService({
      claimTokens: new ClaimTokenManager(),
      publicCodes: new PublicCodeGenerator(() => 0),
      scheduler: (task) => {
        tasks.push(task)
        return Promise.resolve()
      },
      unitOfWork: createFakeUnitOfWork(state),
      walletSync: {
        issue: vi.fn(),
        notify: vi.fn(),
        update,
        updateClass: vi.fn(),
      },
    })

    await service.addStamp({
      adminId: 'admin',
      cardId: 'referred-card',
      source: 'manual',
    })

    expect(state.cards.get('referred-card')?.stampCount).toBe(1)
    expect(update).not.toHaveBeenCalled()
    expect(tasks).toHaveLength(1)
    await tasks[0]?.()
    expect(update).toHaveBeenCalledWith('referred-card')
  })
})

function createScenario(): {
  claimTokenManager: ClaimTokenManager
  service: LoyaltyService
  state: FakeState
} {
  const claimTokenManager = new ClaimTokenManager()
  const state = createState()
  const service = new LoyaltyService({
    claimTokens: claimTokenManager,
    publicCodes: new PublicCodeGenerator(() => 0),
    unitOfWork: createFakeUnitOfWork(state),
  })
  return { claimTokenManager, service, state }
}

function createState(): FakeState {
  return {
    appleRegistrations: [],
    cards: new Map([
      [
        'referred-card',
        {
          claimedAt: null,
          customerId: 'referred-customer',
          id: 'referred-card',
          platform: null,
          publicCode: 'CB-2345',
          stampCount: 0,
          status: 'active',
        },
      ],
      [
        'referrer-card',
        {
          claimedAt: null,
          customerId: 'referrer-customer',
          id: 'referrer-card',
          platform: null,
          publicCode: 'CB-6789',
          stampCount: 0,
          status: 'active',
        },
      ],
    ]),
    claimTokens: new Map(),
    privacyAcceptedAt: new Map([
      ['referred-customer', new Date('2026-01-01T00:00:00Z')],
      ['referrer-customer', new Date('2026-01-01T00:00:00Z')],
    ]),
    redemptions: [],
    referrals: [
      {
        id: 'referral',
        referredCustomerId: 'referred-customer',
        referrerCardId: 'referrer-card',
        rewardSkippedReason: null,
        rewardedAt: null,
      },
    ],
    stamps: [],
    stampsRequired: 10,
    transactionCount: 0,
  }
}

function createFakeUnitOfWork(state: FakeState): LoyaltyUnitOfWork {
  const repositories: LoyaltyRepositories = {
    appleRegistrations: {
      listDeviceLibraryIds: (cardId) =>
        Promise.resolve(
          state.appleRegistrations
            .filter((registration) => registration.cardId === cardId)
            .map((registration) => registration.deviceLibraryId)
        ),
      remove: (cardId, deviceLibraryId) => {
        state.appleRegistrations = state.appleRegistrations.filter(
          (registration) =>
            registration.cardId !== cardId ||
            registration.deviceLibraryId !== deviceLibraryId
        )
        return Promise.resolve()
      },
      upsert: (cardId, deviceLibraryId, pushToken) => {
        const existing = state.appleRegistrations.find(
          (registration) =>
            registration.cardId === cardId &&
            registration.deviceLibraryId === deviceLibraryId
        )
        if (existing) {
          existing.pushToken = pushToken
          return Promise.resolve(false)
        }
        state.appleRegistrations.push({
          cardId,
          deviceLibraryId,
          pushToken,
        })
        return Promise.resolve(true)
      },
    },
    cards: {
      create: (input: NewCard) => {
        const card: Card = {
          claimedAt: null,
          customerId: input.customerId,
          id: `card-${state.cards.size + 1}`,
          platform: null,
          publicCode: input.publicCode,
          stampCount: 0,
          status: input.status,
        }
        state.cards.set(card.id, card)
        return Promise.resolve(card)
      },
      findActiveByCustomerForUpdate: (customerId) =>
        Promise.resolve(
          [...state.cards.values()].find(
            (card) => card.customerId === customerId && card.status !== 'voided'
          ) ?? null
        ),
      findActiveByPublicCodeForUpdate: (publicCode) =>
        Promise.resolve(
          [...state.cards.values()].find(
            (card) => card.publicCode === publicCode && card.status !== 'voided'
          ) ?? null
        ),
      findByIdForUpdate: (cardId: string) =>
        Promise.resolve(state.cards.get(cardId) ?? null),
      isPublicCodeTaken: (publicCode: string) =>
        Promise.resolve(
          [...state.cards.values()].some(
            (card) => card.publicCode === publicCode
          )
        ),
      markClaimed: (cardId, _claimedAt, platform) => {
        const card = state.cards.get(cardId)
        if (card) {
          card.claimedAt = _claimedAt
          card.platform = platform
        }
        return Promise.resolve()
      },
      resetClaim: (cardId) => {
        const card = state.cards.get(cardId)
        if (card) {
          card.claimedAt = null
          card.platform = null
        }
        return Promise.resolve()
      },
      updateStampCount: (cardId, stampCount) => {
        const card = state.cards.get(cardId)
        if (card) card.stampCount = stampCount
        return Promise.resolve()
      },
      updateStatus: (cardId, status) => {
        const card = state.cards.get(cardId)
        if (card) card.status = status
        return Promise.resolve()
      },
    },
    claimTokens: {
      create: (input: NewClaimToken) => {
        state.claimTokens.set(input.tokenHash, {
          cardId: input.cardId,
          expiresAt: input.expiresAt,
          id: `claim-${state.claimTokens.size + 1}`,
          invalidatedAt: null,
          tokenHash: input.tokenHash,
          usedAt: null,
        })
        return Promise.resolve()
      },
      findByHashForUpdate: (tokenHash) =>
        Promise.resolve(state.claimTokens.get(tokenHash) ?? null),
      invalidatePendingForCard: (cardId, invalidatedAt) => {
        for (const claimToken of state.claimTokens.values()) {
          if (
            claimToken.cardId === cardId &&
            !claimToken.invalidatedAt &&
            !claimToken.usedAt
          ) {
            claimToken.invalidatedAt = invalidatedAt
          }
        }
        return Promise.resolve()
      },
      markUsed: (claimTokenId, usedAt) => {
        const claimToken = [...state.claimTokens.values()].find(
          (candidate) => candidate.id === claimTokenId
        )
        if (claimToken) claimToken.usedAt = usedAt
        return Promise.resolve()
      },
    },
    customers: {
      acceptPrivacy: (customerId, acceptedAt) => {
        state.privacyAcceptedAt.set(customerId, acceptedAt)
        return Promise.resolve()
      },
      create: (input) => {
        const id = `customer-${input.phone}-${state.cards.size}`
        state.privacyAcceptedAt.set(id, input.privacyAcceptedAt)
        return Promise.resolve({ id })
      },
      getPrivacyAcceptedAt: (customerId) =>
        Promise.resolve(state.privacyAcceptedAt.get(customerId) ?? null),
    },
    redemptions: {
      create: (input: NewRedemption) => {
        state.redemptions.push(input)
        return Promise.resolve()
      },
    },
    referrals: {
      create: (input) => {
        state.referrals.push({
          id: `referral-${state.referrals.length + 1}`,
          referredCustomerId: input.referredCustomerId,
          referrerCardId: input.referrerCardId,
          rewardSkippedReason: null,
          rewardedAt: null,
        })
        return Promise.resolve()
      },
      findPendingByReferredCustomerForUpdate: (customerId) => {
        const referral = state.referrals.find(
          (candidate) =>
            candidate.referredCustomerId === customerId &&
            candidate.rewardedAt === null
        )
        return Promise.resolve(
          referral
            ? {
                id: referral.id,
                referrerCardId: referral.referrerCardId,
              }
            : null
        )
      },
      resolve: (referralId, rewardedAt, rewardSkippedReason) => {
        const referral = state.referrals.find(
          (candidate) => candidate.id === referralId
        )
        if (!referral || referral.rewardedAt) return Promise.resolve(false)
        referral.rewardSkippedReason = rewardSkippedReason
        referral.rewardedAt = rewardedAt
        return Promise.resolve(true)
      },
    },
    settings: {
      get: () => Promise.resolve({ stampsRequired: state.stampsRequired }),
    },
    stamps: {
      create: (input: NewStamp) => {
        state.stamps.push(input)
        return Promise.resolve()
      },
      hasOrderForCustomer: (customerId) =>
        Promise.resolve(
          state.stamps.some((stamp) => {
            const card = state.cards.get(stamp.cardId)
            return card?.customerId === customerId && stamp.source === 'order'
          })
        ),
      isOrderNumberTaken: (orderNumber) =>
        Promise.resolve(
          state.stamps.some((stamp) => stamp.orderNumber === orderNumber)
        ),
    },
  }

  return {
    runInTransaction: (work) => {
      state.transactionCount += 1
      return work(repositories)
    },
  }
}
