import { z } from 'zod'

export const stampStripSearchParamsSchema = z.object({
  goal: z.coerce.number().int().min(1).max(30),
  stamps: z.coerce.number().int().min(0).max(100),
})

export type StampStripSearchParams = z.infer<
  typeof stampStripSearchParamsSchema
>
