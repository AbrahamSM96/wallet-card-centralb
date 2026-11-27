import { env } from '@/config/env'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

const globalDatabase = globalThis as unknown as {
  databaseClient?: ReturnType<typeof postgres>
}

const databaseClient =
  globalDatabase.databaseClient ??
  postgres(env.DATABASE_URL, {
    max: 1,
    prepare: false,
  })

if (process.env.NODE_ENV !== 'production') {
  globalDatabase.databaseClient = databaseClient
}

export const db = drizzle(databaseClient, { schema })

export type DatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0]
export type DatabaseExecutor = typeof db | DatabaseTransaction

/** Closes the underlying postgres.js connections used by one-shot scripts. */
export async function closeDatabase(): Promise<void> {
  await databaseClient.end({ timeout: 5 })
}
