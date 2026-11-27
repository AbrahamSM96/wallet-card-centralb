import { closeDatabase, db } from '@/infrastructure/db/client'
import { settings } from '@/infrastructure/db/schema'

const defaultSettings: typeof settings.$inferInsert = {
  birthdayPromoText: '¡Feliz cumple! Tienes una promo especial esta semana.',
  id: 1,
  rewardText: 'Brownie de regalo',
  stampsRequired: 10,
  storeLatitude: 20.116710019053915,
  storeLongitude: -98.74697712947373,
  storeName: 'Central Brownies',
  storeRelevantText: 'Estás a unos pasos de Central Brownies. ¿Se te antoja?',
}

try {
  await db.insert(settings).values(defaultSettings).onConflictDoNothing()
  process.stdout.write('Settings seed completed.\n')
} finally {
  await closeDatabase()
}
