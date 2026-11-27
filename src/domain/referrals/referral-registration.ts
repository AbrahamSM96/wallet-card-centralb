import { normalizeMexicanPhone } from '@/lib/claim-delivery'
import { z } from 'zod'

export const referralRegistrationSchema = z.object({
  birthday: z.iso.date(),
  email: z.email(),
  honeypot: z.string().max(0),
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .transform(normalizeMexicanPhone)
    .pipe(z.string().regex(/^\+52\d{10}$/)),
  privacyAccepted: z.literal('on'),
  referrerPublicCode: z
    .string()
    .regex(/^CB-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/),
})
