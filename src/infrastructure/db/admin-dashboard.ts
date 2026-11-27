import { db } from '@/infrastructure/db/client'
import {
  appleRegistrations,
  cards,
  customers,
  redemptions,
  referrals,
  settings,
  stamps,
} from '@/infrastructure/db/schema'
import { normalizeCustomerSearch } from '@/lib/customer-search'
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  ne,
  or,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

const referredCustomers = alias(customers, 'referred_customers')

export type AdminCounts = {
  activeCards: number
  customers: number
  flaggedCards: number
}

export type CustomerSummary = {
  cardId: string | null
  email: string | null
  id: string
  name: string
  phone: string
  publicCode: string | null
  stampCount: number
  status: 'active' | 'flagged' | 'voided' | null
}

export type CustomerDetail = {
  appleDevices: Array<{
    createdAt: Date
    deviceLibraryId: string
  }>
  birthday: string
  card: {
    claimedAt: Date | null
    id: string
    platform: 'apple' | 'google' | null
    publicCode: string
    stampCount: number
    status: 'active' | 'flagged' | 'voided'
  } | null
  email: string | null
  id: string
  name: string
  phone: string
  privacyAcceptedAt: Date | null
  redemptions: Array<{
    createdAt: Date
    id: string
    stampsUsed: number
  }>
  stamps: Array<{
    createdAt: Date
    id: string
    note: string | null
    orderNumber: string | null
    source: 'manual' | 'order' | 'referral_bonus'
  }>
}

export type ReferralSummary = {
  createdAt: Date
  id: string
  referredName: string
  referrerPublicCode: string
  rewardSkippedReason: string | null
  rewardedAt: Date | null
}

export type FlaggedCardSummary = {
  customerId: string
  customerName: string
  phone: string
  publicCode: string
  stampCount: number
}

export type AdminSettings = {
  birthdayPromoText: string
  rewardText: string
  stampsRequired: number
  storeLatitude: number
  storeLongitude: number
  storeName: string
  storeRelevantText: string
}

export type SettingsWalletCard = {
  id: string
  platform: 'apple' | 'google'
}

/** Returns the compact metrics shown on the mobile dashboard. */
export async function getAdminCounts(): Promise<AdminCounts> {
  const [customerRows, activeCardRows, flaggedCardRows] = await Promise.all([
    db.select({ value: count() }).from(customers),
    db.select({ value: count() }).from(cards).where(ne(cards.status, 'voided')),
    db
      .select({ value: count() })
      .from(cards)
      .where(eq(cards.status, 'flagged')),
  ])

  return {
    activeCards: Number(activeCardRows[0]?.value ?? 0),
    customers: Number(customerRows[0]?.value ?? 0),
    flaggedCards: Number(flaggedCardRows[0]?.value ?? 0),
  }
}

/**
 * Searches customers by name, phone, or current public card code.
 *
 * @param query - Free-text search query.
 */
export async function searchCustomers(
  query: string
): Promise<CustomerSummary[]> {
  const normalizedQuery = query.trim()
  const { escapedQuery, phoneDigits } = normalizeCustomerSearch(normalizedQuery)
  const pattern = `%${escapedQuery}%`
  const where = normalizedQuery
    ? or(
        ilike(customers.name, pattern),
        ilike(customers.phone, pattern),
        ilike(cards.publicCode, pattern),
        phoneDigits
          ? ilike(
              sql<string>`regexp_replace(${customers.phone}, '[^0-9]', '', 'g')`,
              `%${phoneDigits}%`
            )
          : undefined
      )
    : undefined

  const rows = await db
    .select({
      cardId: cards.id,
      email: customers.email,
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      publicCode: cards.publicCode,
      stampCount: cards.stampCount,
      status: cards.status,
    })
    .from(customers)
    .leftJoin(
      cards,
      and(eq(cards.customerId, customers.id), ne(cards.status, 'voided'))
    )
    .where(where)
    .orderBy(customers.name)
    .limit(50)

  return rows.map((row) => ({
    ...row,
    stampCount: row.stampCount ?? 0,
  }))
}

/**
 * Loads one customer, current card, and ledger history.
 *
 * @param customerId - Customer identifier.
 */
