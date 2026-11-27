import { existsSync } from 'node:fs'

import { defineConfig } from 'drizzle-kit'

// Bun may preload `.env` before this file runs. Explicitly clear DATABASE_URL
// so the documented local-first precedence remains true for migrations.
if (existsSync('.env.local')) {
  delete process.env.DATABASE_URL
  process.loadEnvFile('.env.local')
} else if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

// Migrations use a direct connection because Neon's transaction-mode pooler
// is intended for application queries, not schema changes.
const directUrl = (process.env.DATABASE_URL ?? '').replace('-pooler.', '.')

export default defineConfig({
  dbCredentials: { url: directUrl },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/infrastructure/db/schema.ts',
})
