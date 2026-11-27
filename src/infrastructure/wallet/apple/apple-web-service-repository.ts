import { db } from '@/infrastructure/db/client'
import { appleRegistrations, cards } from '@/infrastructure/db/schema'
import { and, desc, eq, gt } from 'drizzle-orm'

export type ApplePassRecord = {
  appleAuthToken: string | null
  id: string
  updatedAt: Date
}

export type AppleSerialNumbers = {
  lastUpdated: string
  serialNumbers: string[]
}

/**
 * Loads the card record identified by Apple's pass serial number.
 *
 * @param serialNumber - Pass serial number, equal to the card UUID.
 */
export async function getApplePassRecord(
  serialNumber: string
): Promise<ApplePassRecord | null> {
  const rows = await db
    .select({
      appleAuthToken: cards.appleAuthToken,
      id: cards.id,
      updatedAt: cards.updatedAt,
    })
    .from(cards)
    .where(eq(cards.id, serialNumber))
    .limit(1)
  return rows[0] ?? null
}

/**
 * Lists APNs push tokens registered for a card.
 *
 * @param cardId - Card identifier.
 */
export async function listApplePushTokens(cardId: string): Promise<string[]> {
  const rows = await db
    .select({ pushToken: appleRegistrations.pushToken })
    .from(appleRegistrations)
    .where(eq(appleRegistrations.cardId, cardId))
  return rows.map((row) => row.pushToken)
}

/**
 * Returns registered serials updated after Apple's opaque update tag.
 *
 * @param deviceLibraryId - Apple device library identifier.
 * @param passesUpdatedSince - Previous millisecond update tag.
 */
export async function listUpdatedAppleSerialNumbers(
  deviceLibraryId: string,
  passesUpdatedSince: string | null
): Promise<AppleSerialNumbers | null> {
  const parsedTag = Number(passesUpdatedSince)
  const since = Number.isFinite(parsedTag) ? new Date(parsedTag) : null
  const conditions = [eq(appleRegistrations.deviceLibraryId, deviceLibraryId)]
  if (since) conditions.push(gt(cards.updatedAt, since))

  const rows = await db
    .select({ id: cards.id, updatedAt: cards.updatedAt })
    .from(appleRegistrations)
    .innerJoin(cards, eq(appleRegistrations.cardId, cards.id))
    .where(and(...conditions))
    .orderBy(desc(cards.updatedAt))
  if (rows.length === 0) return null

  return {
    lastUpdated: String(rows[0]?.updatedAt.getTime()),
    serialNumbers: rows.map((row) => row.id),
  }
}

/**
 * Removes one device registration for a card.
 *
 * @param cardId - Card identifier.
 * @param deviceLibraryId - Apple device library identifier.
 */
export async function removeAppleRegistration(
  cardId: string,
  deviceLibraryId: string
): Promise<void> {
  await db
    .delete(appleRegistrations)
    .where(
      and(
        eq(appleRegistrations.cardId, cardId),
        eq(appleRegistrations.deviceLibraryId, deviceLibraryId)
      )
    )
}
