import { closeDatabase, db } from '@/infrastructure/db/client'
import { admins } from '@/infrastructure/db/schema'
import { hash } from '@node-rs/argon2'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const inputSchema = z.object({
  email: z.email(),
  password: z.string().min(12),
})

const input = inputSchema.parse({
  email: process.argv[2]?.trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD,
})

try {
  const passwordHash = await hash(input.password)
  const existingAdmin = await db.query.admins.findFirst({
    where: eq(admins.email, input.email),
  })

  if (existingAdmin) {
    await db
      .update(admins)
      .set({ passwordHash })
      .where(eq(admins.id, existingAdmin.id))
    process.stdout.write(`Admin ${input.email} updated.\n`)
  } else {
    await db.insert(admins).values({
      email: input.email,
      passwordHash,
    })
    process.stdout.write(`Admin ${input.email} created.\n`)
  }
} finally {
  await closeDatabase()
}
