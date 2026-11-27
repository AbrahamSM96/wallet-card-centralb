import { sql } from 'drizzle-orm'
import {
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const cardPlatform = pgEnum('card_platform', ['apple', 'google'])
export const cardStatus = pgEnum('card_status', ['active', 'flagged', 'voided'])
export const stampSource = pgEnum('stamp_source', [
  'manual',
  'order',
  'referral_bonus',
])

export const admins = pgTable('admins', {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  email: text('email').notNull().unique(),
  id: uuid('id').defaultRandom().primaryKey(),
  passwordHash: text('password_hash').notNull(),
})

export const settings = pgTable(
  'settings',
  {
    birthdayPromoText: text('birthday_promo_text').notNull(),
    id: integer('id').default(1).primaryKey(),
    rewardText: text('reward_text').notNull(),
    stampsRequired: integer('stamps_required').default(10).notNull(),
    storeLatitude: doublePrecision('store_latitude').notNull(),
    storeLongitude: doublePrecision('store_longitude').notNull(),
    storeName: text('store_name').notNull(),
    storeRelevantText: text('store_relevant_text').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [check('settings_single_row_check', sql`${table.id} = 1`)]
)

export const customers = pgTable('customers', {
  birthday: date('birthday').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  email: text('email').unique(),
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  privacyAcceptedAt: timestamp('privacy_accepted_at', {
    withTimezone: true,
  }),
})

export const cards = pgTable(
  'cards',
  {
    appleAuthToken: text('apple_auth_token'),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    id: uuid('id').defaultRandom().primaryKey(),
    platform: cardPlatform('platform'),
    publicCode: text('public_code').notNull().unique(),
    stampCount: integer('stamp_count').default(0).notNull(),
    status: cardStatus('status').default('active').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('cards_customer_id_index').on(table.customerId),
    uniqueIndex('cards_customer_active_unique')
      .on(table.customerId)
      .where(sql`${table.status} <> 'voided'`),
  ]
)

export const claimTokens = pgTable(
  'claim_tokens',
  {
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    invalidatedAt: timestamp('invalidated_at', { withTimezone: true }),
    tokenHash: text('token_hash').notNull().unique(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (table) => [index('claim_tokens_card_id_index').on(table.cardId)]
)

export const stamps = pgTable(
  'stamps',
  {
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdByAdminId: uuid('created_by_admin_id').references(() => admins.id),
    id: uuid('id').defaultRandom().primaryKey(),
    note: text('note'),
    orderNumber: text('order_number').unique(),
    source: stampSource('source').notNull(),
  },
  (table) => [index('stamps_card_id_index').on(table.cardId)]
)

export const redemptions = pgTable('redemptions', {
  cardId: uuid('card_id')
    .notNull()
    .references(() => cards.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdByAdminId: uuid('created_by_admin_id')
    .notNull()
    .references(() => admins.id),
  id: uuid('id').defaultRandom().primaryKey(),
  stampsUsed: integer('stamps_used').notNull(),
})

export const referrals = pgTable('referrals', {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  id: uuid('id').defaultRandom().primaryKey(),
  referredCustomerId: uuid('referred_customer_id')
    .notNull()
    .unique()
    .references(() => customers.id),
  referrerCardId: uuid('referrer_card_id')
    .notNull()
    .references(() => cards.id),
  rewardSkippedReason: text('reward_skipped_reason'),
  rewardedAt: timestamp('rewarded_at', { withTimezone: true }),
})

export const appleRegistrations = pgTable(
  'apple_registrations',
  {
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deviceLibraryId: text('device_library_id').notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    pushToken: text('push_token').notNull(),
  },
  (table) => [
    uniqueIndex('apple_registration_device_card_unique').on(
      table.deviceLibraryId,
      table.cardId
    ),
  ]
)

export const birthdayNotifications = pgTable(
  'birthday_notifications',
  {
    clearedAt: timestamp('cleared_at', { withTimezone: true }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    id: uuid('id').defaultRandom().primaryKey(),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    year: integer('year').notNull(),
  },
  (table) => [
    uniqueIndex('birthday_notification_customer_year_unique').on(
      table.customerId,
      table.year
    ),
  ]
)
