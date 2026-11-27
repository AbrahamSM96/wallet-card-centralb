import { getAppleWalletConfig } from '@/infrastructure/wallet/apple/apple-wallet-config'
import { listUpdatedAppleSerialNumbers } from '@/infrastructure/wallet/apple/apple-web-service-repository'
import { z } from 'zod'

const pathSchema = z.object({
  deviceLibraryIdentifier: z.string().min(1).max(256),
  passTypeIdentifier: z.string().min(1).max(256),
})

type SerialRouteContext = {
  params: Promise<{
    deviceLibraryIdentifier: string
    passTypeIdentifier: string
  }>
}

/**
 * Lists registered passes changed after Apple's update tag.
 *
 * @param request - Wallet serial-number request.
 * @param context - Dynamic device and pass type values.
 */
export async function GET(
  request: Request,
  context: SerialRouteContext
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

  const url = new URL(request.url)
  const result = await listUpdatedAppleSerialNumbers(
    parsedPath.data.deviceLibraryIdentifier,
    url.searchParams.get('passesUpdatedSince')
  )
  return result ? Response.json(result) : new Response(null, { status: 204 })
}
