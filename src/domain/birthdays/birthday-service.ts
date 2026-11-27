import type { LoyaltyLogger } from '@/domain/loyalty/wallet-provider'

import {
  getMexicoCityDate,
  hasBirthdayPromotionExpired,
  isBirthdayOnDate,
  isBirthdayPromotionActive,
} from './birthday-date'

export type BirthdayCard = {
  birthday: string
  cardId: string
  customerId: string
}

export type BirthdayCleanup = BirthdayCard & {
  notificationId: string
  notificationYear: number
}

export type BirthdayPendingNotification = BirthdayCard & {
  notificationYear: number
}

export interface BirthdayRepository {
  getBirthdayPromoText(): Promise<string>
  listClaimedCards(): Promise<BirthdayCard[]>
  listPendingCleanup(): Promise<BirthdayCleanup[]>
  listPendingNotifications(): Promise<BirthdayPendingNotification[]>
  markCleared(notificationId: string, clearedAt: Date): Promise<void>
  markNotified(
    customerId: string,
    year: number,
    notifiedAt: Date
  ): Promise<void>
  reserve(customerId: string, year: number, attemptedAt: Date): Promise<boolean>
}

export interface BirthdayNotifier {
  clear(cardId: string): Promise<void>
  notify(cardId: string, message: string, year: number): Promise<void>
}

export type BirthdayRunResult = {
  cleared: number
  failed: number
  notified: number
}

type NotificationAttemptResult = 'failed' | 'notified' | 'skipped'

type BirthdayServiceDependencies = {
  logger?: LoyaltyLogger
  notifier: BirthdayNotifier
  repository: BirthdayRepository
}

/** Coordinates idempotent birthday reservations, notifications, and cleanup. */
export class BirthdayService {
  readonly #logger: LoyaltyLogger | null
  readonly #notifier: BirthdayNotifier
  readonly #repository: BirthdayRepository

  /**
   * Creates the birthday application service.
   *
   * @param dependencies - Repository, notifier, and optional logger.
   * @param dependencies.logger - Recoverable failure logger.
   * @param dependencies.notifier - Wallet notification gateway.
   * @param dependencies.repository - Birthday persistence port.
   */
  constructor({ logger, notifier, repository }: BirthdayServiceDependencies) {
    this.#logger = logger ?? null
    this.#notifier = notifier
    this.#repository = repository
  }

  /**
   * Runs one birthday notification and cleanup cycle.
   *
   * @param now - Absolute current instant.
   */
  async run(now: Date): Promise<BirthdayRunResult> {
    const today = getMexicoCityDate(now)
    const promoText = await this.#repository.getBirthdayPromoText()
    const cards = await this.#repository.listClaimedCards()
    let failed = 0
    let notified = 0

    const pendingNotifications =
      await this.#repository.listPendingNotifications()
    for (const pending of pendingNotifications) {
      if (
        !isBirthdayPromotionActive(
          pending.birthday,
          pending.notificationYear,
          today
        )
      ) {
        continue
      }
      const attempt = await this.#attemptNotification(
        pending,
        pending.notificationYear,
        promoText,
        now
      )
      if (attempt === 'notified') notified += 1
      if (attempt === 'failed') failed += 1
    }

    for (const card of cards) {
      if (!isBirthdayOnDate(card.birthday, today)) continue
      const attempt = await this.#attemptNotification(
        card,
        today.year,
        promoText,
        now
      )
      if (attempt === 'notified') notified += 1
      if (attempt === 'failed') failed += 1
    }

    let cleared = 0
    const cleanupCandidates = await this.#repository.listPendingCleanup()
    for (const candidate of cleanupCandidates) {
      if (
        !hasBirthdayPromotionExpired(
          candidate.birthday,
          candidate.notificationYear,
          today
        )
      ) {
        continue
      }

      try {
        await this.#notifier.clear(candidate.cardId)
        await this.#repository.markCleared(candidate.notificationId, now)
        cleared += 1
      } catch (error) {
        failed += 1
        this.#logger?.error('Birthday promotion cleanup failed', error)
      }
    }

    return { cleared, failed, notified }
  }

  /**
   * Acquires a retry lease, notifies, and records successful delivery.
   *
   * @param card - Claimed birthday card.
   * @param year - Notification reservation year.
   * @param promoText - Configured birthday promotion.
   * @param now - Attempt instant.
   */
  async #attemptNotification(
    card: BirthdayCard,
    year: number,
    promoText: string,
    now: Date
  ): Promise<NotificationAttemptResult> {
    const reserved = await this.#repository.reserve(card.customerId, year, now)
    if (!reserved) return 'skipped'

    try {
      await this.#notifier.notify(card.cardId, promoText, year)
      await this.#repository.markNotified(card.customerId, year, now)
      return 'notified'
    } catch (error) {
      this.#logger?.error('Birthday wallet notification failed', error)
      return 'failed'
    }
  }
}
