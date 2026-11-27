import { ServerLogger } from '@/infrastructure/server-logger'
import { z } from 'zod'

const logSchema = z.object({
  logs: z.array(z.string().max(2_000)).max(100),
})

/**
 * Records diagnostic messages sent by Apple Wallet.
 *
 * @param request - Wallet logging request.
 */
export async function POST(request: Request): Promise<Response> {
  const parsed = logSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
  const logger = new ServerLogger()
  for (const message of parsed.data.logs) {
    logger.error('Apple Wallet client log', message)
  }
  return new Response(null, { status: 200 })
}
