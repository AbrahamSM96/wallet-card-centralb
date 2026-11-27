import { randomBytes } from 'node:crypto'

import { env } from '@/config/env'
import {
  getMexicoCityDate,
  isBirthdayPromotionActive,
} from '@/domain/birthdays/birthday-date'
import type { WalletCard } from '@/domain/loyalty/wallet-provider'
import { db } from '@/infrastructure/db/client'
import {
  birthdayNotifications,
  cards,
  customers,
  settings,
} from '@/infrastructure/db/schema'
import { desc, eq } from 'drizzle-orm'

/**
 * Loads the trusted presentation data needed by wallet adapters.
 *
 * @param cardId - Card identifier.
 */
export async function getWalletCard(
  cardId: string
): Promise<WalletCard | null> {
  const rows = await db
    .select({
      accountName: customers.name,
      appleAuthToken: cards.appleAuthToken,
      birthday: customers.birthday,
      birthdayPromoText: settings.birthdayPromoText,
      cardId: cards.id,
      customerId: customers.id,
      platform: cards.platform,
      publicCode: cards.publicCode,
      rewardText: settings.rewardText,
      stampCount: cards.stampCount,
      stampsRequired: settings.stampsRequired,
      status: cards.status,
      storeLatitude: settings.storeLatitude,
      storeLongitude: settings.storeLongitude,
      storeName: settings.storeName,
      storeRelevantText: settings.storeRelevantText,
    })
    .from(cards)
    .innerJoin(customers, eq(cards.customerId, customers.id))
    .innerJoin(settings, eq(settings.id, 1))
    .where(eq(cards.id, cardId))
    .limit(1)
  const card = rows[0]
  if (!card) return null

  const notificationRows = await db
    .select({
      clearedAt: birthdayNotifications.clearedAt,
      year: birthdayNotifications.year,
    })
    .from(birthdayNotifications)
    .where(eq(birthdayNotifications.customerId, card.customerId))
    .orderBy(desc(birthdayNotifications.year))
    .limit(1)
  const notification = notificationRows[0]
  const birthdayPromoActive = Boolean(
    notification &&
    !notification.clearedAt &&
    isBirthdayPromotionActive(
      card.birthday,
      notification.year,
      getMexicoCityDate(new Date())
    )
  )
  return {
    accountName: card.accountName,
    appleAuthToken: card.appleAuthToken,
    birthdayPromoActive,
    birthdayPromoText: card.birthdayPromoText,
    cardId: card.cardId,
    platform: card.platform,
    publicCode: card.publicCode,
    referralUrl: `${env.APP_URL.replace(/\/$/, '')}/r/${card.publicCode}`,
    rewardText: card.rewardText,
    stampCount: card.stampCount,
    stampsRequired: card.stampsRequired,
    status: card.status,
    storeLatitude: card.storeLatitude,
    storeLongitude: card.storeLongitude,
    storeName: card.storeName,
    storeRelevantText: card.storeRelevantText,
  }
}

/**
 * Returns the stable random Apple web-service token for a card.
 *
 * @param cardId - Card identifier.
 */
export async function ensureAppleAuthToken(cardId: string): Promise<string> {
  return db.transaction(async (transaction) => {
    const rows = await transaction
      .select({ appleAuthToken: cards.appleAuthToken })
      .from(cards)
      .where(eq(cards.id, cardId))
      .limit(1)
      .for('update')
    const card = rows[0]
    if (!card) throw new Error('Wallet card data was not found')
    if (card.appleAuthToken) return card.appleAuthToken

    const appleAuthToken = randomBytes(32).toString('hex')
    await transaction
      .update(cards)
      .set({ appleAuthToken })
      .where(eq(cards.id, cardId))
    return appleAuthToken
  })
}
