import { env } from '@/config/env'
import { BirthdayService } from '@/domain/birthdays/birthday-service'
import { authorizeCronRequest } from '@/infrastructure/birthdays/cron-auth'
import { DrizzleBirthdayRepository } from '@/infrastructure/birthdays/drizzle-birthday-repository'
import { WalletBirthdayNotifier } from '@/infrastructure/birthdays/wallet-birthday-notifier'
import { ServerLogger } from '@/infrastructure/server-logger'

/**
 * Runs the daily birthday reservation, notification, and cleanup cycle.
 *
 * @param request - Authenticated Vercel Cron request.
 */
export async function GET(request: Request): Promise<Response> {
  const unauthorized = authorizeCronRequest(
    request.headers.get('authorization'),
    env.CRON_SECRET
  )
  if (unauthorized) return unauthorized

  const service = new BirthdayService({
    logger: new ServerLogger(),
    notifier: new WalletBirthdayNotifier(),
    repository: new DrizzleBirthdayRepository(),
  })
  const result = await service.run(new Date())
  return Response.json(result)
}
