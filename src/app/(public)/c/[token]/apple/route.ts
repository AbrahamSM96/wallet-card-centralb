import { loyaltyService } from '@/infrastructure/loyalty-service'
import { ServerLogger } from '@/infrastructure/server-logger'
import { AppleWalletConfigurationError } from '@/infrastructure/wallet/apple/apple-wallet-config'
import { WalletSyncService } from '@/infrastructure/wallet/wallet-sync-service'
import { z } from 'zod'

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)

type AppleClaimRouteContext = {
  params: Promise<{ token: string }>
}

/**
 * Signs and downloads an Apple pass before consuming its claim token.
 *
 * @param request - Public Apple Wallet claim request.
 * @param context - Dynamic one-time claim token.
 */
export async function POST(
  request: Request,
  context: AppleClaimRouteContext
): Promise<Response> {
  const parsed = tokenSchema.safeParse((await context.params).token)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid claim token' }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const privacyAccepted = formData.get('privacyAccepted') === 'on'
    const claimContext = await loyaltyService.getClaimContext(parsed.data)
    if (claimContext.privacyRequired && !privacyAccepted) {
      return Response.json(
        { error: 'Privacy acceptance is required' },
        { status: 400 }
      )
    }
    const cardId = claimContext.cardId
    const issueResult = await new WalletSyncService().issue(cardId, 'apple')
    if (!issueResult.passData) {
      return Response.json({ error: 'Pass generation failed' }, { status: 500 })
    }
    await loyaltyService.claimCard({
      platform: 'apple',
      privacyAccepted,
      token: parsed.data,
    })
    return new Response(Buffer.from(issueResult.passData), {
      headers: {
        'Content-Disposition': `attachment; filename="central-brownies-${cardId}.pkpass"`,
        'Content-Type': 'application/vnd.apple.pkpass',
      },
      status: 200,
    })
  } catch (error) {
    new ServerLogger().error('Apple Wallet claim failed', error)
    if (error instanceof AppleWalletConfigurationError) {
      return Response.json(
        { error: 'Apple Wallet is not configured' },
        { status: 503 }
      )
    }
    return Response.json(
      { error: 'Apple pass issuance failed' },
      { status: 400 }
    )
  }
}