export async function getCustomerDetail(
  customerId: string
): Promise<CustomerDetail | null> {
  const customerRows = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)
  const customer = customerRows[0]
  if (!customer) return null

  const [cardRows, stampRows, redemptionRows, appleDeviceRows] =
    await Promise.all([
      db
        .select({
          claimedAt: cards.claimedAt,
          id: cards.id,
          platform: cards.platform,
          publicCode: cards.publicCode,
          stampCount: cards.stampCount,
          status: cards.status,
        })
        .from(cards)
        .where(
          and(eq(cards.customerId, customerId), ne(cards.status, 'voided'))
        )
        .limit(1),
      db
        .select({
          createdAt: stamps.createdAt,
          id: stamps.id,
          note: stamps.note,
          orderNumber: stamps.orderNumber,
          source: stamps.source,
        })
        .from(stamps)
        .innerJoin(cards, eq(stamps.cardId, cards.id))
        .where(eq(cards.customerId, customerId))
        .orderBy(desc(stamps.createdAt)),
      db
        .select({
          createdAt: redemptions.createdAt,
          id: redemptions.id,
          stampsUsed: redemptions.stampsUsed,
        })
        .from(redemptions)
        .innerJoin(cards, eq(redemptions.cardId, cards.id))
        .where(eq(cards.customerId, customerId))
        .orderBy(desc(redemptions.createdAt)),
      db
        .select({
          createdAt: appleRegistrations.createdAt,
          deviceLibraryId: appleRegistrations.deviceLibraryId,
        })
        .from(appleRegistrations)
        .innerJoin(cards, eq(appleRegistrations.cardId, cards.id))
        .where(
          and(eq(cards.customerId, customerId), ne(cards.status, 'voided'))
        )
        .orderBy(appleRegistrations.createdAt),
    ])

  return {
    appleDevices: appleDeviceRows,
    birthday: customer.birthday,
    card: cardRows[0] ?? null,
    email: customer.email,
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    privacyAcceptedAt: customer.privacyAcceptedAt,
    redemptions: redemptionRows,
    stamps: stampRows,
  }
}

/**
 * Returns the trusted customer phone associated with a card.
 *
 * @param cardId - Card identifier supplied by an authenticated action.
 */
export async function getCustomerPhoneByCardId(
  cardId: string
): Promise<string | null> {
  const rows = await db
    .select({ phone: customers.phone })
    .from(cards)
    .innerJoin(customers, eq(cards.customerId, customers.id))
    .where(eq(cards.id, cardId))
    .limit(1)
  return rows[0]?.phone ?? null
}

/**
 * Returns a trusted customer phone for replacement-card delivery.
 *
 * @param customerId - Customer identifier supplied by an authenticated action.
 */
export async function getCustomerPhone(
  customerId: string
): Promise<string | null> {
  const rows = await db
    .select({ phone: customers.phone })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)
  return rows[0]?.phone ?? null
}

/** Returns the most recent referrals for administrative review. */
export async function listReferrals(): Promise<ReferralSummary[]> {
  const rows = await db
    .select({
      createdAt: referrals.createdAt,
      id: referrals.id,
      referredName: referredCustomers.name,
      referrerPublicCode: cards.publicCode,
      rewardSkippedReason: referrals.rewardSkippedReason,
      rewardedAt: referrals.rewardedAt,
    })
    .from(referrals)
    .innerJoin(cards, eq(referrals.referrerCardId, cards.id))
    .innerJoin(
      referredCustomers,
      eq(referrals.referredCustomerId, referredCustomers.id)
    )
    .orderBy(desc(referrals.createdAt))
    .limit(100)

  return rows
}

/** Returns every card marked for possible multi-device misuse. */
export async function listFlaggedCards(): Promise<FlaggedCardSummary[]> {
  return db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      phone: customers.phone,
      publicCode: cards.publicCode,
      stampCount: cards.stampCount,
    })
    .from(cards)
    .innerJoin(customers, eq(cards.customerId, customers.id))
    .where(eq(cards.status, 'flagged'))
    .orderBy(customers.name)
}

/** Returns the single editable settings row. */
export async function getAdminSettings(): Promise<AdminSettings | null> {
  const rows = await db
    .select({
      birthdayPromoText: settings.birthdayPromoText,
      rewardText: settings.rewardText,
      stampsRequired: settings.stampsRequired,
      storeLatitude: settings.storeLatitude,
      storeLongitude: settings.storeLongitude,
      storeName: settings.storeName,
      storeRelevantText: settings.storeRelevantText,
    })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1)
  return rows[0] ?? null
}

/**
 * Updates all administrator-editable settings in one statement.
 *
 * @param input - Validated settings values.
 */
export async function updateAdminSettings(
  input: AdminSettings
): Promise<SettingsWalletCard[]> {
  return db.transaction(async (transaction) => {
    await transaction.update(settings).set(input).where(eq(settings.id, 1))
    const updatedAt = new Date()
    const rows = await transaction
      .update(cards)
      .set({ updatedAt })
      .where(and(isNotNull(cards.platform), ne(cards.status, 'voided')))
      .returning({ id: cards.id, platform: cards.platform })
    return rows.filter(
      (card): card is SettingsWalletCard => card.platform !== null
    )
  })
}
