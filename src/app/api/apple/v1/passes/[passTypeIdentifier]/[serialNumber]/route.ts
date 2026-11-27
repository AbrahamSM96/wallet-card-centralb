import { getAppleWalletConfig } from '@/infrastructure/wallet/apple/apple-wallet-config'
import {
  appleUnauthorizedResponse,
  isApplePassAuthorized,
} from '@/infrastructure/wallet/apple/apple-web-service-auth'
import { getApplePassRecord } from '@/infrastructure/wallet/apple/apple-web-service-repository'
import { WalletSyncService } from '@/infrastructure/wallet/wallet-sync-service'
import { z } from 'zod'

const pathSchema = z.object({
  passTypeIdentifier: z.string().min(1).max(256),
  serialNumber: z.uuid(),
})

type PassRouteContext = {
  params: Promise<{
    passTypeIdentifier: string
    serialNumber: string
  }>
}

/**
 * Returns the latest signed pass or 304 when the cached pass is current.
 *
 * @param request - Wallet pass update request.
 * @param context - Dynamic pass identifiers.
 */
export async function GET(
  request: Request,
  context: PassRouteContext
): Promise<Response> {
  const parsedPath = pathSchema.safeParse(await context.params)
  if (!parsedPath.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (
    parsedPath.data.passTypeIdentifier !==
    getAppleWalletConfig().passTypeIdentifier
  ) {
    return new Response(null, { status: 404 })
  }

  const card = await getApplePassRecord(parsedPath.data.serialNumber)
  if (!card) return new Response(null, { status: 404 })
  if (
    !isApplePassAuthorized(
      request.headers.get('authorization'),
      card.appleAuthToken
    )
  ) {
    return appleUnauthorizedResponse()
  }

  const ifModifiedSince = request.headers.get('if-modified-since')
  const cachedAt = ifModifiedSince ? Date.parse(ifModifiedSince) : Number.NaN
  if (
    Number.isFinite(cachedAt) &&
    Math.floor(card.updatedAt.getTime() / 1000) <= Math.floor(cachedAt / 1000)
  ) {
    return new Response(null, { status: 304 })
  }

  const issueResult = await new WalletSyncService().issue(card.id, 'apple')
  if (!issueResult.passData) {
    return Response.json({ error: 'Pass generation failed' }, { status: 500 })
  }
  return new Response(Buffer.from(issueResult.passData), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': card.updatedAt.toUTCString(),
    },
    status: 200,
  })
}
